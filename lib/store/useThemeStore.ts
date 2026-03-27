import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeStore {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        set({ theme: next });
      },
    }),
    {
      name: "theme-preference",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") {
          document.documentElement.classList.add("dark");
        }
      },
    }
  )
);
