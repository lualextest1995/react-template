import React, { useEffect, useRef, useMemo } from "react";
import { useOutlet, useLocation } from "react-router-dom";
import { useRouteStore } from "../../stores/route";
import { useKeepAliveStore } from "../../stores/keepAlive";
import { useTabsStore } from "../../stores/tabs";

interface KeepAliveOutletProps {
  className?: string;
}

export const KeepAliveOutlet: React.FC<KeepAliveOutletProps> = ({
  className,
}) => {
  const outlet = useOutlet();
  const location = useLocation();

  const { match: matchRoute } = useRouteStore();
  const {
    cache,
    set: setCacheElement,
    has: hasCache,
    getCachedRouteIds,
  } = useKeepAliveStore();
  const { activeId, getActiveTab } = useTabsStore();

  // 使用 ref 來追蹤已經快取的路由
  const cachedRoutesRef = useRef<Set<string>>(new Set());
  const lastCachedPathRef = useRef<string>("");

  // 使用 useMemo 來穩定 currentRouteId 的計算
  const currentRouteId = useMemo(() => {
    const currentRoute = matchRoute(location.pathname);
    return currentRoute?.id || null;
  }, [matchRoute, location.pathname]);

  // 生成當前路徑的唯一標識
  const currentPathKey = useMemo(() => {
    return location.pathname + location.search;
  }, [location.pathname, location.search]);

  useEffect(() => {
    // 只有在路徑真正改變且需要快取時才執行
    if (currentPathKey === lastCachedPathRef.current) {
      return;
    }

    if (outlet && currentRouteId && !hasCache(currentRouteId)) {
      const activeTab = getActiveTab();

      // 只有當該 routeId 對應的 tab 是活躍的時候才快取
      if (
        activeTab &&
        activeTab.id === currentRouteId &&
        !cachedRoutesRef.current.has(currentRouteId)
      ) {
        setCacheElement(currentRouteId, outlet);
        cachedRoutesRef.current.add(currentRouteId);
        lastCachedPathRef.current = currentPathKey;
      }
    }
  }, [
    currentRouteId,
    currentPathKey,
    hasCache,
    getActiveTab,
    setCacheElement,
    outlet,
  ]);

  // 清理已經不存在的 tabs 對應的快取記錄
  useEffect(() => {
    const currentCachedIds = getCachedRouteIds();
    const validTabIds = new Set(
      Array.from(cachedRoutesRef.current).filter((id) =>
        currentCachedIds.includes(id)
      )
    );
    cachedRoutesRef.current = validTabIds;
  }, [getCachedRouteIds]);

  // 使用 useMemo 優化 renderContent
  const renderContent = useMemo(() => {
    // 如果沒有活躍的 tab，渲染當前 outlet
    if (!activeId) {
      return outlet;
    }

    const activeTab = getActiveTab();
    if (!activeTab) {
      return outlet;
    }

    // 獲取所有需要渲染的快取元素
    const cachedRouteIds = getCachedRouteIds();

    return (
      <div className="relative w-full h-full">
        {/* 渲染所有快取的元素 */}
        {cachedRouteIds.map((routeId) => {
          const cachedElement = cache[routeId];
          const isActive = routeId === activeId;

          return (
            <div
              key={routeId}
              style={{
                display: isActive ? "block" : "none",
                width: "100%",
                height: "100%",
              }}
            >
              {cachedElement}
            </div>
          );
        })}

        {/* 如果當前 routeId 沒有快取，直接顯示 outlet */}
        {currentRouteId &&
          !hasCache(currentRouteId) &&
          currentRouteId === activeId && (
            <div style={{ width: "100%", height: "100%" }}>{outlet}</div>
          )}
      </div>
    );
  }, [
    activeId,
    getActiveTab,
    getCachedRouteIds,
    cache,
    currentRouteId,
    hasCache,
    outlet,
  ]);

  return <div className={className}>{renderContent}</div>;
};
