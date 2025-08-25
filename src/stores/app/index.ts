import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getLocalStorage, setLocalStorage } from "@/utils/storage";
import i18next from "@/i18n";

type Version = {
  client: string;
  server: string;
};

type AppState = {
  version: Version;
  language: string;
  setVersion: (version: Version) => void;
  setLanguage: (lang: string) => void;
};

const initialLanguage =
  typeof window !== "undefined"
    ? getLocalStorage("language", "zh-Hans")
    : "zh-Hans";

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    version: { client: "", server: "" },
    language: initialLanguage,
    setVersion: (version) => set({ version }),
    setLanguage: (language) => set({ language }),
  }))
);

if (typeof window !== "undefined") {
  // 首次載入時，根據 localStorage 設定 i18next 語言
  const initialState = useAppStore.getState();
  setLocalStorage("language", initialState.language);
  i18next.changeLanguage(initialState.language);

  // 訂閱語言變更
  useAppStore.subscribe(
    (state) => state.language,
    (language, prevLanguage) => {
      console.log("Language changed to:", language);
      if (language !== prevLanguage) {
        setLocalStorage("language", language);
        i18next.changeLanguage(language);
      }
    }
  );
}
