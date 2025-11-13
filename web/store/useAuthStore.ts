/**
 * Authentication store using Zustand
 */
import { create } from "zustand";
import { auth as authApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem("token", response.access_token);
      set({ user: response.user, token: response.access_token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Login failed",
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(email, password, fullName);
      localStorage.setItem("token", response.access_token);
      set({ user: response.user, token: response.access_token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Registration failed",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (token) {
      set({ token, isLoading: true });
      try {
        const user = await authApi.getMe();
        set({ user, isLoading: false, isInitialized: true });
      } catch (error) {
        // Token non valido, effettua logout
        localStorage.removeItem("token");
        set({ user: null, token: null, isLoading: false, isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },
}));
