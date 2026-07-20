"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateUserProfile, getUserProfile } from "@/lib/userApi";
import { portfolioService } from "@/lib/portfolio";
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
  FolderOpen,
  Award,
  MessageSquare,
  Clock,
  Trash2,
  Edit,
  Video,
  Calendar,
  Building2,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import TelegramConnect from "@/components/TelegramConnect";

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

// ── Portfolio Item Types ──────────────────────────────────────────────

interface ProjectForm {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  demoUrl: string;
  githubUrl: string;
  videoUrl: string;
  technologies: string[];
  completedAt: string;
  featured: boolean;
}

interface WorkHistoryForm {
  title: string;
  company: string;
  companyUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

interface CertificationForm {
  name: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
  iconUrl: string;
}

interface TestimonialForm {
  userId: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorAvatarUrl: string;
  content: string;
  rating: number;
  projectId: string;
  isPublic: boolean;
}

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  // ── Profile Form ──────────────────────────────────────────────────────
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

  // ── Portfolio Data ────────────────────────────────────────────────────
  const [projects, setProjects] = useState<any[]>([]);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // ── Modal States ──────────────────────────────────────────────────────
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // ── Project Form ──────────────────────────────────────────────────────
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    demoUrl: "",
    githubUrl: "",
    videoUrl: "",
    technologies: [],
    completedAt: "",
    featured: false,
  });
  const [techInput, setTechInput] = useState("");

  // ── Work History Form ─────────────────────────────────────────────────
  const [workForm, setWorkForm] = useState<WorkHistoryForm>({
    title: "",
    company: "",
    companyUrl: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    achievements: [],
  });
  const [achievementInput, setAchievementInput] = useState("");

  // ── Certification Form ────────────────────────────────────────────────
  const [certForm, setCertForm] = useState<CertificationForm>({
    name: "",
    issuingOrg: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    iconUrl: "",
  });

  // ── Testimonial Form ──────────────────────────────────────────────────
  const [testimonialForm, setTestimonialForm] = useState<TestimonialForm>({
    userId: "",
    authorName: "",
    authorRole: "",
    authorCompany: "",
    authorAvatarUrl: "",
    content: "",
    rating: 5,
    projectId: "",
    isPublic: true,
  });

  // ── Categories ────────────────────────────────────────────────────────
  const categories = [
    "Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "Graphic Design",
    "Writing & Translation",
    "Digital Marketing",
    "Video & Animation",
    "Photography",
    "Music & Audio",
    "Business Consulting",
    "Data Analysis",
    "Machine Learning",
    "DevOps",
    "Cloud Architecture",
    "Cybersecurity",
    "Game Development",
  ];

  // ── Fetch Data ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login first.");
          setLoading(false);
          return;
        }

        // Fetch profile
        const profileData = await getUserProfile(token);
        setFormData({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          phone: profileData.phone || "",
          location: profileData.location || "",
          bio: profileData.bio || "",
          headline: profileData.headline || "",
          portfolioUrl: profileData.portfolioUrl || "",
          githubUrl: profileData.githubUrl || "",
          linkedinUrl: profileData.linkedinUrl || "",
          defaultResumeUrl: profileData.defaultResumeUrl || "",
          telegramId: profileData.telegramId || "",
          skills: profileData.skills || [],
          avatarUrl: profileData.avatarUrl || "",
        });

        // Fetch portfolio data
        const userId = profileData.id;
        const [projectsData, workData, certData, testimonialData] =
          await Promise.all([
            portfolioService.getProjects(userId),
            portfolioService.getWorkHistory(userId),
            portfolioService.getCertifications(userId),
            portfolioService.getTestimonials(userId, false),
          ]);

        setProjects(projectsData || []);
        setWorkHistory(workData || []);
        setCertifications(certData || []);
        setTestimonials(testimonialData || []);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Form Handlers ────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!formData.firstName.trim()) {
      errors.push({ field: "firstName", message: "First name is required" });
    }
    if (!formData.lastName.trim()) {
      errors.push({ field: "lastName", message: "Last name is required" });
    }

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
        errors.push({ field, message: `${label} must be a valid URL` });
      }
    }

    setFieldErrors(errors);
    return errors.length === 0;
  };

  // ── Profile Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please login first.");
        setSaving(false);
        return;
      }

      await updateUserProfile(token, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        headline: formData.headline,
        portfolioUrl: formData.portfolioUrl,
        githubUrl: formData.githubUrl,
        linkedinUrl: formData.linkedinUrl,
        defaultResumeUrl: formData.defaultResumeUrl,
        skills: formData.skills,
        avatarUrl: formData.avatarUrl,
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => router.push("/profile"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ── Skills ───────────────────────────────────────────────────────────
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

  // ── Project Functions ────────────────────────────────────────────────
  const handleAddProject = async () => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication required");

      if (editingItem) {
        await portfolioService.updateProject(editingItem.id, projectForm);
        setSuccess("Project updated successfully!");
      } else {
        await portfolioService.createProject(projectForm);
        setSuccess("Project added successfully!");
      }

      // Refresh projects
      const userId = (await getUserProfile(token)).id;
      const data = await portfolioService.getProjects(userId);
      setProjects(data);
      resetProjectForm();
      setShowProjectModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save project");
    } finally {
      setModalLoading(false);
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: "",
      description: "",
      category: "",
      imageUrl: "",
      demoUrl: "",
      githubUrl: "",
      videoUrl: "",
      technologies: [],
      completedAt: "",
      featured: false,
    });
    setTechInput("");
    setEditingItem(null);
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await portfolioService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      setSuccess("Project deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    }
  };

  const editProject = (project: any) => {
    setProjectForm({
      title: project.title,
      description: project.description,
      category: project.category,
      imageUrl: project.imageUrl || "",
      demoUrl: project.demoUrl || "",
      githubUrl: project.githubUrl || "",
      videoUrl: project.videoUrl || "",
      technologies: project.technologies || [],
      completedAt: project.completedAt ? project.completedAt.split("T")[0] : "",
      featured: project.featured || false,
    });
    setTechInput("");
    setEditingItem(project);
    setShowProjectModal(true);
  };

  // ── Work History Functions ──────────────────────────────────────────
  const handleAddWork = async () => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication required");

      if (editingItem) {
        await portfolioService.updateWorkHistory(editingItem.id, workForm);
        setSuccess("Work history updated successfully!");
      } else {
        await portfolioService.createWorkHistory(workForm);
        setSuccess("Work history added successfully!");
      }

      const userId = (await getUserProfile(token)).id;
      const data = await portfolioService.getWorkHistory(userId);
      setWorkHistory(data);
      resetWorkForm();
      setShowWorkModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save work history");
    } finally {
      setModalLoading(false);
    }
  };

  const resetWorkForm = () => {
    setWorkForm({
      title: "",
      company: "",
      companyUrl: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [],
    });
    setAchievementInput("");
    setEditingItem(null);
  };

  const deleteWork = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work history?")) return;
    try {
      await portfolioService.deleteWorkHistory(id);
      setWorkHistory(workHistory.filter((w) => w.id !== id));
      setSuccess("Work history deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete work history");
    }
  };

  const editWork = (work: any) => {
    setWorkForm({
      title: work.title,
      company: work.company,
      companyUrl: work.companyUrl || "",
      location: work.location || "",
      startDate: work.startDate.split("T")[0],
      endDate: work.endDate ? work.endDate.split("T")[0] : "",
      current: work.current || false,
      description: work.description || "",
      achievements: work.achievements || [],
    });
    setAchievementInput("");
    setEditingItem(work);
    setShowWorkModal(true);
  };

  // ── Certification Functions ──────────────────────────────────────────
  const handleAddCert = async () => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication required");

      if (editingItem) {
        await portfolioService.updateCertification(editingItem.id, certForm);
        setSuccess("Certification updated successfully!");
      } else {
        await portfolioService.createCertification(certForm);
        setSuccess("Certification added successfully!");
      }

      const userId = (await getUserProfile(token)).id;
      const data = await portfolioService.getCertifications(userId);
      setCertifications(data);
      resetCertForm();
      setShowCertModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save certification");
    } finally {
      setModalLoading(false);
    }
  };

  const resetCertForm = () => {
    setCertForm({
      name: "",
      issuingOrg: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
      iconUrl: "",
    });
    setEditingItem(null);
  };

  const deleteCert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) return;
    try {
      await portfolioService.deleteCertification(id);
      setCertifications(certifications.filter((c) => c.id !== id));
      setSuccess("Certification deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete certification");
    }
  };

  const editCert = (cert: any) => {
    setCertForm({
      name: cert.name,
      issuingOrg: cert.issuingOrg,
      issueDate: cert.issueDate.split("T")[0],
      expiryDate: cert.expiryDate ? cert.expiryDate.split("T")[0] : "",
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || "",
      iconUrl: cert.iconUrl || "",
    });
    setEditingItem(cert);
    setShowCertModal(true);
  };

  // ── Testimonial Functions ────────────────────────────────────────────
  const handleAddTestimonial = async () => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication required");

      const userId = (await getUserProfile(token)).id;
      await portfolioService.createTestimonial({
        ...testimonialForm,
        userId,
      });
      setSuccess("Testimonial added successfully!");

      const data = await portfolioService.getTestimonials(userId, false);
      setTestimonials(data);
      resetTestimonialForm();
      setShowTestimonialModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save testimonial");
    } finally {
      setModalLoading(false);
    }
  };

  const resetTestimonialForm = () => {
    setTestimonialForm({
      userId: "",
      authorName: "",
      authorRole: "",
      authorCompany: "",
      authorAvatarUrl: "",
      content: "",
      rating: 5,
      projectId: "",
      isPublic: true,
    });
    setEditingItem(null);
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await portfolioService.deleteTestimonial(id);
      setTestimonials(testimonials.filter((t) => t.id !== id));
      setSuccess("Testimonial deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete testimonial");
    }
  };

  // ── Helper Functions ──────────────────────────────────────────────────
  const handleAddTech = () => {
    if (
      techInput.trim() &&
      !projectForm.technologies.includes(techInput.trim())
    ) {
      setProjectForm((prev) => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()],
      }));
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    setProjectForm((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleAddAchievement = () => {
    if (
      achievementInput.trim() &&
      !workForm.achievements.includes(achievementInput.trim())
    ) {
      setWorkForm((prev) => ({
        ...prev,
        achievements: [...prev.achievements, achievementInput.trim()],
      }));
      setAchievementInput("");
    }
  };

  const handleRemoveAchievement = (achievement: string) => {
    setWorkForm((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((a) => a !== achievement),
    }));
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
    <div className="max-w-6xl mx-auto p-4 md:p-6 mt-4 md:mt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/profile"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Profile & Portfolio
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Update your personal information and manage your portfolio
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
        {/* ── PERSONAL INFORMATION ── */}
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
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 ${
                  getFieldError("firstName")
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300"
                }`}
                placeholder="John"
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
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 ${
                  getFieldError("lastName")
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Doe"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
        </div>
        {/* ── AVATAR ── */}
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
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 ${
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
          </div>
        </div>
        {/* ── PROFESSIONAL ── */}
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 resize-none"
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
              />
            </div>
          </div>
        </div>
        {/* ── SKILLS ── */}
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
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddSkill())
              }
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="Add a skill (e.g., React, Python)"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center gap-1"
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
            <p className="text-sm text-gray-500">No skills added yet.</p>
          )}
        </div>
        {/* ── LINKS ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-500" />
            Links & Resources
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
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 ${
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
        {/* ── TELEGRAM INTEGRATION ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            Telegram Notifications
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect your Telegram account to receive instant notifications
            about:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              📋 Job applications
            </span>
            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
              💼 Freelance bids
            </span>
            <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
              📝 Contract updates
            </span>
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full">
              💰 Payment notifications
            </span>
            <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full">
              💬 New messages
            </span>
          </div>

          {/* ✅ Telegram Connect Component */}
          <TelegramConnect />

          <p className="text-xs text-gray-400 mt-3">
            💡 Your Telegram ID is stored securely and only used for sending
            notifications.
          </p>
        </div>
        ── ADDITIONAL INFORMATION (with manual Telegram ID) ──
        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"> */}
        {/* <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Additional Information
          </h2> */}
        {/* Telegram ID - Manual Entry (optional, since we have the component above)
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Telegram ID (Manual Entry)
            </label>
            <input
              type="text"
              name="telegramId"
              value={formData.telegramId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="@your_telegram_username"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Or use the Telegram Connect component above to automatically
              connect.
            </p>
          </div> */}
        {/* You can add other additional info here */}
        {/* </div> */}
        {/* ── PORTFOLIO MANAGEMENT ── */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-green-600" />
            Portfolio Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage your projects, work history, certifications, and testimonials
          </p>

          {/* Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-gray-500" />
                Projects ({projects.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  resetProjectForm();
                  setShowProjectModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {project.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {project.category}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => editProject(project)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(project.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.slice(0, 3).map((tech: string) => (
                        <span
                          key={tech}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500">
                  No projects added yet
                </div>
              )}
            </div>
          </div>

          {/* Work History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-500" />
                Work History ({workHistory.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  resetWorkForm();
                  setShowWorkModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Work
              </button>
            </div>
            <div className="space-y-3">
              {workHistory.map((work) => (
                <div
                  key={work.id}
                  className="border border-gray-100 rounded-xl p-4 flex items-start justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {work.title}
                    </h4>
                    <p className="text-sm text-gray-600">{work.company}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(work.startDate), "MMM yyyy")} -{" "}
                      {work.current
                        ? "Present"
                        : work.endDate
                          ? format(new Date(work.endDate), "MMM yyyy")
                          : "Present"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => editWork(work)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteWork(work.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {workHistory.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No work history added yet
                </div>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-500" />
                Certifications ({certifications.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  resetCertForm();
                  setShowCertModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Certification
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="border border-gray-100 rounded-xl p-4 flex items-start justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                      {cert.iconUrl ? (
                        <img
                          src={cert.iconUrl}
                          alt={cert.name}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <Award className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {cert.name}
                      </h4>
                      <p className="text-xs text-gray-600">{cert.issuingOrg}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => editCert(cert)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCert(cert.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {certifications.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500">
                  No certifications added yet
                </div>
              )}
            </div>
          </div>

          {/* Testimonials */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                Testimonials ({testimonials.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  resetTestimonialForm();
                  setShowTestimonialModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Testimonial
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                        {testimonial.authorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {testimonial.authorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {testimonial.authorRole}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTestimonial(testimonial.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 italic line-clamp-2">
                    "{testimonial.content}"
                  </p>
                  {testimonial.rating && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {testimonials.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500">
                  No testimonials added yet
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ── VALIDATION ERRORS ── */}
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
        {/* ── SAVE ── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save All Changes
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

      {/* ── PROJECT MODAL ── */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Project" : "Add New Project"}
              </h2>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Project Title *"
                value={projectForm.title}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, title: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <textarea
                placeholder="Description *"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              />
              <select
                value={projectForm.category}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, category: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="url"
                placeholder="Image URL"
                value={projectForm.imageUrl}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, imageUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="url"
                placeholder="Demo URL"
                value={projectForm.demoUrl}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, demoUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="url"
                placeholder="GitHub URL"
                value={projectForm.githubUrl}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, githubUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="url"
                placeholder="Video URL"
                value={projectForm.videoUrl}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, videoUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddTech())
                  }
                  placeholder="Add technology"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTech}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {projectForm.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {projectForm.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tech}
                      <button
                        onClick={() => handleRemoveTech(tech)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="date"
                placeholder="Completion Date"
                value={projectForm.completedAt}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    completedAt: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={projectForm.featured}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      featured: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Featured Project</span>
              </label>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAddProject}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingItem ? "Update" : "Add"} Project
                </button>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WORK HISTORY MODAL ── */}
      {showWorkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Work History" : "Add Work History"}
              </h2>
              <button
                onClick={() => setShowWorkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Job Title *"
                value={workForm.title}
                onChange={(e) =>
                  setWorkForm({ ...workForm, title: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                placeholder="Company *"
                value={workForm.company}
                onChange={(e) =>
                  setWorkForm({ ...workForm, company: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="url"
                placeholder="Company URL"
                value={workForm.companyUrl}
                onChange={(e) =>
                  setWorkForm({ ...workForm, companyUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                placeholder="Location"
                value={workForm.location}
                onChange={(e) =>
                  setWorkForm({ ...workForm, location: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={workForm.startDate}
                    onChange={(e) =>
                      setWorkForm({ ...workForm, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={workForm.endDate}
                    onChange={(e) =>
                      setWorkForm({ ...workForm, endDate: e.target.value })
                    }
                    disabled={workForm.current}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={workForm.current}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, current: e.target.checked })
                  }
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  I currently work here
                </span>
              </label>
              <textarea
                placeholder="Description"
                value={workForm.description}
                onChange={(e) =>
                  setWorkForm({ ...workForm, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddAchievement())
                  }
                  placeholder="Add achievement"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {workForm.achievements.length > 0 && (
                <div className="space-y-1">
                  {workForm.achievements.map((achievement) => (
                    <div
                      key={achievement}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">
                        {achievement}
                      </span>
                      <button
                        onClick={() => handleRemoveAchievement(achievement)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAddWork}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingItem ? "Update" : "Add"} Work
                </button>
                <button
                  onClick={() => setShowWorkModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CERTIFICATION MODAL ── */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Certification" : "Add Certification"}
              </h2>
              <button
                onClick={() => setShowCertModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Certification Name *"
                value={certForm.name}
                onChange={(e) =>
                  setCertForm({ ...certForm, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                placeholder="Issuing Organization *"
                value={certForm.issuingOrg}
                onChange={(e) =>
                  setCertForm({ ...certForm, issuingOrg: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={certForm.issueDate}
                    onChange={(e) =>
                      setCertForm({ ...certForm, issueDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={certForm.expiryDate}
                    onChange={(e) =>
                      setCertForm({ ...certForm, expiryDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Credential ID"
                value={certForm.credentialId}
                onChange={(e) =>
                  setCertForm({ ...certForm, credentialId: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="url"
                placeholder="Credential URL"
                value={certForm.credentialUrl}
                onChange={(e) =>
                  setCertForm({ ...certForm, credentialUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="url"
                placeholder="Icon URL (logo image)"
                value={certForm.iconUrl}
                onChange={(e) =>
                  setCertForm({ ...certForm, iconUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAddCert}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingItem ? "Update" : "Add"} Certification
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TESTIMONIAL MODAL ── */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Add Testimonial
              </h2>
              <button
                onClick={() => setShowTestimonialModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Author Name *"
                value={testimonialForm.authorName}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    authorName: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                placeholder="Author Role"
                value={testimonialForm.authorRole}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    authorRole: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                placeholder="Author Company"
                value={testimonialForm.authorCompany}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    authorCompany: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="url"
                placeholder="Author Avatar URL"
                value={testimonialForm.authorAvatarUrl}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    authorAvatarUrl: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <textarea
                placeholder="Testimonial Content *"
                value={testimonialForm.content}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    content: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              />
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Rating (1-5)
                </label>
                <select
                  value={testimonialForm.rating}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      rating: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} Star{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={testimonialForm.isPublic}
                  onChange={(e) =>
                    setTestimonialForm({
                      ...testimonialForm,
                      isPublic: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  Make this testimonial public
                </span>
              </label>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAddTestimonial}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Add Testimonial
                </button>
                <button
                  onClick={() => setShowTestimonialModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
