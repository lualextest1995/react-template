import { create } from 'zustand'
import { clearAllCookies, getCookie, setCookie } from '@/utils/cookie'

export interface User {
    id: string
    username: string
    name: string
    email: string
}

interface UserStore {
    user: User | null
    setUser: (user: User | null) => void
    resetUser: () => void
    isAuthenticated: boolean
}

export const useUserStore = create<UserStore>()((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    resetUser: () => {
        set({ user: null, isAuthenticated: false })
        clearAllCookies()
    },
}))

// 初始化
function initUser() {
    // setCookie('accessToken', 'mockAccessToken')
    // setCookie('refreshToken', 'mockRefreshToken')
    console.log('初始化用戶狀態')
    // 取得 access 跟 refresh token
    const accessToken = getCookie('accessToken') ?? null
    const refreshToken = getCookie('refreshToken') ?? null

    // 沒有 access token 也沒有 refresh token，重置用戶狀態
    if (!accessToken && !refreshToken) {
        return useUserStore.getState().resetUser()
    }

    // 有 access token，表示用戶已經登入，打 userInfo api 取得用戶資訊
    if (accessToken) {
        // 模擬拿到資料，塞入 store
        useUserStore.getState().setUser({
            id: '1',
            username: 'test',
            name: '測試用戶',
            email: 'test@example.com',
        })
        return
    }

    // 其餘情況，重置用戶狀態(不可能沒有 access token)
    return useUserStore.getState().resetUser()
}

initUser()
