import { create } from "zustand";

export interface RouteConfig {
  id: string;
  path: string;
  title: string;
  meta?: Record<string, any>;
}

interface RouteStore {
  routes: RouteConfig[];
  addRoute: (route: RouteConfig) => void;
  match: (pathname: string) => RouteConfig | null;
  getRouteById: (id: string) => RouteConfig | null;
}

// 預設路由配置
const defaultRoutes: RouteConfig[] = [
  {
    id: "home",
    path: "/",
    title: "首頁",
    meta: { icon: "home" },
  },
  {
    id: "dashboard",
    path: "/dashboard",
    title: "儀表板",
    meta: { icon: "dashboard" },
  },
  {
    id: "users",
    path: "/users",
    title: "用戶管理",
    meta: { icon: "users" },
  },
  {
    id: "settings",
    path: "/settings",
    title: "設定",
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
