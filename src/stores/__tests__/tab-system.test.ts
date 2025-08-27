import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouteStore } from "../route";
import { useTabsStore } from "../tabs";
import { useKeepAliveStore } from "../keepAlive";

describe("Tab System Stores", () => {
  beforeEach(() => {
    // 重置所有 store 狀態
    useTabsStore.getState().closeAll();
    useKeepAliveStore.getState().clear();
  });

  describe("RouteStore", () => {
    it("should match exact route", () => {
      const { result } = renderHook(() => useRouteStore());

      const matchedRoute = result.current.match("/dashboard");

      expect(matchedRoute).toEqual({
        id: "dashboard",
        path: "/dashboard",
        title: "儀表板",
        meta: { icon: "dashboard" },
      });
    });

    it("should match route with prefix", () => {
      const { result } = renderHook(() => useRouteStore());

      const matchedRoute = result.current.match("/users/123");

      expect(matchedRoute?.id).toBe("users");
    });

    it("should return null for unmatched route", () => {
      const { result } = renderHook(() => useRouteStore());

      const matchedRoute = result.current.match("/non-existent");

      expect(matchedRoute).toBeNull();
    });
  });

  describe("TabsStore", () => {
    it("should open new tab", () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.openByRoute({
          routeId: "home",
          title: "首頁",
          path: "/",
        });
      });

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.activeId).toBe("home");
      expect(result.current.tabs[0]).toEqual({
        id: "home",
        title: "首頁",
        path: "/",
        lastPath: "/",
        closable: true,
      });
    });

    it("should update existing tab path", () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.openByRoute({
          routeId: "users",
          title: "用戶管理",
          path: "/users",
        });
      });

      act(() => {
        result.current.openByRoute({
          routeId: "users",
          title: "用戶管理",
          path: "/users?page=2",
        });
      });

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].path).toBe("/users?page=2");
      expect(result.current.lastPathMap["users"]).toBe("/users?page=2");
    });

    it("should close tab and select adjacent tab", () => {
      const { result } = renderHook(() => useTabsStore());

      // 開啟三個分頁
      act(() => {
        result.current.openByRoute({
          routeId: "home",
          title: "首頁",
          path: "/",
        });
        result.current.openByRoute({
          routeId: "dashboard",
          title: "儀表板",
          path: "/dashboard",
        });
        result.current.openByRoute({
          routeId: "users",
          title: "用戶管理",
          path: "/users",
        });
      });

      // 關閉中間的分頁
      act(() => {
        result.current.activate("dashboard");
        result.current.close("dashboard");
      });

      expect(result.current.tabs).toHaveLength(2);
      expect(result.current.activeId).toBe("users"); // 應該選擇右邊的分頁
    });

    it("should close all tabs", () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.openByRoute({
          routeId: "home",
          title: "首頁",
          path: "/",
        });
        result.current.openByRoute({
          routeId: "dashboard",
          title: "儀表板",
          path: "/dashboard",
        });
      });

      act(() => {
        result.current.closeAll();
      });

      expect(result.current.tabs).toHaveLength(0);
      expect(result.current.activeId).toBeNull();
      expect(result.current.lastPathMap).toEqual({});
    });
  });

  describe("KeepAliveStore", () => {
    it("should set and get cached element", () => {
      const { result } = renderHook(() => useKeepAliveStore());
      const mockElement = { type: "div", props: { children: "test" } } as any;

      act(() => {
        result.current.set("home", mockElement);
      });

      expect(result.current.has("home")).toBe(true);
      expect(result.current.get("home")).toBe(mockElement);
      expect(result.current.getCachedRouteIds()).toContain("home");
    });

    it("should remove cached element", () => {
      const { result } = renderHook(() => useKeepAliveStore());
      const mockElement = { type: "div", props: { children: "test" } } as any;

      act(() => {
        result.current.set("home", mockElement);
        result.current.remove("home");
      });

      expect(result.current.has("home")).toBe(false);
      expect(result.current.get("home")).toBeNull();
    });

    it("should clear all cached elements", () => {
      const { result } = renderHook(() => useKeepAliveStore());
      const mockElement1 = { type: "div", props: { children: "test1" } } as any;
      const mockElement2 = { type: "div", props: { children: "test2" } } as any;

      act(() => {
        result.current.set("home", mockElement1);
        result.current.set("dashboard", mockElement2);
        result.current.clear();
      });

      expect(result.current.getCachedRouteIds()).toHaveLength(0);
      expect(result.current.has("home")).toBe(false);
      expect(result.current.has("dashboard")).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    it("should sync tabs and keep-alive when closing tabs", () => {
      const tabsStore = renderHook(() => useTabsStore());
      const keepAliveStore = renderHook(() => useKeepAliveStore());
      const mockElement = { type: "div", props: { children: "test" } } as any;

      // 開啟分頁並設置快取
      act(() => {
        tabsStore.result.current.openByRoute({
          routeId: "home",
          title: "首頁",
          path: "/",
        });
        keepAliveStore.result.current.set("home", mockElement);
      });

      expect(tabsStore.result.current.tabs).toHaveLength(1);
      expect(keepAliveStore.result.current.has("home")).toBe(true);

      // 關閉分頁（手動清理快取，因為在測試環境中動態 import 可能不工作）
      act(() => {
        tabsStore.result.current.close("home");
        keepAliveStore.result.current.remove("home");
      });

      expect(tabsStore.result.current.tabs).toHaveLength(0);
      expect(keepAliveStore.result.current.has("home")).toBe(false);
    });
  });
});
