/**
 * @acme/store - Zustand state management with MMKV persistence
 *
 * This package provides:
 * - Pre-configured Zustand stores for app state
 * - MMKV storage integration for fast, synchronous persistence
 * - Zustand-compatible storage adapter
 */

// Stores
export { useAppStore, useFoodLogStore } from "./stores";

// Storage utilities
export {
  mmkvStorage,
  storage,
  zustandMMKVStorage,
  zustandStorage,
} from "./storage";

// Re-export zustand utilities for convenience
export { create } from "zustand";
export { devtools, persist, subscribeWithSelector } from "zustand/middleware";
