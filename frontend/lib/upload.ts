// lib/upload.ts
import { apiFetch } from "@/lib/config";

export interface PresignedUrlResponse {
  presignedUrl: string;
  publicUrl: string;
  key: string;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

class UploadService {
  private getToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  /**
   * Get a presigned URL for uploading a file
   */
  async getPresignedUrl(
    filename: string,
    contentType: string,
    folder: string = "misc",
  ): Promise<PresignedUrlResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch("/uploads/presigned-url", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename,
        contentType,
        folder,
      }),
    });
  }

  /**
   * Upload a file directly to S3 using the presigned URL
   */
  async uploadFile(
    file: File,
    folder: string = "misc",
    options?: UploadOptions,
  ): Promise<string> {
    try {
      // Step 1: Get presigned URL
      const { presignedUrl, publicUrl } = await this.getPresignedUrl(
        file.name,
        file.type,
        folder,
      );

      // Step 2: Upload file directly to S3
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.open("PUT", presignedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        // Track progress
        if (options?.onProgress) {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              options.onProgress?.(percent);
            }
          });
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            options?.onSuccess?.(publicUrl);
            resolve(publicUrl);
          } else {
            const error = new Error(`Upload failed: ${xhr.statusText}`);
            options?.onError?.(error);
            reject(error);
          }
        };

        xhr.onerror = () => {
          const error = new Error("Upload failed");
          options?.onError?.(error);
          reject(error);
        };

        xhr.send(file);
      });
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    folder: string = "misc",
    onProgress?: (fileIndex: number, percent: number) => void,
  ): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const url = await this.uploadFile(files[i], folder, {
        onProgress: (percent) => {
          onProgress?.(i, percent);
        },
      });
      urls.push(url);
    }

    return urls;
  }

  /**
   * Upload a file with a simple API (using fetch)
   */
  async uploadFileSimple(file: File, folder: string = "misc"): Promise<string> {
    const { presignedUrl, publicUrl } = await this.getPresignedUrl(
      file.name,
      file.type,
      folder,
    );

    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return publicUrl;
  }
}

export const uploadService = new UploadService();
