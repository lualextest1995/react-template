import { create } from "zustand";
import { useKeepAliveStore } from "../keepAlive";

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
  pendingNavigation: string | null; // 待導航的路徑

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
  handleRouteRemoved: (routeId: string) => boolean; // 返回是否需要導航
  setPendingNavigation: (path: string | null) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void; // 新增拖拉重新排序功能

  // getter
  getActiveTab: () => Tab | null;
  getTabById: (routeId: string) => Tab | null;
}

export const useTabsStore = create<TabsStore>()((set, get) => ({
  tabs: [],
  activeId: null,
  lastPathMap: {},
  pendingNavigation: null,

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
    useKeepAliveStore.getState().remove(routeId);
  },

  closeAll: () => {
    set({
      tabs: [],
      activeId: null,
      lastPathMap: {},
    });

    // 同步清理所有 keep-alive 快取
    useKeepAliveStore.getState().clear();
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
      const keepAliveStore = useKeepAliveStore.getState();
      routeIdsToRemove.forEach((id) => keepAliveStore.remove(id));

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

  handleRouteRemoved: (routeId) => {
    const { tabs, activeId, lastPathMap } = get();
    const hasTab = tabs.some((tab) => tab.id === routeId);

    if (!hasTab) return false; // 如果沒有對應的 tab，不需要導航

    console.log(`正在處理被移除的路由: ${routeId}, 當前活躍tab: ${activeId}`);

    // 關閉對應的 tab
    const remainingTabs = tabs.filter((tab) => tab.id !== routeId);

    // 如果關閉的是當前活躍的 tab
    if (activeId === routeId) {
      if (remainingTabs.length > 0) {
        // 智能選擇下一個要激活的 tab
        const closedTabIndex = tabs.findIndex((tab) => tab.id === routeId);
        let nextTab: Tab;

        // 策略: 優先左邊 → 沒有則選右邊 → 都沒有就跳到根路徑
        if (closedTabIndex > 0) {
          // 優先選擇左邊的 tab
          nextTab = remainingTabs[closedTabIndex - 1];
        } else if (closedTabIndex < remainingTabs.length) {
          // 左邊沒有，選擇右邊的 tab
          nextTab = remainingTabs[closedTabIndex];
        } else {
          // 備用方案（理論上不會執行到這裡）
          nextTab = remainingTabs[0];
        }

        const targetPath = lastPathMap[nextTab.id] || nextTab.path;

        console.log(`將跳轉到tab: ${nextTab.id}, 路徑: ${targetPath}`);

        set((state) => {
          const newLastPathMap = { ...state.lastPathMap };
          delete newLastPathMap[routeId];

          return {
            tabs: remainingTabs,
            activeId: nextTab.id,
            lastPathMap: newLastPathMap,
          };
        });

        // 設置待導航路徑，讓 hook 來處理導航
        set((state) => ({ ...state, pendingNavigation: targetPath }));
        console.log(`設置待導航路徑: ${targetPath}`);
      } else {
        // 沒有其他 tab 了，跳轉到根路徑
        console.log(`沒有其他tab，將跳轉到根路徑: /`);

        set((state) => {
          const newLastPathMap = { ...state.lastPathMap };
          delete newLastPathMap[routeId];

          return {
            tabs: [],
            activeId: null,
            lastPathMap: newLastPathMap,
          };
        });

        // 設置待導航路徑為根路徑
        set((state) => ({ ...state, pendingNavigation: "/" }));
        console.log(`設置待導航路徑: /`);
      }

      return true; // 需要導航
    } else {
      // 關閉的不是當前活躍的 tab，只需要移除 tab
      console.log(`關閉非活躍tab: ${routeId}`);
      set((state) => {
        const newLastPathMap = { ...state.lastPathMap };
        delete newLastPathMap[routeId];

        return {
          tabs: remainingTabs,
          activeId: state.activeId, // 保持當前活躍 tab 不變
          lastPathMap: newLastPathMap,
        };
      });

      return false; // 不需要導航
    }

    // 注意：keep-alive 快取清理將在路由實際移除後進行
  },

  setPendingNavigation: (path) => {
    set((state) => ({ ...state, pendingNavigation: path }));
  },

  reorderTabs: (fromIndex, toIndex) => {
    set((state) => {
      const newTabs = [...state.tabs];
      const [draggedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, draggedTab);

      return {
        ...state,
        tabs: newTabs,
      };
    });
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
}));
