import { create } from "zustand";
import { AUTH_ENABLED } from "@/lib/constants";

export type AuthUser = { uid: string; email: string | null };

/** Mirrors Firebase auth state (plan §Batch9). Firebase owns persistence. */
type AuthStore = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  // When auth is on we wait for the first onAuthStateChanged before deciding.
  isLoading: AUTH_ENABLED,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
