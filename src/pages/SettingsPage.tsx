import React, { useState } from "react";

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    theme: "light",
    language: "zh-TW",
    notifications: true,
    autoSave: false,
    fontSize: "14",
  });

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>
      <p className="text-muted-foreground">
        調整應用程式設定，測試設定狀態保持
      </p>

      <div className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-2">主題</label>
          <select
            value={settings.theme}
            onChange={(e) => handleSettingChange("theme", e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="light">明亮</option>
            <option value="dark">深色</option>
            <option value="auto">自動</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">語言</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange("language", e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">簡體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">字體大小</label>
          <input
            type="range"
            min="12"
            max="20"
            value={settings.fontSize}
            onChange={(e) => handleSettingChange("fontSize", e.target.value)}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground mt-1">
            {settings.fontSize}px
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="notifications"
              checked={settings.notifications}
              onChange={(e) =>
                handleSettingChange("notifications", e.target.checked)
              }
              className="rounded"
            />
            <label htmlFor="notifications" className="text-sm font-medium">
              啟用通知
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoSave"
              checked={settings.autoSave}
              onChange={(e) =>
                handleSettingChange("autoSave", e.target.checked)
              }
              className="rounded"
            />
            <label htmlFor="autoSave" className="text-sm font-medium">
              自動儲存
            </label>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button
            onClick={() =>
              alert(`設定已儲存: ${JSON.stringify(settings, null, 2)}`)
            }
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};
