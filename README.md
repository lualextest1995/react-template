# Dashboard 專案

## 專案簡介

這是一個基於 React + TypeScript + Vite 的現代化 Dashboard 專案，採用清晰的分層架構和多元化的樣式解決方案。

## 技術棧

- **框架**: React 19.1.1
- **語言**: TypeScript
- **建構工具**: Vite 7.1.2
- **程式碼品質**: Biome
- **樣式方案**:
  - Tailwind CSS（Utility Classes）
  - CSS Modules（複雜樣式、動畫、第三方覆寫）
  - Tailwind @layer components（抽象化常用組合樣式）

## 專案結構

```
dashboard/
├── cypress/                         # E2E 測試
│   ├── e2e/                        # E2E 測試案例
│   ├── fixtures/                   # 測試資料
│   └── support/                    # 測試支援檔案
├── public/                          # 靜態資源
│   └── vite.svg                    # Vite 圖標
├── scripts/                         # 自定義腳本
│   └── getI18n.js                  # 國際化相關腳本
├── src/                            # 原始碼目錄
│   ├── apis/                       # API 相關
│   │   ├── global/                 # 全域 API
│   │   │   ├── game/              # 遊戲相關 API
│   │   │   │   └── index.ts
│   │   │   └── user/              # 用戶相關 API
│   │   │       └── index.ts
│   │   └── module1/               # 模組1 API
│   │       ├── page1/             # 頁面1 API
│   │       │   └── index.ts
│   │       └── page2/             # 頁面2 API
│   │           └── index.ts
│   ├── assets/                     # 靜態資源
│   │   └── react.svg              # React 圖標
│   ├── components/                 # 組件目錄
│   │   ├── base/                  # 基礎 UI 組件
│   │   │   ├── button/            # 按鈕組件
│   │   │   │   ├── index.tsx
│   │   │   │   ├── button.module.css
│   │   │   │   └── button.test.tsx
│   │   │   └── input/             # 輸入框組件
│   │   │       ├── index.tsx
│   │   │       ├── input.module.css
│   │   │       └── input.test.tsx
│   │   ├── composite/             # 複合組件
│   │   │   └── searchBar/         # 搜尋列組件
│   │   │       ├── index.tsx
│   │   │       ├── searchBar.module.css
│   │   │       └── searchBar.test.tsx
│   │   ├── charts/                # 圖表組件
│   │   │   ├── lineChart/         # 線圖組件
│   │   │   ├── barChart/          # 長條圖組件
│   │   │   └── pieChart/          # 圓餅圖組件
│   │   └── domain/                # 業務領域組件
│   │       └── order/             # 訂單相關組件
│   │           └── orderStatusBadge/
│   │               ├── index.tsx
│   │               ├── orderStatusBadge.module.css
│   │               └── orderStatusBadge.test.tsx
│   ├── contexts/                   # React Context（依賴注入）
│   │   ├── AuthContext.tsx        # 認證服務注入 Context
│   │   └── ThemeContext.tsx       # 主題服務注入 Context
│   ├── data/                       # 靜態資料
│   │   └── items.json             # 項目資料
│   ├── hooks/                      # 自定義 Hooks
│   │   ├── useMouse/              # 滑鼠相關 Hook
│   │   │   ├── index.ts
│   │   │   └── useMouse.test.ts
│   │   └── useMouse1/             # 滑鼠相關 Hook 變體
│   │       ├── index.ts
│   │       └── useMouse1.test.ts
│   ├── i18n/                       # 國際化
│   │   ├── en.json                # 英文語言包
│   │   └── zh-hans.json           # 簡體中文語言包
│   ├── router/                     # 路由相關檔案
│   │   ├── index.tsx               # 路由進入點
│   │   └── registry.tsx            # 路由註冊與管理
│   ├── layouts/                    # 佈局組件
│   │   ├── header/                # 頁首組件
│   │   │   ├── index.tsx
│   │   │   ├── header.module.css
│   │   │   └── header.test.tsx
│   │   └── menu/                  # 選單組件
│   │       ├── index.tsx
│   │       ├── menu.module.css
│   │       └── menu.test.tsx
│   ├── pages/                      # 頁面組件
│   │   └── module1/               # 模組1
│   │       ├── page1/             # 頁面1
│   │       │   ├── index.tsx
│   │       │   ├── components/    # 頁面專用組件
│   │       │   ├── contexts/      # 頁面專用 Context
│   │       │   └── hooks/         # 頁面專用 Hooks
│   │       └── page2/             # 頁面2
│   │           ├── index.tsx
│   │           ├── components/    # 頁面專用組件
│   │           ├── contexts/      # 頁面專用 Context
│   │           └── hooks/         # 頁面專用 Hooks
│   ├── stores/                     # 狀態管理（複雜狀態）
│   │   ├── app/                   # 應用程式狀態
│   │   │   ├── index.ts
│   │   │   └── app.test.ts
│   │   └── user/                  # 用戶狀態
│   │       ├── index.ts
│   │       └── user.test.ts
│   ├── styles/                     # 全域樣式
│   │   ├── index.css              # 主要樣式檔案
│   │   ├── tailwind.css           # Tailwind 基礎樣式
│   │   └── components.css         # Tailwind @layer components
│   ├── tests/                      # 整合測試
│   │   ├── integration/           # 整合測試案例
│   │   └── utils/                 # 測試工具
│   ├── types/                      # TypeScript 型別定義
│   │   └── module1/               # 模組1 型別
│   │       ├── page1.ts           # 頁面1 型別
│   │       └── page2.ts           # 頁面2 型別
│   ├── utils/                      # 工具函式
│   │   ├── jwt/                   # JWT 相關工具
│   │   │   ├── index.ts
│   │   │   └── jwt.test.ts
│   │   └── time/                  # 時間相關工具
│   │       ├── index.ts
│   │       └── time.test.ts
│   ├── App.tsx                     # 主要應用程式組件
│   ├── main.tsx                    # 應用程式入口點
│   └── vite-env.d.ts              # Vite 環境變數型別定義
├── .gitignore                      # Git 忽略檔案
├── biome.json                      # Biome 配置
├── cypress.config.ts               # Cypress E2E 測試配置
├── index.html                      # HTML 模板
├── package.json                    # 專案依賴和腳本
├── package-lock.json              # 鎖定版本的依賴
├── tailwind.config.js             # Tailwind CSS 配置
├── tsconfig.json                   # TypeScript 根配置
├── tsconfig.app.json              # 應用程式 TypeScript 配置
├── tsconfig.node.json             # Node.js TypeScript 配置
└── vite.config.ts                 # Vite 配置
```

