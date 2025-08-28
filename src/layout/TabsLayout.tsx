import React from "react";
import { Link } from "react-router-dom";
import { TabBar } from "./TabBar";
import { KeepAliveOutlet } from "./KeepAliveOutlet";
import { useSyncTabsWithRouter } from "@/hooks/useSyncTabsWithRouter";
import { useRouteStore } from "@/stores/route";

const Layout: React.FC = () => {
  const { routes } = useRouteStore();
  useSyncTabsWithRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* 側邊導航 */}
      <aside className="fixed left-0 top-0 w-64 h-full bg-muted/20 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">導航選單</h2>
        <nav className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.id}
              to={route.path}
              className="block px-3 py-2 rounded hover:bg-muted/50 transition-colors"
            >
              {route.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主要內容區 */}
      <main className="ml-64">
        {/* Tab 欄 */}
        <TabBar className="sticky -0 z-10" />

        {/* 頁面內容 */}
        <div className="h-[calc(100vh-60px)] overflow-auto ">
          <KeepAliveOutlet className="min-h-full" />
        </div>
      </main>
    </div>
  );
};

export default Layout;
