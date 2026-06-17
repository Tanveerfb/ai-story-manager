import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIStore } from "@/types/ui";

/**
 * Global UI state (plan §7 useUIStore). Persists the navbar hidden flag and the
 * floating reveal-button position so the author's chrome preference sticks
 * across sessions.
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      navbarHidden: false,
      togglePosition: { x: 16, y: 96 },
      setNavbarHidden: (navbarHidden) => set({ navbarHidden }),
      setTogglePosition: (togglePosition) => set({ togglePosition }),
    }),
    { name: "asm-ui" },
  ),
);
