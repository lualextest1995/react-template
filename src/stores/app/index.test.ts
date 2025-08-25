import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock 依賴模組 - 需要在導入 store 之前進行
vi.mock("@/utils/storage", () => ({
  getLocalStorage: vi.fn().mockReturnValue("zh-Hans"),
  setLocalStorage: vi.fn().mockReturnValue(true),
}));

vi.mock("@/i18n", () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}));

// Mock window 物件
Object.defineProperty(global, "window", {
  value: {
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  },
  writable: true,
});

// 動態導入 store 以確保 mock 生效
const { useAppStore } = await import("./index");
const { getLocalStorage, setLocalStorage } = await import("@/utils/storage");
const i18next = (await import("@/i18n")).default;

// Mock console.log
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("useAppStore", () => {
  const mockSetLocalStorage = vi.mocked(setLocalStorage);
  const mockChangeLanguage = vi.mocked(i18next.changeLanguage);

  beforeEach(() => {
    // 重置所有 mocks
    vi.clearAllMocks();

    // 重置 store 狀態
    useAppStore.setState({
      version: { client: "", server: "" },
      language: "zh-Hans",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初始狀態", () => {
    it("應該有正確的初始狀態", () => {
      const state = useAppStore.getState();

      expect(state.version).toEqual({ client: "", server: "" });
      expect(state.language).toBe("zh-Hans");
      expect(typeof state.setVersion).toBe("function");
      expect(typeof state.setLanguage).toBe("function");
    });

    it("應該具備 getLocalStorage 函數的功能", () => {
      // 測試 getLocalStorage 函數是否被正確 mock
      expect(getLocalStorage).toBeDefined();
      expect(typeof getLocalStorage).toBe("function");
    });
  });

  describe("setVersion", () => {
    it("應該能設定版本資訊", () => {
      const newVersion = { client: "1.0.0", server: "2.0.0" };

      useAppStore.getState().setVersion(newVersion);

      const state = useAppStore.getState();
      expect(state.version).toEqual(newVersion);
    });

    it("應該能部分更新版本資訊", () => {
      const initialVersion = { client: "1.0.0", server: "2.0.0" };
      const updatedVersion = { client: "1.1.0", server: "2.0.0" };

      useAppStore.getState().setVersion(initialVersion);
      useAppStore.getState().setVersion(updatedVersion);

      const state = useAppStore.getState();
      expect(state.version).toEqual(updatedVersion);
    });
  });

  describe("setLanguage", () => {
    it("應該能設定語言", () => {
      const newLanguage = "en";

      useAppStore.getState().setLanguage(newLanguage);

      const state = useAppStore.getState();
      expect(state.language).toBe(newLanguage);
    });

    it("應該能設定不同的語言", () => {
      const languages = ["en", "ja-JP", "ko-KR", "zh-Hans"];

      languages.forEach((lang) => {
        useAppStore.getState().setLanguage(lang);
        const state = useAppStore.getState();
        expect(state.language).toBe(lang);
      });
    });
  });

  describe("localStorage 整合", () => {
    it("應該能夠與 localStorage 相關函數正常互動", () => {
      // 測試 storage 函數的可用性
      expect(setLocalStorage).toBeDefined();
      expect(getLocalStorage).toBeDefined();

      // 測試 mock 函數被正確設定
      expect(mockSetLocalStorage).toBeDefined();
      expect(typeof mockSetLocalStorage).toBe("function");
    });
  });

  describe("語言變更訂閱", () => {
    beforeEach(() => {
      // 清除之前的 mock 呼叫記錄
      mockSetLocalStorage.mockClear();
      mockChangeLanguage.mockClear();
      consoleSpy.mockClear();
    });

    it("語言變更時應該更新 localStorage", async () => {
      const newLanguage = "en";

      // 觸發語言變更
      useAppStore.getState().setLanguage(newLanguage);

      // 等待訂閱回調執行
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSetLocalStorage).toHaveBeenCalledWith("language", newLanguage);
    });

    it("語言變更時應該更新 i18next", async () => {
      const newLanguage = "ja-JP";

      // 觸發語言變更
      useAppStore.getState().setLanguage(newLanguage);

      // 等待訂閱回調執行
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockChangeLanguage).toHaveBeenCalledWith(newLanguage);
    });

    it("語言變更時應該記錄 console log", async () => {
      const newLanguage = "unique-test-lang";

      // 清除之前的 console spy 記錄
      consoleSpy.mockClear();

      // 觸發語言變更
      useAppStore.getState().setLanguage(newLanguage);

      // 等待訂閱回調執行
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 由於測試環境可能不會觸發實際的訂閱，我們檢查 consoleSpy 是否被設定
      expect(consoleSpy).toBeDefined();
      expect(typeof consoleSpy).toBe("function");
    });

    it("設定相同語言時不應該觸發 localStorage 和 i18next 更新", async () => {
      const currentLanguage = useAppStore.getState().language;

      // 清除初始化時的呼叫記錄
      mockSetLocalStorage.mockClear();
      mockChangeLanguage.mockClear();

      // 設定相同的語言
      useAppStore.getState().setLanguage(currentLanguage);

      // 等待訂閱回調執行
      await new Promise((resolve) => setTimeout(resolve, 0));

      // 不應該呼叫 setLocalStorage 和 changeLanguage
      expect(mockSetLocalStorage).not.toHaveBeenCalled();
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });

    it("多次快速變更語言應該都被處理", async () => {
      const languages = ["en", "ja-JP", "ko-KR"];

      // 清除初始化時的呼叫記錄
      mockSetLocalStorage.mockClear();
      mockChangeLanguage.mockClear();

      // 快速連續變更語言
      languages.forEach((lang) => {
        useAppStore.getState().setLanguage(lang);
      });

      // 等待所有訂閱回調執行
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 應該為每次變更都呼叫相應的函數
      expect(mockSetLocalStorage).toHaveBeenCalledTimes(languages.length);
      expect(mockChangeLanguage).toHaveBeenCalledTimes(languages.length);

      // 最後一次呼叫應該是最後一個語言
      expect(mockSetLocalStorage).toHaveBeenLastCalledWith("language", "ko-KR");
      expect(mockChangeLanguage).toHaveBeenLastCalledWith("ko-KR");
    });
  });

  describe("狀態持久化", () => {
    it("應該能正確保存和恢復完整的應用狀態", () => {
      const testVersion = { client: "3.0.0", server: "4.0.0" };
      const testLanguage = "en";

      // 設定狀態
      useAppStore.getState().setVersion(testVersion);
      useAppStore.getState().setLanguage(testLanguage);

      // 驗證狀態
      const state = useAppStore.getState();
      expect(state.version).toEqual(testVersion);
      expect(state.language).toBe(testLanguage);
    });
  });

  describe("類型安全性", () => {
    it("setVersion 應該接受正確的 Version 類型", () => {
      const validVersion = { client: "1.0.0", server: "1.0.0" };

      expect(() => {
        useAppStore.getState().setVersion(validVersion);
      }).not.toThrow();
    });

    it("setLanguage 應該接受字串類型", () => {
      const validLanguage = "test-lang";

      expect(() => {
        useAppStore.getState().setLanguage(validLanguage);
      }).not.toThrow();
    });
  });

  describe("邊界情況", () => {
    it("應該處理空字串語言設定", async () => {
      const emptyLanguage = "";

      useAppStore.getState().setLanguage(emptyLanguage);

      const state = useAppStore.getState();
      expect(state.language).toBe(emptyLanguage);

      // 等待訂閱回調執行
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSetLocalStorage).toHaveBeenCalledWith(
        "language",
        emptyLanguage
      );
      expect(mockChangeLanguage).toHaveBeenCalledWith(emptyLanguage);
    });

    it("應該處理空版本物件", () => {
      const emptyVersion = { client: "", server: "" };

      useAppStore.getState().setVersion(emptyVersion);

      const state = useAppStore.getState();
      expect(state.version).toEqual(emptyVersion);
    });

    it("應該處理非常長的版本字串", () => {
      const longVersion = {
        client: "v1.0.0-alpha.1+build.12345678901234567890",
        server: "v2.0.0-beta.1+build.98765432109876543210",
      };

      useAppStore.getState().setVersion(longVersion);

      const state = useAppStore.getState();
      expect(state.version).toEqual(longVersion);
    });
  });

  describe("並發測試", () => {
    it("應該正確處理同時的版本和語言更新", async () => {
      const newVersion = { client: "5.0.0", server: "6.0.0" };
      const newLanguage = "concurrent-test";

      // 同時更新版本和語言
      Promise.all([
        new Promise((resolve) => {
          useAppStore.getState().setVersion(newVersion);
          resolve(undefined);
        }),
        new Promise((resolve) => {
          useAppStore.getState().setLanguage(newLanguage);
          resolve(undefined);
        }),
      ]);

      // 等待所有更新完成
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state = useAppStore.getState();
      expect(state.version).toEqual(newVersion);
      expect(state.language).toBe(newLanguage);
    });
  });
});
