import api from "@/lib/api";
import { LoginResponse, SignupResponse } from "@/types/auth";

interface LoginPayload {
  username: string;
  password: string;
}

interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
}

// Helper to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

// Helper to delete cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export const authService = {
  login: async (data: LoginPayload) => {
    const response = await api.post<LoginResponse>("/login/", data);
    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      // Also set cookie for middleware
      setCookie("access_token", response.data.access);
    }
    return response.data;
  },

  signup: async (data: SignupPayload) => {
    const response = await api.post<SignupResponse>("/signup/", data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Also remove cookie
    deleteCookie("access_token");
    window.location.href = "/login";
  },

  getCurrentUser: async () => {
    return null;
  },

  // Password Management
  setPassword: async (newPassword: string, confirmPassword: string) => {
    const response = await api.post("/set-password/", {
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/forgot-password/", { email });
    return response.data;
  },

  resetPassword: async (
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
    const response = await api.post("/reset-password/", {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  // Google Login
  googleLogin: async (idToken: string) => {
    const response = await api.post<LoginResponse>("/google-login/", {
      id_token: idToken,
    });
    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      // Also set cookie for middleware
      setCookie("access_token", response.data.access);
    }
    return response.data;
  },
};
