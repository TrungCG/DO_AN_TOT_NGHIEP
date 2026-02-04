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

export const authService = {
  login: async (data: LoginPayload) => {
    const response = await api.post<LoginResponse>("/login/", data);
    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
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
    }
    return response.data;
  },
};
