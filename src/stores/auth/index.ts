import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  username: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string): Promise<boolean> => {
        // 模擬登入 API 請求
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 簡單驗證邏輯（實際應用中應該從 API 獲取）
        if (username === "admin" && password === "password") {
          const user: User = {
            id: "1",
            username: "admin",
            name: "管理員"
          };
          
          set({
            user,
            isAuthenticated: true,
          });
          
          return true;
        }
        
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        const { user } = get();
        return !!user;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);