## 資料夾說明

### 核心目錄

- **`src/`**: 專案的主要原始碼目錄
- **`public/`**: 靜態資源目錄，檔案會被直接複製到建構輸出目錄
- **`cypress/`**: E2E 測試目錄，包含端到端測試案例
- **`scripts/`**: 自定義腳本目錄，存放專案相關的工具腳本

### 功能目錄

- **`apis/`**: API 相關邏輯，按模組和頁面組織
- **`components/`**: 可重複使用的 UI 組件
  - `base/`: **純粹 UI 組件**（Button、Input 等基礎元件）
  - `composite/`: **複合組件**（多個 UI 組裝成的組件，如 SearchBar、TableWithFilter）
- **`router/`**: 路由設定與管理（集中管理所有頁面路由，支援動態註冊與權限控管）
  - `charts/`: **圖表組件**（LineChart、BarChart、PieChart 等）
  - `domain/`: **業務領域組件**（特定業務邏輯的組件）
- **`contexts/`**: **依賴注入（DI）**（服務注入、配置注入、第三方庫實例注入）
- **`stores/`**: **全域狀態管理（Zustand）**（認證狀態、主題設定、複雜業務狀態）
- **`hooks/`**: 自定義 React Hooks
- **`layouts/`**: 頁面佈局組件（頁首、選單等）
- **`pages/`**: 頁面組件，按模組組織
- **`types/`**: TypeScript 型別定義
- **`utils/`**: 工具函式和共用邏輯

### 測試架構

- **單元測試**: 就近放在元件/Hook/Store **同層資料夾**
  - 例如：`components/base/button/button.test.tsx`
  - 例如：`hooks/useMouse/useMouse.test.ts`
  - 例如：`stores/user/user.test.ts`
- **整合測試**: 放在 `src/tests/` 目錄
- **E2E 測試**: 放在 `cypress/` 目錄

### 樣式架構

- **Tailwind Utility Classes**: 主要樣式解決方案，快速開發
- **Tailwind @layer components**: 抽象化常用組合樣式（`src/styles/components.css`）
- **CSS Modules**: 處理動畫、複雜樣式、第三方樣式覆寫

