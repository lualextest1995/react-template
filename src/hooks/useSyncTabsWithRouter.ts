import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRouteStore } from "../stores/route";
import { useTabsStore } from "../stores/tabs";

/**
 * 同步 Tabs 與 Router 的 Hook
 *
 * 功能：
 * 1. 監聽路由變化，自動開啟或更新對應的 tab
 * 2. 監聽 activeTab 變化，自動導航到對應路由
 */
export const useSyncTabsWithRouter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { match: matchRoute } = useRouteStore();
  const { openByRoute, getActiveTab, activeId, lastPathMap } = useTabsStore();

  // 使用 ref 來追蹤操作狀態，避免循環更新
  const syncStateRef = useRef({
    isNavigating: false,
    lastLocationKey: "",
    lastActiveId: "",
  });

  // 穩定的 openByRoute 回調
  const stableOpenByRoute = useCallback(openByRoute, [openByRoute]);

  // 監聽路由變化，同步到 tabs
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const locationKey =
      location.pathname + location.search + (location.key || "");

    // 如果是通過程序導航且路由沒有真正改變，跳過
    if (
      syncStateRef.current.isNavigating &&
      syncStateRef.current.lastLocationKey === locationKey
    ) {
      syncStateRef.current.isNavigating = false;
      return;
    }

    syncStateRef.current.lastLocationKey = locationKey;
    const matchedRoute = matchRoute(location.pathname);

    if (matchedRoute) {
      // 檢查是否真的需要更新 tab
      const currentActiveTab = getActiveTab();
      const needsUpdate =
        !currentActiveTab ||
        currentActiveTab.id !== matchedRoute.id ||
        currentActiveTab.path !== currentPath;

      if (needsUpdate) {
        stableOpenByRoute({
          routeId: matchedRoute.id,
          title: matchedRoute.title,
          path: currentPath,
        });
      }
    }
  }, [
    location.pathname,
    location.search,
    location.key,
    matchRoute,
    stableOpenByRoute,
    getActiveTab,
  ]);

  // 監聽 activeTab 變化，同步到路由
  useEffect(() => {
    // 如果 activeId 沒有改變，跳過
    if (syncStateRef.current.lastActiveId === activeId) {
      return;
    }

    syncStateRef.current.lastActiveId = activeId || "";

    const activeTab = getActiveTab();

    if (activeTab) {
      const targetPath = lastPathMap[activeTab.id] || activeTab.path;
      const currentPath = location.pathname + location.search;

      // 只有當目標路徑與當前路徑不同時才導航
      if (targetPath !== currentPath) {
        syncStateRef.current.isNavigating = true;
        navigate(targetPath, { replace: false });
      }
    }
  }, [
    activeId,
    navigate,
    getActiveTab,
    lastPathMap,
    location.pathname,
    location.search,
  ]);

  return {
    currentRoute: matchRoute(location.pathname),
    activeTab: getActiveTab(),
  };
};
