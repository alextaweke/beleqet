// components/FileUpload.tsx
"use client";

import { useState, useRef, DragEvent } from "react";
import {
  Upload,
  X,
  File,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { uploadService } from "@/lib/upload";

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
  folder = "misc",
  multiple = false,
  accept = "image/*,.pdf,.doc,.docx,.txt",
  maxSize = 10,
  label = "Upload Files",
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name} exceeds ${maxSize}MB limit`);
        return;
      }

      // Check file type
      const acceptTypes = accept.split(",").map((t) => t.trim());
      const isValidType = acceptTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(new RegExp(type.replace("*", ".*")));
      });

      if (!isValidType) {
        errors.push(`${file.name} has an unsupported file type`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(", "));
      setTimeout(() => setError(null), 5000);
    }

    if (multiple) {
      setFiles((prev) => [...prev, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const urls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadService.uploadFile(file, folder, {
          onProgress: (percent) => {
            setProgress((prev) => ({ ...prev, [file.name]: percent }));
          },
        });
        urls.push(url);
      }

      setUploadedUrls(urls);
      onUploadComplete(urls);
      setFiles([]);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onUploadError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[files[index].name];
      return newProgress;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <Image className="h-5 w-5 text-blue-500" />;
    if (file.type === "application/pdf")
      return <File className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? "border-green-500 bg-green-50"
            : files.length > 0
              ? "border-gray-300 bg-gray-50"
              : "border-gray-300 hover:border-green-400 hover:bg-green-50/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-12 w-12 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-500">
            Drag & drop files here, or click to select
          </p>
          <p className="text-xs text-gray-400">
            Supported: {accept.split(",").join(", ")} • Max: {maxSize}MB
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Select Files
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(file)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {progress[file.name] !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${progress[file.name]}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {progress[file.name]}%
                    </span>
                  </div>
                )}

                {!uploading && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Upload Button */}
          {!uploading && files.length > 0 && (
            <button
              type="button"
              onClick={handleUpload}
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload {files.length} file{files.length > 1 ? "s" : ""}
            </button>
          )}

          {uploading && (
            <div className="flex items-center justify-center p-3">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              <span className="ml-2 text-sm text-gray-600">Uploading...</span>
            </div>
          )}
        </div>
      )}

      {/* Uploaded URLs */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
          {uploadedUrls.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-sm text-green-700"
            >
              <CheckCircle className="h-4 w-4 shrink-0" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline truncate"
              >
                {url.split("/").pop() || url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
