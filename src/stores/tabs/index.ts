import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface Tab {
  id: string; // 對應 routeId
  title: string;
  path: string;
  lastPath: string; // 記錄最後的完整路徑（含 query/params）
  closable?: boolean; // 是否可關閉
}

interface TabsStore {
  tabs: Tab[];
  activeId: string | null;
  lastPathMap: Record<string, string>; // routeId -> 最後訪問的完整路徑

  // 方法
  openByRoute: (params: {
    routeId: string;
    title: string;
    path: string;
    closable?: boolean;
  }) => void;
  activate: (routeId: string) => void;
  close: (routeId: string) => void;
  closeAll: () => void;
  rename: (routeId: string, title: string) => void;
  closeOthers: (routeId: string) => void;
  updateTabPath: (routeId: string, path: string) => void;

  // getter
  getActiveTab: () => Tab | null;
  getTabById: (routeId: string) => Tab | null;
}

export const useTabsStore = create<TabsStore>()(
  subscribeWithSelector((set, get) => ({
    tabs: [],
    activeId: null,
    lastPathMap: {},

    openByRoute: ({ routeId, title, path, closable = true }) => {
      set((state) => {
        const existingTabIndex = state.tabs.findIndex(
          (tab) => tab.id === routeId
        );

        if (existingTabIndex >= 0) {
          // 更新現有 tab 的路徑
          const updatedTabs = [...state.tabs];
          updatedTabs[existingTabIndex] = {
            ...updatedTabs[existingTabIndex],
            path,
            lastPath: path,
          };

          return {
            tabs: updatedTabs,
            activeId: routeId,
            lastPathMap: {
              ...state.lastPathMap,
              [routeId]: path,
            },
          };
        } else {
          // 新增 tab
          const newTab: Tab = {
            id: routeId,
            title,
            path,
            lastPath: path,
            closable,
          };

          return {
            tabs: [...state.tabs, newTab],
            activeId: routeId,
            lastPathMap: {
              ...state.lastPathMap,
              [routeId]: path,
            },
          };
        }
      });
    },

    activate: (routeId) => {
      const { tabs } = get();
      const tab = tabs.find((t) => t.id === routeId);
      if (tab) {
        set({ activeId: routeId });
      }
    },

    close: (routeId) => {
      set((state) => {
        const tabs = state.tabs.filter((tab) => tab.id !== routeId);
        let newActiveId = state.activeId;

        // 如果關閉的是當前 active tab，需要選擇新的 active tab
        if (state.activeId === routeId) {
          if (tabs.length > 0) {
            const closedTabIndex = state.tabs.findIndex(
              (tab) => tab.id === routeId
            );

            // 優先選擇右邊的 tab，如果沒有則選左邊的
            if (closedTabIndex < tabs.length) {
              newActiveId = tabs[closedTabIndex].id;
            } else if (tabs.length > 0) {
              newActiveId = tabs[tabs.length - 1].id;
            } else {
              newActiveId = null;
            }
          } else {
            newActiveId = null;
          }
        }

        // 清理 lastPathMap
        const newLastPathMap = { ...state.lastPathMap };
        delete newLastPathMap[routeId];

        return {
          tabs,
          activeId: newActiveId,
          lastPathMap: newLastPathMap,
        };
      });

      // 同步清理 keep-alive 快取
      import("../keepAlive").then(({ useKeepAliveStore }) => {
        useKeepAliveStore.getState().remove(routeId);
      });
    },

    closeAll: () => {
      set({
        tabs: [],
        activeId: null,
        lastPathMap: {},
      });

      // 同步清理所有 keep-alive 快取
      import("../keepAlive").then(({ useKeepAliveStore }) => {
        useKeepAliveStore.getState().clear();
      });
    },

    closeOthers: (routeId) => {
      set((state) => {
        const targetTab = state.tabs.find((tab) => tab.id === routeId);
        if (!targetTab) return state;

        const newLastPathMap: Record<string, string> = {};
        if (state.lastPathMap[routeId]) {
          newLastPathMap[routeId] = state.lastPathMap[routeId];
        }

        // 收集要清理的 routeIds
        const routeIdsToRemove = state.tabs
          .filter((tab) => tab.id !== routeId)
          .map((tab) => tab.id);

        // 同步清理其他 keep-alive 快取
        import("../keepAlive").then(({ useKeepAliveStore }) => {
          const keepAliveStore = useKeepAliveStore.getState();
          routeIdsToRemove.forEach((id) => keepAliveStore.remove(id));
        });

        return {
          tabs: [targetTab],
          activeId: routeId,
          lastPathMap: newLastPathMap,
        };
      });
    },

    rename: (routeId, title) => {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === routeId ? { ...tab, title } : tab
        ),
      }));
    },

    updateTabPath: (routeId, path) => {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === routeId ? { ...tab, path, lastPath: path } : tab
        ),
        lastPathMap: {
          ...state.lastPathMap,
          [routeId]: path,
        },
      }));
    },

    // Getters
    getActiveTab: () => {
      const { tabs, activeId } = get();
      return tabs.find((tab) => tab.id === activeId) || null;
    },

    getTabById: (routeId) => {
      const { tabs } = get();
      return tabs.find((tab) => tab.id === routeId) || null;
    },
  }))
);
