import { create } from 'zustand'
import { removeLocalStorage } from '@/utils/storage'

export interface User {
    id: string
    username: string
    name: string
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
        removeLocalStorage('accessToken')
        removeLocalStorage('refreshToken')
    },
}))
