import { create } from "zustand";
import React from "react";
import { HomePage } from "@/pages/HomePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { UsersPage } from "@/pages/UsersPage";
import { SettingsPage } from "@/pages/SettingsPage";

export interface RouteConfig {
  id: string;
  path: string;
  title: string;
  component: React.ComponentType;
  meta?: Record<string, any>;
}

interface RouteStore {
  routes: RouteConfig[];
  addRoute: (route: RouteConfig) => void;
  removeRoute: (id: string) => void;
  match: (pathname: string) => RouteConfig | null;
  getRouteById: (id: string) => RouteConfig | null;
}

// 預設路由配置
const defaultRoutes: RouteConfig[] = [
  {
    id: "home",
    path: "/",
    title: "首頁",
    component: HomePage,
    meta: { icon: "home" },
  },
  {
    id: "dashboard",
    path: "/dashboard",
    title: "儀表板",
    component: DashboardPage,
    meta: { icon: "dashboard" },
  },
  {
    id: "users",
    path: "/users",
    title: "用戶管理",
    component: UsersPage,
    meta: { icon: "users" },
  },
  {
    id: "settings",
    path: "/settings",
    title: "設定",
    component: SettingsPage,
    meta: { icon: "settings" },
  },
];

export const useRouteStore = create<RouteStore>((set, get) => ({
  routes: defaultRoutes,

  addRoute: (route) => {
    set((state) => ({
      routes: [...state.routes, route],
    }));
  },

  removeRoute: (id: string) => {
    console.log(`準備移除路由: ${id}`);

    // 先通知 tabs store 處理被移除的路由（先跳轉）
    const shouldWaitForNavigation = new Promise<void>(async (resolve) => {
      try {
        const { useTabsStore } = await import("../tabs");
        const tabsStore = useTabsStore.getState();
        console.log(`通知 tabs store 處理被移除的路由: ${id}`);

        // 檢查是否需要導航
        const needsNavigation = tabsStore.handleRouteRemoved(id);

        if (needsNavigation) {
          // 如果需要導航，等待一小段時間確保導航完成
          setTimeout(() => {
            console.log(`導航完成，現在可以安全移除路由: ${id}`);
            resolve();
          }, 100);
        } else {
          // 不需要導航，可以立即繼續
          resolve();
        }
      } catch (error) {
        console.warn("Failed to notify tabs store about route removal:", error);
        resolve();
      }
    });

    // 等待導航完成後再移除路由
    shouldWaitForNavigation.then(() => {
      set((state) => ({
        routes: state.routes.filter((route) => route.id !== id),
      }));

      console.log(`路由已移除: ${id}`);

      // 清理 keep-alive 快取
      import("../keepAlive").then(({ useKeepAliveStore }) => {
        useKeepAliveStore.getState().remove(id);
        console.log(`keep-alive 快取已清理: ${id}`);
      });
    });
  },

  match: (pathname) => {
    const { routes } = get();

    // 精確匹配
    const exactMatch = routes.find((route) => route.path === pathname);
    if (exactMatch) return exactMatch;

    // 動態路由匹配（例如 /users/:id）
    for (const route of routes) {
      const routePattern = route.path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      if (regex.test(pathname)) {
        return route;
      }
    }

    // 路徑前綴匹配（例如 /users/123 匹配 /users）
    const prefixMatch = routes.find((route) => {
      if (route.path === "/") return false;
      return pathname.startsWith(route.path);
    });

    return prefixMatch || null;
  },

  getRouteById: (id) => {
    const { routes } = get();
    return routes.find((route) => route.id === id) || null;
  },
}));
