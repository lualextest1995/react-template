import React, { useState } from "react";
import { X, MoreHorizontal } from "lucide-react";
import { useTabsStore } from "@/stores/tabs";
import { useKeepAliveStore } from "@/stores/keepAlive";
import { cn } from "@/utils/shadcn";

interface TabBarProps {
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({ className }) => {
  const {
    tabs,
    activeId,
    activate,
    close,
    closeOthers,
    closeAll,
    reorderTabs,
  } = useTabsStore();
  const { remove: removeFromCache } = useKeepAliveStore();

  // 拖拉狀態
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // 拖拉事件處理
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // 設置拖拉圖片（可選）
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderTabs(draggedIndex, dropIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center px-3 py-2 border-r cursor-pointer group min-w-0 max-w-xs relative",
            "hover:bg-muted/50 transition-colors",
            activeId === tab.id
              ? "bg-background border-b-2 border-b-primary text-foreground"
              : "bg-muted/20 text-muted-foreground",
            // 拖拉樣式
            draggedIndex === index && "opacity-50 scale-95",
            dragOverIndex === index &&
              draggedIndex !== index &&
              "bg-primary/10 border-l-2 border-l-primary"
          )}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
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
              onDragStart={(e) => e.stopPropagation()} // 防止關閉按鈕觸發拖拉
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
