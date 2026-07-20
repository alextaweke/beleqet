// app/contexts/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, register as registerApi } from "@/lib/auth";
import { apiFetch } from "@/lib/config";

type UserRole = "JOB_SEEKER" | "EMPLOYER" | "ADMIN" | "FREELANCER" | null;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  name?: string;
  availableRoles?: UserRole[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  switchRole: (newRole: UserRole) => Promise<void>;
  availableRoles: UserRole[];
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userData = localStorage.getItem("userData");
        const rolesData = localStorage.getItem("availableRoles");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          if (rolesData) {
            setAvailableRoles(JSON.parse(rolesData));
          } else {
            // Default: only current role
            setAvailableRoles([parsedUser.role]);
          }
        } else {
          setUser(null);
          setAvailableRoles([]);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setAvailableRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await loginApi(email, password);

      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);

        const userData: User = {
          id: response.user?.id || response.id || "1",
          email: response.user?.email || email,
          firstName: response.user?.firstName || response.firstName || "User",
          lastName: response.user?.lastName || response.lastName || "",
          role: response.user?.role || response.role || "JOB_SEEKER",
          name:
            response.user?.name ||
            `${response.user?.firstName || "User"} ${response.user?.lastName || ""}`.trim(),
          availableRoles: response.user?.availableRoles || [
            response.user?.role || "JOB_SEEKER",
          ],
        };

        localStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("userRole", userData.role || "");
        localStorage.setItem("userName", userData.name || userData.firstName);
        localStorage.setItem(
          "availableRoles",
          JSON.stringify(userData.availableRoles || [userData.role]),
        );

        setUser(userData);
        setAvailableRoles(userData.availableRoles || [userData.role]);

        // Redirect to role-specific dashboard
        const dashboardPath = getDashboardPath(userData.role);
        router.push(dashboardPath);
      } else {
        throw new Error("Login failed: No access token received");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await registerApi(userData);

      if (response.accessToken) {
        await login(userData.email, userData.password);
      } else {
        router.push("/auth/login");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("availableRoles");
    setUser(null);
    setAvailableRoles([]);
    router.push("/auth/login");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("userData", JSON.stringify(updatedUser));
    localStorage.setItem("userRole", updatedUser.role || "");
    localStorage.setItem("userName", updatedUser.name || updatedUser.firstName);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user || !newRole) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");

      // Call API to switch role
      const response = await apiFetch("/auth/switch-role", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      // Update user with new role
      const updatedUser = {
        ...user,
        role: newRole,
        availableRoles: response.availableRoles || [newRole],
      };

      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      localStorage.setItem("userRole", newRole || "");
      localStorage.setItem(
        "availableRoles",
        JSON.stringify(updatedUser.availableRoles || [newRole]),
      );
      setAvailableRoles(updatedUser.availableRoles || [newRole]);

      // Redirect to role-specific dashboard
      const dashboardPath = getDashboardPath(newRole);
      router.push(dashboardPath);
    } catch (error: any) {
      console.error("Role switch failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case "ADMIN":
        return "/dashboard/admin";
      case "EMPLOYER":
        return "/dashboard/employer";
      case "FREELANCER":
        return "/dashboard/freelancer";
      case "JOB_SEEKER":
      default:
        return "/dashboard/seeker";
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    switchRole,
    availableRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
