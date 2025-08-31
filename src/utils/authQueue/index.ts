import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { create } from 'zustand'
import { refreshToken } from '@/apis/global/user'
import { hasIP } from '@/utils/jwt'
import { removeLocalStorage } from '@/utils/storage'

/** 刷新 token 的最大重試次數 */
const REFRESH_LIMIT = 6

/**
 * 佇列任務介面
 * 代表一個等待重新執行的 HTTP 請求
 */
interface QueueTask {
    /** Axios 請求配置 */
    config: AxiosRequestConfig
    /** 成功時的回調函數 */
    resolve: (value: AxiosResponse) => void
    /** 失敗時的回調函數 */
    reject: (reason: Error) => void
    /** 任務創建時間戳 */
    createdAt: number
}

/**
 * 認證佇列狀態介面
 * 管理 token 刷新和請求重放的狀態
 */
interface AuthQueueState {
    /** 是否正在刷新 token */
    isRefreshing: boolean
    /** 剩餘重試次數 */
    rateLimit: number
    /** 等待重新執行的任務佇列 */
    queue: QueueTask[]
    /** 將任務添加到佇列 */
    enqueueTask: (task: Omit<QueueTask, 'createdAt'>) => void
    /** 清空佇列 */
    clearQueue: () => void
    /** 獲取佇列大小 */
    size: () => number
    /** 拒絕所有佇列中的任務 */
    rejectAllQueue: (err: Error) => void
    /** 清除本地存儲的 tokens */
    clearTokens: () => void
    /** 處理 401 錯誤，將請求加入佇列並觸發 token 刷新 */
    handle401: (config: AxiosRequestConfig, http: AxiosInstance) => Promise<AxiosResponse>
    /** 處理 token 刷新的主要流程 */
    handlerByRefreshAccessToken: (http: AxiosInstance) => Promise<void>
    /** 重置所有狀態 */
    reset: () => void
}

/**
 * 認證佇列管理 Store
 * 用於管理 token 刷新和請求重放的狀態
 */
export const useAuthQueueStore = create<AuthQueueState>((set, get) => ({
    isRefreshing: false,
    rateLimit: REFRESH_LIMIT,
    queue: [], // { config, resolve, reject, createdAt }

    /**
     * 將任務添加到佇列
     * @param task - 要添加的任務（不包含 createdAt）
     */
    enqueueTask: (task) =>
        set((s) => ({ queue: [...s.queue, { ...task, createdAt: Date.now() }] })),

    /**
     * 清空所有佇列中的任務
     */
    clearQueue: () => set({ queue: [] }),

    /**
     * 獲取當前佇列的大小
     * @returns 佇列中的任務數量
     */
    size: () => get().queue.length,

    /**
     * 拒絕所有佇列中的任務
     * @param err - 要傳遞給所有任務的錯誤
     */
    rejectAllQueue: (err: Error) => {
        const snapshot = get().queue
        for (const t of snapshot) {
            try {
                t.reject(err)
            } catch (error) {
                // 忽略 reject 錯誤
                console.warn('Failed to reject task:', error)
            }
        }
        get().clearQueue()
    },

    /**
     * 清除本地存儲中的 access token 和 refresh token
     */
    clearTokens: () => {
        removeLocalStorage('accessToken')
        removeLocalStorage('refreshToken')
    },

    /**
     * 處理 401 未授權錯誤
     * 將失敗的請求加入佇列，並在需要時觸發 token 刷新流程
     * @param config - 失敗的請求配置
     * @param http - Axios 實例
     * @returns Promise<AxiosResponse> - 重新執行後的響應
     */
    handle401: (config, http) =>
        new Promise((resolve, reject) => {
            const { enqueueTask, isRefreshing } = get()
            enqueueTask({ config, resolve, reject })
            if (!isRefreshing) {
                set({ isRefreshing: true })
                get().handlerByRefreshAccessToken(http)
            }
        }),

    /**
     * 處理 token 刷新的主要流程
     * 成功時重放佇列中的請求，失敗時拒絕所有請求，401 錯誤時清除 tokens
     * @param http - Axios 實例用於重新執行請求
     */
    handlerByRefreshAccessToken: async (http) => {
        const state = get()
        const { rateLimit, clearTokens, rejectAllQueue } = state

        if (rateLimit <= 0) {
            clearTokens()
            rejectAllQueue(Object.assign(new Error('REFRESH_LIMIT_EXCEEDED'), { status: 401 }))
            set({ isRefreshing: false })
            return
        }

        try {
            set((s) => ({ rateLimit: s.rateLimit - 1 }))
            const res = await refreshToken()
            await handleRefreshSuccess(res, http, get, set)
        } catch (err) {
            handleRefreshError(err, clearTokens, rejectAllQueue)
        } finally {
            set({ isRefreshing: false })
        }
    },

    /**
     * 重置所有狀態到初始值
     * 適用於登出或需要重新開始 token 刷新流程的場景
     */
    reset: () => set({ isRefreshing: false, rateLimit: REFRESH_LIMIT, queue: [] }),
}))

/**
 * 處理 token 刷新成功的邏輯
 * 重置重試次數（如果新 token 包含有效 IP）並重放佇列中的所有請求
 * @param res - 刷新 token 的響應
 * @param http - Axios 實例用於重新執行請求
 * @param get - 獲取當前狀態的函數
 * @param set - 設置狀態的函數
 */
async function handleRefreshSuccess(
    res: AxiosResponse,
    http: AxiosInstance,
    get: () => AuthQueueState,
    set: (partial: Partial<AuthQueueState>) => void
) {
    // 若新的 access token 具 IP，重置重試次數
    const newAccess = res?.data?.accessToken ?? res?.data?.access_token ?? null
    if (newAccess && hasIP(newAccess)) {
        set({ rateLimit: REFRESH_LIMIT })
    }

    // 重放佇列（token 寫入仍交給你的 response 成功攔截器）
    const snapshot = get().queue
    set({ queue: [] })

    for (const task of snapshot) {
        try {
            const resp = await http.request(task.config)
            task.resolve(resp)
        } catch (err) {
            task.reject(err instanceof Error ? err : new Error(String(err)))
        }
    }
}

/**
 * 處理 token 刷新失敗的邏輯
 * 根據錯誤狀態碼決定是否清除 tokens，並拒絕所有佇列中的任務
 * @param err - 刷新請求的錯誤
 * @param clearTokens - 清除 tokens 的函數
 * @param rejectAllQueue - 拒絕所有佇列任務的函數
 */
function handleRefreshError(
    err: unknown,
    clearTokens: () => void,
    rejectAllQueue: (err: Error) => void
) {
    const errorObj = err as { response?: { status?: number }; status?: number }
    const status = errorObj?.response?.status || errorObj?.status || 0

    if (status === 401) {
        clearTokens()
    }

    const errorToReject = err instanceof Error ? err : new Error(String(err))
    rejectAllQueue(errorToReject)
}
