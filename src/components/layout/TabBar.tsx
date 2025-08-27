import React from "react";
import { X, MoreHorizontal } from "lucide-react";
import { useTabsStore } from "../../stores/tabs";
import { useKeepAliveStore } from "../../stores/keepAlive";
import { cn } from "@/utils/shadcn";

interface TabBarProps {
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({ className }) => {
  const { tabs, activeId, activate, close, closeOthers, closeAll } =
    useTabsStore();
  const { remove: removeFromCache } = useKeepAliveStore();

  const handleTabClick = (routeId: string) => {
    activate(routeId);
  };

  const handleTabClose = (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    close(routeId);
    removeFromCache(routeId);
  };

  const handleContextMenu = (e: React.MouseEvent, routeId: string) => {
    e.preventDefault();
    // 這裡可以實現右鍵選單
    // 暫時用 confirm 替代
    const action = window.confirm(
      "選擇操作:\n[確定] 關閉其他\n[取消] 關閉全部"
    );
    if (action) {
      closeOthers(routeId);
      // 清理其他 tab 的快取
      const keepAliveStore = useKeepAliveStore.getState();
      const cachedRouteIds = keepAliveStore.getCachedRouteIds();
      cachedRouteIds.forEach((id: string) => {
        if (id !== routeId) {
          removeFromCache(id);
        }
      });
    } else {
      closeAll();
      useKeepAliveStore.getState().clear();
    }
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center border-b bg-background overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center px-3 py-2 border-r cursor-pointer group min-w-0 max-w-xs",
            "hover:bg-muted/50 transition-colors",
            activeId === tab.id
              ? "bg-background border-b-2 border-b-primary text-foreground"
              : "bg-muted/20 text-muted-foreground"
          )}
          onClick={() => handleTabClick(tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
        >
          <span className="truncate text-sm font-medium mr-2">{tab.title}</span>
          {tab.closable !== false && (
            <button
              className={cn(
                "flex-shrink-0 p-0.5 rounded hover:bg-muted-foreground/20",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                activeId === tab.id && "opacity-100"
              )}
              onClick={(e) => handleTabClose(e, tab.id)}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* 操作按鈕 */}
      <div className="flex items-center px-2">
        <button
          className="p-1 rounded hover:bg-muted/50 transition-colors"
          onClick={() => {
            const confirmed = window.confirm("確定要關閉所有分頁嗎？");
            if (confirmed) {
              closeAll();
              useKeepAliveStore.getState().clear();
            }
          }}
          title="關閉所有分頁"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
