# Storage Utils

一個基於函數式程式設計 (FP) 和測試驅動開發 (TDD) 的 localStorage 和 sessionStorage 工具庫。

## 特色

- ✅ **型別安全**: 完整的 TypeScript 支援
- ✅ **錯誤處理**: 自動處理 storage 相關錯誤
- ✅ **JSON 序列化**: 自動處理 JSON 序列化和反序列化
- ✅ **函數式設計**: 純函數，無副作用
- ✅ **測試覆蓋**: 100% 測試覆蓋率
- ✅ **瀏覽器兼容**: 自動檢測 storage 可用性

## 基本用法

### localStorage 操作

```typescript
import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
} from "./utils/storage";

// 儲存資料
setLocalStorage("user", { name: "John", age: 30 });

// 讀取資料
const user = getLocalStorage("user", {}); // 提供預設值
console.log(user); // { name: 'John', age: 30 }

// 移除資料
removeLocalStorage("user");

// 清空所有資料
clearLocalStorage();
```

### sessionStorage 操作

```typescript
import {
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage,
  clearSessionStorage,
} from "./utils/storage";

// 儲存暫時資料
setSessionStorage("tempData", { timestamp: Date.now() });

// 讀取暫時資料
const tempData = getSessionStorage("tempData", null);

// 移除暫時資料
removeSessionStorage("tempData");

// 清空所有暫時資料
clearSessionStorage();
```

## 進階用法

### 函數式 API 建立器

```typescript
import {
  createStorageAPI,
  createStorageGetter,
  createStorageSetter,
} from "./utils/storage";

// 建立完整的 storage API
const userSettingsAPI = createStorageAPI("localStorage", "userSettings", {
  theme: "light",
  language: "en",
});

// 使用 API
userSettingsAPI.set({ theme: "dark", language: "zh" });
const settings = userSettingsAPI.get();
userSettingsAPI.remove();

// 建立專用的 getter 和 setter
const getUserSettings = createStorageGetter("localStorage", "userSettings", {});
const setUserSettings = createStorageSetter("localStorage", "userSettings");

// 函數式組合
const updateTheme = (theme: string) => {
  const currentSettings = getUserSettings();
  return setUserSettings({ ...currentSettings, theme });
};
```

### Storage 可用性檢查

```typescript
import { isStorageAvailable } from "./utils/storage";

if (isStorageAvailable("localStorage")) {
  // localStorage 可用
  setLocalStorage("key", "value");
} else {
  // 使用替代方案
  console.warn("localStorage 不可用");
}
```

### 計算 Storage 大小

```typescript
import { getStorageSize } from "./utils/storage";

const localStorageSize = getStorageSize("localStorage");
const sessionStorageSize = getStorageSize("sessionStorage");

console.log(`localStorage 使用了 ${localStorageSize} bytes`);
console.log(`sessionStorage 使用了 ${sessionStorageSize} bytes`);
```

## 工具函數

### 底層工具

```typescript
import {
  parseStorageValue,
  stringifyStorageValue,
  withStorageHandler,
} from "./utils/storage";

// 解析 storage 值
const parsed = parseStorageValue('{"name":"test"}'); // { name: "test" }

// 序列化值
const stringified = stringifyStorageValue({ name: "test" }); // '{"name":"test"}'

// 錯誤處理包裝器
const result = withStorageHandler(
  () => localStorage.getItem("key"),
  "fallback value"
);
```

## 型別定義

```typescript
// Storage 類型
type StorageType = "localStorage" | "sessionStorage";

// Storage 值類型
type StorageValue = string | number | boolean | object | null;
```

## 錯誤處理

所有函數都內建錯誤處理：

- 當 storage 不可用時，會返回預設值或 `false`
- 當 JSON 解析失敗時，會返回原始字串
- 當 storage 配額滿時，`set` 操作會返回 `false`

## 測試

執行測試：

```bash
npm test src/utils/storage
```

## 支援的瀏覽器

- Chrome ≥ 4
- Firefox ≥ 3.5
- Safari ≥ 4
- IE ≥ 8
- Edge (所有版本)

## 授權

MIT License
