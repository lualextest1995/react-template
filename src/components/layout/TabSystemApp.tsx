import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { TabBar } from "./TabBar";
import { KeepAliveOutlet } from "./KeepAliveOutlet";
import { useSyncTabsWithRouter } from "../../hooks/useSyncTabsWithRouter";
import { HomePage } from "../../pages/HomePage";
import { DashboardPage } from "../../pages/DashboardPage";
import { UsersPage } from "../../pages/UsersPage";
import { SettingsPage } from "../../pages/SettingsPage";

const Layout: React.FC = () => {
  useSyncTabsWithRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* 側邊導航 */}
      <aside className="fixed left-0 top-0 w-64 h-full bg-muted/20 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">導航選單</h2>
        <nav className="space-y-2">
          <Link
            to="/"
            className="block px-3 py-2 rounded hover:bg-muted/50 transition-colors"
          >
            首頁
          </Link>
          <Link
            to="/dashboard"
            className="block px-3 py-2 rounded hover:bg-muted/50 transition-colors"
          >
            儀表板
          </Link>
          <Link
            to="/users"
            className="block px-3 py-2 rounded hover:bg-muted/50 transition-colors"
          >
            用戶管理
          </Link>
          <Link
            to="/settings"
            className="block px-3 py-2 rounded hover:bg-muted/50 transition-colors"
          >
            設定
          </Link>
        </nav>
      </aside>

      {/* 主要內容區 */}
      <main className="ml-64">
        {/* Tab 欄 */}
        <TabBar className="sticky top-0 z-10" />

        {/* 頁面內容 */}
        <div className="h-[calc(100vh-60px)] overflow-auto">
          <KeepAliveOutlet className="min-h-full" />
        </div>
      </main>
    </div>
  );
};

export const TabSystemApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
