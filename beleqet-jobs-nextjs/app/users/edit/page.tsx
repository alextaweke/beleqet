// app/profile/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateUserProfile, getUserProfile } from "@/lib/userApi";
import {
  User,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  FileText,
  Briefcase,
  Tag,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Image,
  Send,
} from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  bio: string;
  headline: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  defaultResumeUrl: string;
  telegramId: string;
  skills: string[];
  avatarUrl: string;
}

interface FieldError {
  field: string;
  message: string;
}

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    bio: "",
    headline: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    defaultResumeUrl: "",
    telegramId: "",
    skills: [],
    avatarUrl: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login first.");
          setLoading(false);
          return;
        }

        const data = await getUserProfile(token);
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          headline: data.headline || "",
          portfolioUrl: data.portfolioUrl || "",
          githubUrl: data.githubUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          defaultResumeUrl: data.defaultResumeUrl || "",
          telegramId: data.telegramId || "",
          skills: data.skills || [],
          avatarUrl: data.avatarUrl || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    setFieldErrors((prev) => prev.filter((err) => err.field !== name));
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldError[] = [];

    // Required fields
    if (!formData.firstName.trim()) {
      errors.push({ field: "firstName", message: "First name is required" });
    }
    if (!formData.lastName.trim()) {
      errors.push({ field: "lastName", message: "Last name is required" });
    }

    // URL validations
    const urlFields = [
      { field: "avatarUrl", label: "Avatar URL" },
      { field: "portfolioUrl", label: "Portfolio URL" },
      { field: "githubUrl", label: "GitHub URL" },
      { field: "linkedinUrl", label: "LinkedIn URL" },
      { field: "defaultResumeUrl", label: "Resume URL" },
    ];

    for (const { field, label } of urlFields) {
      const value = formData[field as keyof FormData] as string;
      if (value && !validateUrl(value)) {
        errors.push({
          field,
          message: `${label} must be a valid URL (e.g., https://example.com)`,
        });
      }
    }

    setFieldErrors(errors);
    return errors.length === 0;
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please login first.");
        setSaving(false);
        return;
      }

      const {
        firstName,
        lastName,
        phone,
        location,
        bio,
        headline,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        defaultResumeUrl,
        telegramId,
        skills,
        avatarUrl,
      } = formData;

      await updateUserProfile(token, {
        firstName,
        lastName,
        phone,
        location,
        bio,
        headline,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        defaultResumeUrl,

        skills,
        avatarUrl,
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        router.push("/users/profile");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getFieldError = (fieldName: string): string => {
    const error = fieldErrors.find((err) => err.field === fieldName);
    return error ? error.message : "";
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 mt-4 md:mt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="users/profile"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Update your personal information and professional details
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-700 flex-1">{success}</p>
          <button
            onClick={() => setSuccess("")}
            className="text-green-500 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                  getFieldError("firstName")
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300"
                }`}
                placeholder="John"
                required
              />
              {getFieldError("firstName") && (
                <p className="text-xs text-red-500 mt-1.5">
                  {getFieldError("firstName")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                  getFieldError("lastName")
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Doe"
                required
              />
              {getFieldError("lastName") && (
                <p className="text-xs text-red-500 mt-1.5">
                  {getFieldError("lastName")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="h-4 w-4 inline mr-1.5 text-gray-400" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="h-4 w-4 inline mr-1.5 text-gray-400" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
        </div>

        {/* Avatar URL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="h-5 w-5 text-gray-500" />
            Profile Picture
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Avatar URL{" "}
              <span className="text-gray-400">(must be a valid URL)</span>
            </label>
            <input
              type="url"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                getFieldError("avatarUrl")
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300"
              }`}
              placeholder="https://example.com/avatar.jpg"
            />
            {getFieldError("avatarUrl") && (
              <p className="text-xs text-red-500 mt-1.5">
                {getFieldError("avatarUrl")}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1.5">
              Enter a URL for your profile picture (e.g.,
              https://example.com/image.jpg)
            </p>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            Professional Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Headline
              </label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="Senior Software Engineer at Google"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-500" />
            Skills
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
              placeholder="Add a skill (e.g., React, Python)"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium whitespace-nowrap flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-green-500 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No skills added yet. Add your skills above.
            </p>
          )}
        </div>

        {/* Links & Resources */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-500" />
            Links & Resources{" "}
            <span className="text-sm font-normal text-gray-400">
              (must be valid URLs)
            </span>
          </h2>
          <div className="space-y-4">
            {[
              {
                field: "portfolioUrl",
                label: "Portfolio URL",
                icon: Globe,
                placeholder: "https://your-portfolio.com",
              },
              {
                field: "githubUrl",
                label: "GitHub URL",
                icon: Github,
                placeholder: "https://github.com/your-username",
              },
              {
                field: "linkedinUrl",
                label: "LinkedIn URL",
                icon: Linkedin,
                placeholder: "https://linkedin.com/in/your-profile",
              },
              {
                field: "defaultResumeUrl",
                label: "Resume URL",
                icon: FileText,
                placeholder: "https://your-resume.pdf",
              },
            ].map(({ field, label, icon: Icon, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Icon className="h-4 w-4 inline mr-1.5 text-gray-400" />
                  {label}
                </label>
                <input
                  type="url"
                  name={field}
                  value={formData[field as keyof FormData] as string}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                    getFieldError(field)
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={placeholder}
                />
                {getFieldError(field) && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {getFieldError(field)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-gray-500" />
            Additional Information
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Telegram ID
            </label>
            <input
              type="text"
              name="telegramId"
              value={formData.telegramId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
              placeholder="@your_telegram_username"
            />
          </div>
        </div>

        {/* Validation Summary */}
        {fieldErrors.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Please fix the following errors:
            </p>
            <ul className="space-y-1 text-sm text-yellow-700">
              {fieldErrors.map((err, index) => (
                <li key={index} className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
          <Link
            href="/profile"
            className="w-full sm:w-auto px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
