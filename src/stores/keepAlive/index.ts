import type { ReactElement } from "react";
import { create } from "zustand";

interface KeepAliveStore {
  cache: Record<string, ReactElement>;

  // 方法
  set: (routeId: string, element: ReactElement) => void;
  has: (routeId: string) => boolean;
  get: (routeId: string) => ReactElement | null;
  remove: (routeId: string) => void;
  clear: () => void;

  // 獲取所有快取的 routeId
  getCachedRouteIds: () => string[];
}

export const useKeepAliveStore = create<KeepAliveStore>((set, get) => ({
  cache: {},

  set: (routeId, element) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [routeId]: element,
      },
    }));
  },

  has: (routeId) => {
    const { cache } = get();
    return routeId in cache;
  },

  get: (routeId) => {
    const { cache } = get();
    return cache[routeId] || null;
  },

  remove: (routeId) => {
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[routeId];
      return { cache: newCache };
    });
  },

  clear: () => {
    set({ cache: {} });
  },

  getCachedRouteIds: () => {
    const { cache } = get();
    return Object.keys(cache);
  },
}));
