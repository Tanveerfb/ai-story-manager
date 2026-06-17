"use client";

import { useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { AUTH_ENABLED } from "@/lib/constants";
import { getFirebaseAuth } from "@/lib/auth/firebase";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Auth state + actions (plan §Batch9). A no-op when AUTH_ENABLED is false, so
 * the app runs without any Firebase config or sign-in.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    const { setUser, setLoading } = useAuthStore.getState();
    const unsub = onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      setUser(fbUser ? { uid: fbUser.uid, email: fbUser.email } : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }

  async function signOut() {
    await fbSignOut(getFirebaseAuth());
  }

  return { enabled: AUTH_ENABLED, user, isLoading, signIn, signOut };
}
