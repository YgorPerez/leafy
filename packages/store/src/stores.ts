import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { zustandStorage } from "./storage";

/**
 * App-level UI state store.
 * Use this for global UI state that should persist across app restarts.
 */
interface AppState {
  /** Whether the app has completed onboarding */
  hasOnboarded: boolean;
  /** User's preferred theme */
  theme: "light" | "dark" | "system";
  /** Currently selected date for food logging */
  selectedDate: string;
  /** Actions */
  setHasOnboarded: (value: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setSelectedDate: (date: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        hasOnboarded: false,
        theme: "system",
        selectedDate: new Date().toISOString().split("T")[0] ?? "",
        setHasOnboarded: (value) => set({ hasOnboarded: value }),
        setTheme: (theme) => set({ theme }),
        setSelectedDate: (date) => set({ selectedDate: date }),
      }),
      {
        name: "app-store",
        storage: zustandStorage,
      },
    ),
    { name: "AppStore" },
  ),
);

/**
 * Food logging session state.
 * Transient state for the current food logging session.
 */
interface FoodLogState {
  /** Currently selected food IDs for quick add */
  selectedFoodIds: string[];
  /** Search query for food search */
  searchQuery: string;
  /** Actions */
  addFoodId: (id: string) => void;
  removeFoodId: (id: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
}

export const useFoodLogStore = create<FoodLogState>()(
  devtools(
    (set) => ({
      selectedFoodIds: [],
      searchQuery: "",
      addFoodId: (id) =>
        set((state) => ({
          selectedFoodIds: [...state.selectedFoodIds, id],
        })),
      removeFoodId: (id) =>
        set((state) => ({
          selectedFoodIds: state.selectedFoodIds.filter((fid) => fid !== id),
        })),
      clearSelection: () => set({ selectedFoodIds: [] }),
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    { name: "FoodLogStore" },
  ),
);