### 輔助目錄

- **`data/`**: 靜態資料檔案
- **`i18n/`**: 國際化語言包
- **`styles/`**: 全域 CSS 樣式和 Tailwind 配置
- **`assets/`**: 圖片等靜態資源
- **`scripts/`**: 專案相關的自定義腳本和工具

## 架構設計原則

### 狀態管理分層

1. **Context（依賴注入）**

   - 適用場景：服務層注入、配置注入、第三方庫實例注入
   - 特點：依賴注入容器，提供服務和配置的統一管理
   - 實現：React Context + Provider 模式

2. **Zustand Store（全域狀態）**
   - 適用場景：認證狀態、主題設定、語言設定、複雜業務狀態
   - 特點：輕量級狀態管理、TypeScript 友好、支援 middleware
   - 實現：Zustand + immer、persist 等 middleware

### 組件分類

1. **Base 組件**

   - 純粹的 UI 組件，無業務邏輯
   - 例如：Button、Input、Select、Modal
   - 高度可重複使用，接受 props 控制行為

2. **Composite 組件**

   - 多個 Base 組件組合而成
   - 例如：SearchBar（Input + Button）、TableWithFilter（Table + Filter + Pagination）
   - 封裝常用的組件組合模式

3. **Charts 組件**

   - 專門處理數據視覺化
   - 例如：LineChart、BarChart、PieChart
   - 整合圖表庫（如 Chart.js、D3.js）

4. **Domain 組件**
   - 包含特定業務邏輯的組件
   - 例如：OrderStatusBadge、UserProfile、ProductCard
   - 與業務需求緊密相關

### 樣式策略

1. **Tailwind Utility Classes**

   - 主要開發方式，快速構建 UI
   - 使用於大部分基礎樣式需求

2. **Tailwind @layer components**

   - 抽象化重複的樣式組合
   - 建立可重複使用的樣式模式

3. **CSS Modules**
   - 複雜動畫效果
   - 第三方庫樣式覆寫
   - 組件特有的複雜樣式邏輯

## 開發指令

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 建構生產版本
npm run build

# 程式碼檢查
npm run lint

# 程式碼格式化
npm run format

# 預覽建構結果
npm run preview

# 執行單元測試
npm run test

# 執行整合測試
npm run test:integration

# 執行 E2E 測試
npm run cypress:open

# 執行所有測試
npm run test:all

