import { MMKV } from "react-native-mmkv";
import { createJSONStorage, StateStorage } from "zustand/middleware";

/**
 * MMKV storage instance for fast, synchronous key-value storage.
 * Works on iOS, Android, and Web (with localStorage fallback).
 */
export const storage = new MMKV({
  id: "leafy-app-storage",
});

/**
 * Typed storage helpers for common operations.
 */
export const mmkvStorage = {
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number): void => storage.set(key, value),
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),
  delete: (key: string): void => storage.delete(key),
  clearAll: (): void => storage.clearAll(),
  getAllKeys: (): string[] => storage.getAllKeys(),
  contains: (key: string): boolean => storage.contains(key),
};

/**
 * Zustand-compatible storage adapter for MMKV.
 * Use this with persist middleware for automatic state persistence.
 *
 * @example
 * ```ts
 * import { create } from 'zustand';
 * import { persist } from 'zustand/middleware';
 * import { zustandStorage } from '@acme/store/storage';
 *
 * const useStore = create(
 *   persist(
 *     (set) => ({ count: 0 }),
 *     { name: 'my-store', storage: zustandStorage }
 *   )
 * );
 * ```
 */
export const zustandMMKVStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};

/**
 * Pre-configured Zustand storage for use with persist middleware.
 */
export const zustandStorage = createJSONStorage(() => zustandMMKVStorage);
