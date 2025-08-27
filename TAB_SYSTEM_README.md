# Tab 系統整合說明

## 快速開始

要啟用 Tab 系統，請更新 `src/main.tsx`：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import AppWithTabs from "./AppWithTabs.tsx"; // 使用 Tab 系統版本

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithTabs />
  </StrictMode>
);
```

## 系統架構

### 📦 Store 層

#### 1. Route Store (`src/stores/route/index.ts`)

- 管理路由配置和路由匹配邏輯
- 支援精確匹配、動態路由匹配和前綴匹配

#### 2. Tabs Store (`src/stores/tabs/index.ts`)

- 管理分頁狀態（開啟、關閉、切換）
- 自動清理 keep-alive 快取

#### 3. KeepAlive Store (`src/stores/keepAlive/index.ts`)

- 管理組件快取
- 提供快取的增刪查改功能

### 🔗 同步層

#### useSyncTabsWithRouter Hook (`src/hooks/useSyncTabsWithRouter.ts`)

- 自動同步路由變化與分頁狀態
- 監聽分頁切換並導航到對應路由

### 🎨 UI 層

#### 1. TabBar Component (`src/components/layout/TabBar.tsx`)

- 渲染分頁欄
- 支援關閉分頁、右鍵操作等功能

#### 2. KeepAliveOutlet Component (`src/components/layout/KeepAliveOutlet.tsx`)

- 替代 React Router 的 `<Outlet>`
- 實現組件狀態保持功能

#### 3. TabSystemApp Component (`src/components/layout/TabSystemApp.tsx`)

- 主佈局組件，整合所有功能
- 提供側邊導航和主要內容區

## 功能特色

### ✅ 自動分頁管理

- 導航到新路由 → 自動開啟新分頁
- 相同路由不同參數 → 更新現有分頁
- 支援分頁關閉和切換

### ✅ Keep-Alive 狀態保持

- 表單輸入狀態保持
- 滾動位置保持
- 組件內部狀態保持

### ✅ 智能快取管理

- 關閉分頁自動清理快取
- 關閉全部分頁清理所有快取
- 防止記憶體洩漏

### ✅ 用戶友好操作

- 右鍵選單（關閉其他、關閉全部）
- 分頁標題顯示
- 關閉按鈕顯示/隱藏

## 測試頁面

已創建四個示例頁面來測試各種功能：

1. **首頁** (`/`) - 測試計數器和文字輸入狀態保持
2. **儀表板** (`/dashboard`) - 測試表單狀態保持
3. **用戶管理** (`/users`) - 測試搜尋和選擇狀態保持
4. **設定** (`/settings`) - 測試各種設定項目狀態保持

## 驗收測試清單

- [ ] 導航到新路由 → 自動開啟新分頁
- [ ] 再次導航到同一路由（不同參數） → 更新同一分頁
- [ ] 切換分頁 → 頁面狀態保持不變
- [ ] 關閉非活躍分頁 → 不影響當前畫面
- [ ] 關閉活躍分頁 → 鄰近分頁自動接棒
- [ ] 關閉全部分頁 → 清空分頁與快取

## 自定義配置

### 新增路由

在 `src/stores/route/index.ts` 中的 `defaultRoutes` 陣列新增路由：

```typescript
{
  id: 'new-page',
  path: '/new-page',
  title: '新頁面',
  meta: { icon: 'page' }
}
```

### 新增頁面組件

1. 創建頁面組件 `src/pages/NewPage.tsx`
2. 在 `TabSystemApp.tsx` 中新增路由配置

### 自定義樣式

所有組件都支援 `className` prop，可以傳入 Tailwind CSS 類名進行樣式自定義。

## 注意事項

1. 確保已安裝 `react-router-dom` 和 `zustand`
2. 組件使用 Tailwind CSS 進行樣式設計
3. 需要 `lucide-react` 圖示庫
4. TypeScript 支援完整