# 執行自定義腳本
npm run script:i18n    # 執行國際化相關腳本
```

## 專案特色

- 📁 **清晰的分層架構**: 按功能和複雜度分類組件和狀態
- 🧪 **完善的測試策略**: 單元測試就近放置，整合測試和 E2E 測試分離
- 🎨 **多元化樣式方案**: Tailwind + CSS Modules 混合使用
- 🔄 **智慧狀態管理**: Context 處理依賴注入，Zustand 處理全域狀態
- 🧩 **組件分類清晰**: Base、Composite、Charts、Domain 四類組件
- 🌍 **國際化支援**: 內建多語言支援
- 📱 **響應式設計**: 適配不同螢幕尺寸
- ⚡ **快速開發**: 使用 Vite 提供極快的熱更新
- 🎯 **業務導向**: Domain 組件封裝業務邏輯
- 🚀 **現代化工具鏈**: 使用 Biome 進行代碼檢查和格式化，性能優異
- 🔧 **自定義腳本**: 專用 scripts 資料夾管理專案工具和自動化腳本

## 開發規範

### 測試規範

1. **單元測試**:

   - 檔案命名：`*.test.tsx` 或 `*.test.ts`
   - 位置：與被測試檔案同層
   - 覆蓋：組件、Hooks、Utils、Stores

2. **整合測試**:

   - 位置：`src/tests/integration/`
   - 測試多個組件間的交互

3. **E2E 測試**:
   - 位置：`cypress/e2e/`
   - 測試完整的用戶流程

### 狀態管理規範

1. **使用 Context 的場景**:

   - 依賴注入（DI）
   - 服務層注入（API 服務、工具服務）
   - 配置注入（環境配置、功能開關）
   - 第三方庫實例注入

2. **使用 Zustand Store 的場景**:
   - 全域狀態管理
   - 認證狀態（登入/登出）
   - 主題設定（淺色/深色模式）
   - 語言設定
   - 複雜的業務狀態
   - 需要跨多個頁面共享的狀態
   - 需要 middleware（如持久化、日誌）
   - 複雜的異步操作

### 組件開發規範

1. **Base 組件**:

   - 不包含業務邏輯
   - 高度可配置
   - 完善的 TypeScript 型別
   - 完整的測試覆蓋

2. **Composite 組件**:

   - 組合多個 Base 組件
   - 封裝常用模式
   - 可配置的內部組件

3. **Domain 組件**:
   - 包含特定業務邏輯
   - 與 API 和 Store 交互
   - 業務規則的封裝

### 樣式開發規範

1. **優先使用 Tailwind Utility Classes**
2. **重複樣式模式使用 @layer components**
3. **複雜動畫和第三方覆寫使用 CSS Modules**
4. **保持樣式的一致性和可維護性**

## 開發風格指南

### 函數式程式設計 (Functional Programming)

本專案採用函數式程式設計範式，強調不可變性和純函數：

1. **優先使用純函數**

   ```typescript
   // ✅ 推薦：純函數
   const formatPrice = (price: number, currency: string): string => {
     return `${currency} ${price.toFixed(2)}`;
   };

   // ❌ 避免：有副作用的函數
   let globalState = {};
   const updateGlobalState = (data: any) => {
     globalState = { ...globalState, ...data };
   };
   ```

2. **不可變數據操作**

   ```typescript
   // ✅ 推薦：使用不可變操作
   const addItem = (items: Item[], newItem: Item): Item[] => [
     ...items,
     newItem,
   ];

   // ❌ 避免：直接修改原數組
   const addItem = (items: Item[], newItem: Item): Item[] => {
     items.push(newItem);
     return items;
   };
   ```

3. **函數組合和管道操作**

   ```typescript
   // ✅ 推薦：函數組合
   const pipe =
     <T>(...fns: Function[]) =>
     (value: T) =>
       fns.reduce((acc, fn) => fn(acc), value);

   const processData = pipe(validateData, transformData, formatData);
   ```

4. **使用高階函數**
   ```typescript
   // ✅ 推薦：使用 map, filter, reduce
   const activeUsers = users
     .filter((user) => user.isActive)
     .map((user) => ({ ...user, displayName: formatName(user.name) }));
   ```

### 測試驅動開發 (TDD)

遵循紅-綠-重構的 TDD 循環：

1. **測試優先原則**

   ```typescript
   // 1. 紅：先寫失敗的測試
   describe("formatPrice", () => {
     it("should format price with currency", () => {
       expect(formatPrice(100, "USD")).toBe("USD 100.00");
     });
   });

   // 2. 綠：寫最少代碼讓測試通過
   const formatPrice = (price: number, currency: string): string => {
     return `${currency} ${price.toFixed(2)}`;
   };

   // 3. 重構：優化代碼結構
   ```

2. **測試覆蓋率要求**

   - 單元測試覆蓋率 ≥ 80%
   - 關鍵業務邏輯覆蓋率 = 100%
   - 每個公開 API 都需要測試

3. **測試結構規範**

   ```typescript
   // AAA 模式：Arrange, Act, Assert
   describe("Component", () => {
     it("should render correctly", () => {
       // Arrange
       const props = { title: "Test Title" };

       // Act
       render(<Component {...props} />);

       // Assert
       expect(screen.getByText("Test Title")).toBeInTheDocument();
     });
   });
   ```

### 第三方套件封裝策略

所有第三方套件必須透過 utils 封裝使用：

1. **API 客戶端封裝**

   ```typescript
   // src/utils/http/index.ts
   import axios from "axios";

   export const httpClient = {
     get: <T>(url: string, config?: any): Promise<T> =>
       axios.get(url, config).then((response) => response.data),

     post: <T>(url: string, data?: any, config?: any): Promise<T> =>
       axios.post(url, data, config).then((response) => response.data),
   };
   ```

2. **日期處理封裝**

   ```typescript
   // src/utils/date/index.ts
   import dayjs from "dayjs";

   export const dateUtils = {
     format: (date: Date | string, format: string = "YYYY-MM-DD"): string =>
       dayjs(date).format(format),

     isValid: (date: Date | string): boolean => dayjs(date).isValid(),

     addDays: (date: Date | string, days: number): Date =>
       dayjs(date).add(days, "day").toDate(),
   };
   ```

3. **UI 庫組件封裝**

   ```typescript
   // src/utils/notification/index.ts
   import { toast } from "react-toastify";

   export const notification = {
     success: (message: string) => toast.success(message),
     error: (message: string) => toast.error(message),
     warning: (message: string) => toast.warning(message),
     info: (message: string) => toast.info(message),
   };
   ```

### API 模組化管理

禁止在組件中直接拼接 URL，所有 API 調用必須透過 API 模組：

1. **API 模組結構**

   ```typescript
   // src/apis/user/index.ts
   import { httpClient } from "@/utils/http";
   import { User, CreateUserRequest } from "@/types/user";

   const BASE_URL = "/api/users";

   export const userApi = {
     getUsers: (): Promise<User[]> => httpClient.get(`${BASE_URL}`),

     getUserById: (id: string): Promise<User> =>
       httpClient.get(`${BASE_URL}/${id}`),

     createUser: (data: CreateUserRequest): Promise<User> =>
       httpClient.post(`${BASE_URL}`, data),

     updateUser: (id: string, data: Partial<User>): Promise<User> =>
       httpClient.put(`${BASE_URL}/${id}`, data),

     deleteUser: (id: string): Promise<void> =>
       httpClient.delete(`${BASE_URL}/${id}`),
   };
   ```

2. **組件中的正確使用方式**

   ```typescript
   // ✅ 推薦：使用 API 模組
   import { userApi } from '@/apis/user';

   const UserList = () => {
     const [users, setUsers] = useState<User[]>([]);

     useEffect(() => {
       userApi.getUsers().then(setUsers);
     }, []);

     const handleDeleteUser = (id: string) => {
       userApi.deleteUser(id).then(() => {
         setUsers(users.filter(user => user.id !== id));
       });
     };

     return (/* JSX */);
   };

   // ❌ 禁止：直接在組件中拼接 URL
   const UserList = () => {
     const [users, setUsers] = useState<User[]>([]);

     useEffect(() => {
       fetch('/api/users').then(/* ... */);
     }, []);

     return (/* JSX */);
   };
   ```

3. **URL 常數管理**

   ```typescript
   // src/apis/constants.ts
   export const API_ENDPOINTS = {
     USERS: "/api/users",
     ORDERS: "/api/orders",
     PRODUCTS: "/api/products",
   } as const;

   // src/apis/user/index.ts
   import { API_ENDPOINTS } from "../constants";

   export const userApi = {
     getUsers: (): Promise<User[]> => httpClient.get(API_ENDPOINTS.USERS),
   };
   ```

## 自定義腳本管理

### 腳本目錄結構

專案使用 `scripts/` 資料夾來管理所有自定義腳本和工具：

```
scripts/
├── getI18n.js                      # 國際化處理腳本
├── build/                          # 建構相關腳本
├── deploy/                         # 部署相關腳本
└── utils/                          # 腳本工具函式
```

### 腳本開發規範

1. **腳本命名**: 使用駝峰命名法或短橫線命名法
2. **文件說明**: 每個腳本都應包含用途說明註解
3. **錯誤處理**: 包含適當的錯誤處理和退出碼
4. **參數驗證**: 驗證輸入參數的有效性

### 常用腳本類型

1. **國際化腳本** (`getI18n.js`)

   - 自動提取程式碼中的翻譯字串
   - 生成或更新語言包檔案
   - 檢查缺失的翻譯項目

2. **建構腳本**

   - 自動化建構流程
   - 資源優化和壓縮
   - 環境變數處理

3. **部署腳本**
   - 自動化部署流程
   - 環境配置切換
   - 版本標記和發布

### 腳本使用方式

```bash
# 透過 npm scripts 執行
npm run script:i18n

# 或直接執行
node scripts/getI18n.js

# 帶參數執行
node scripts/getI18n.js --lang=zh-tw --output=./src/i18n/
```

## 注意事項

- 每個組件都遵循對應的檔案結構規範
- API 按照模組和頁面進行分層組織
- 型別定義與頁面結構保持一致
- 測試檔案採用就近原則，便於維護
- 狀態管理根據複雜度選擇 Context 或 Store
- 樣式方案根據需求選擇 Tailwind 或 CSS Modules
- 組件分類明確，職責清晰
- 遵循 TypeScript 嚴格模式開發
- 自定義腳本統一放在 scripts 資料夾管理
- 腳本開發遵循清晰的命名和文檔規範
