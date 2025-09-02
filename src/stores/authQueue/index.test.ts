import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'
import { refreshToken } from '@/apis/global/user'
import { hasIP } from '@/utils/jwt'
import { removeLocalStorage } from '@/utils/storage'
import { useAuthQueueStore } from './index'

// Mock 外部依賴
vi.mock('@/apis/global/user', () => ({
    refreshToken: vi.fn(),
}))

vi.mock('@/utils/jwt', () => ({
    hasIP: vi.fn(),
}))

vi.mock('@/utils/storage', () => ({
    removeLocalStorage: vi.fn(),
}))

const mockRefreshToken = refreshToken as MockedFunction<typeof refreshToken>
const mockHasIP = hasIP as MockedFunction<typeof hasIP>
const mockRemoveLocalStorage = removeLocalStorage as MockedFunction<typeof removeLocalStorage>

interface MockAxiosRequest {
    request: MockedFunction<AxiosInstance['request']>
}

describe('AuthQueue Store', () => {
    let store: ReturnType<typeof useAuthQueueStore.getState>
    let mockAxios: AxiosInstance & MockAxiosRequest
    let mockConfig: InternalAxiosRequestConfig
    let mockResponse: AxiosResponse

    beforeEach(() => {
        // 重置 store 狀態
        useAuthQueueStore.getState().reset()
        store = useAuthQueueStore.getState()

        // 清除所有 mock
        vi.clearAllMocks()

        // 創建 mock 物件
        mockAxios = {
            request: vi.fn(),
        } as AxiosInstance & MockAxiosRequest

        mockConfig = {
            url: '/test',
            method: 'get',
            headers: {},
        } as InternalAxiosRequestConfig

        mockResponse = {
            data: { message: 'success' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: mockConfig,
        }
    })

    describe('初始狀態', () => {
        it('應該有正確的初始狀態', () => {
            expect(store.isRefreshing).toBe(false)
            expect(store.rateLimit).toBe(6)
            expect(store.queue).toEqual([])
            expect(store.size()).toBe(0)
        })
    })

    describe('enqueueTask', () => {
        it('應該能將任務添加到佇列', () => {
            const resolve = vi.fn()
            const reject = vi.fn()

            store.enqueueTask({ config: mockConfig, resolve, reject })

            const state = useAuthQueueStore.getState()
            expect(state.queue).toHaveLength(1)
            expect(state.queue[0].config).toEqual(mockConfig)
            expect(state.queue[0].resolve).toBe(resolve)
            expect(state.queue[0].reject).toBe(reject)
            expect(state.queue[0].createdAt).toBeTypeOf('number')
            expect(state.size()).toBe(1)
        })

        it('應該能添加多個任務到佇列', () => {
            const task1 = { config: mockConfig, resolve: vi.fn(), reject: vi.fn() }
            const task2 = {
                config: { ...mockConfig, url: '/test2' },
                resolve: vi.fn(),
                reject: vi.fn(),
            }

            store.enqueueTask(task1)
            store.enqueueTask(task2)

            const state = useAuthQueueStore.getState()
            expect(state.queue).toHaveLength(2)
            expect(state.size()).toBe(2)
        })
    })

    describe('clearQueue', () => {
        it('應該能清空佇列', () => {
            // 先添加一些任務
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject: vi.fn() })
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject: vi.fn() })

            expect(useAuthQueueStore.getState().queue).toHaveLength(2)

            store.clearQueue()

            const state = useAuthQueueStore.getState()
            expect(state.queue).toHaveLength(0)
            expect(state.size()).toBe(0)
        })
    })

    describe('rejectAllQueue', () => {
        it('應該拒絕所有佇列中的任務並清空佇列', () => {
            const reject1 = vi.fn()
            const reject2 = vi.fn()
            const error = new Error('Test error')

            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject: reject1 })
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject: reject2 })

            store.rejectAllQueue(error)

            expect(reject1).toHaveBeenCalledWith(error)
            expect(reject2).toHaveBeenCalledWith(error)
            expect(useAuthQueueStore.getState().queue).toHaveLength(0)
        })

        it('應該處理 reject 函數拋出的錯誤', () => {
            const reject = vi.fn().mockImplementation(() => {
                throw new Error('Reject error')
            })
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
                // 空實現，只是為了抑制警告輸出
            })

            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject })

            const error = new Error('Test error')
            store.rejectAllQueue(error)

            expect(reject).toHaveBeenCalledWith(error)
            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to reject task:', expect.any(Error))
            expect(useAuthQueueStore.getState().queue).toHaveLength(0)

            consoleWarnSpy.mockRestore()
        })
    })

    describe('clearTokens', () => {
        it('應該清除 localStorage 中的 tokens', () => {
            store.clearTokens()

            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('accessToken')
            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('refreshToken')
        })
    })

    describe('handle401', () => {
        it('應該將任務添加到佇列並觸發 token 刷新', async () => {
            mockRefreshToken.mockResolvedValue({
                data: { accessToken: 'new-token', refreshToken: 'new-refresh-token' },
            } as AxiosResponse)
            mockHasIP.mockReturnValue(true)
            mockAxios.request.mockResolvedValue(mockResponse)

            const promise = store.handle401(mockConfig, mockAxios)

            // 檢查是否設置為刷新狀態
            expect(useAuthQueueStore.getState().isRefreshing).toBe(true)

            await promise

            expect(mockRefreshToken).toHaveBeenCalled()
        })

        it('應該在已經刷新時只添加任務到佇列', async () => {
            // 設置為已經在刷新狀態
            useAuthQueueStore.setState({ isRefreshing: true })

            // 模擬刷新完成的流程
            mockRefreshToken.mockResolvedValue({
                data: { accessToken: 'new-token' },
            } as AxiosResponse)
            mockAxios.request.mockResolvedValue(mockResponse)

            const promise = store.handle401(mockConfig, mockAxios)

            // 應該有任務在佇列中
            expect(useAuthQueueStore.getState().queue).toHaveLength(1)
            // 但不應該再次觸發刷新
            expect(mockRefreshToken).not.toHaveBeenCalled()

            // 手動觸發刷新完成來解決 promise
            useAuthQueueStore.setState({ isRefreshing: false })
            await store.handlerByRefreshAccessToken(mockAxios)

            await promise
        })
    })

    describe('handlerByRefreshAccessToken', () => {
        it('應該在達到重試限制時清除 tokens 並拒絕所有任務', async () => {
            // 設置重試限制為 0
            useAuthQueueStore.setState({ rateLimit: 0 })

            const reject = vi.fn()
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('accessToken')
            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('refreshToken')
            expect(reject).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'REFRESH_LIMIT_EXCEEDED',
                    status: 401,
                })
            )
            expect(useAuthQueueStore.getState().isRefreshing).toBe(false)
        })

        it('應該在刷新成功時重放佇列中的請求', async () => {
            const responseData = { accessToken: 'new-token', refreshToken: 'new-refresh-token' }
            mockRefreshToken.mockResolvedValue({ data: responseData } as AxiosResponse)
            mockHasIP.mockReturnValue(true)
            mockAxios.request.mockResolvedValue(mockResponse)

            const resolve = vi.fn()
            const reject = vi.fn()
            store.enqueueTask({ config: mockConfig, resolve, reject })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(mockRefreshToken).toHaveBeenCalled()
            expect(mockAxios.request).toHaveBeenCalledWith(mockConfig)
            expect(resolve).toHaveBeenCalledWith(mockResponse)
            expect(reject).not.toHaveBeenCalled()
            expect(useAuthQueueStore.getState().queue).toHaveLength(0)
            expect(useAuthQueueStore.getState().isRefreshing).toBe(false)
        })

        it('應該在新 token 有 IP 時重置重試限制', async () => {
            const responseData = { accessToken: 'new-token-with-ip' }
            mockRefreshToken.mockResolvedValue({ data: responseData } as AxiosResponse)
            mockHasIP.mockReturnValue(true)

            // 設置較低的重試限制
            useAuthQueueStore.setState({ rateLimit: 2 })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(mockHasIP).toHaveBeenCalledWith('new-token-with-ip')
            expect(useAuthQueueStore.getState().rateLimit).toBe(6) // 應該重置為初始值
        })

        it('應該在新 token 沒有 IP 時不重置重試限制', async () => {
            const responseData = { accessToken: 'new-token-without-ip' }
            mockRefreshToken.mockResolvedValue({ data: responseData } as AxiosResponse)
            mockHasIP.mockReturnValue(false)

            // 設置較低的重試限制
            useAuthQueueStore.setState({ rateLimit: 2 })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(mockHasIP).toHaveBeenCalledWith('new-token-without-ip')
            expect(useAuthQueueStore.getState().rateLimit).toBe(1) // 應該減少而不是重置
        })

        it('應該處理重放請求時的錯誤', async () => {
            mockRefreshToken.mockResolvedValue({
                data: { accessToken: 'new-token' },
            } as AxiosResponse)

            const requestError = new Error('Request failed')
            mockAxios.request.mockRejectedValue(requestError)

            const resolve = vi.fn()
            const reject = vi.fn()
            store.enqueueTask({ config: mockConfig, resolve, reject })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(resolve).not.toHaveBeenCalled()
            expect(reject).toHaveBeenCalledWith(requestError)
        })

        it('應該在刷新失敗且狀態碼為 401 時清除 tokens', async () => {
            const refreshError = new Error('Unauthorized')
            Object.assign(refreshError, { response: { status: 401 } })
            mockRefreshToken.mockRejectedValue(refreshError)

            const reject = vi.fn()
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('accessToken')
            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('refreshToken')
            expect(reject).toHaveBeenCalledWith(refreshError)
            expect(useAuthQueueStore.getState().isRefreshing).toBe(false)
        })

        it('應該在刷新失敗但狀態碼不是 401 時不清除 tokens', async () => {
            const refreshError = new Error('Internal Server Error')
            Object.assign(refreshError, { response: { status: 500 } })
            mockRefreshToken.mockRejectedValue(refreshError)

            const reject = vi.fn()
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(mockRemoveLocalStorage).not.toHaveBeenCalled()
            expect(reject).toHaveBeenCalledWith(refreshError)
        })

        it('應該處理不同的錯誤物件格式', async () => {
            const refreshError = { status: 401 } // 沒有 response 屬性
            mockRefreshToken.mockRejectedValue(refreshError)

            const reject = vi.fn()
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('accessToken')
            expect(mockRemoveLocalStorage).toHaveBeenCalledWith('refreshToken')
        })

        it('應該處理字符串錯誤', async () => {
            const refreshError = 'String error'
            mockRefreshToken.mockRejectedValue(refreshError)

            const reject = vi.fn()
            store.enqueueTask({ config: mockConfig, resolve: vi.fn(), reject })

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(reject).toHaveBeenCalledWith(new Error('String error'))
        })

        it('應該減少重試限制', async () => {
            mockRefreshToken.mockResolvedValue({
                data: { accessToken: 'new-token' },
            } as AxiosResponse)

            const initialRateLimit = useAuthQueueStore.getState().rateLimit

            await store.handlerByRefreshAccessToken(mockAxios)

            expect(useAuthQueueStore.getState().rateLimit).toBe(initialRateLimit - 1)
        })
    })

    describe('reset', () => {
        it('應該重置所有狀態到初始值', () => {
            // 設置一些狀態
            useAuthQueueStore.setState({
                isRefreshing: true,
                rateLimit: 2,
                queue: [
                    {
                        config: mockConfig,
                        resolve: vi.fn(),
                        reject: vi.fn(),
                        createdAt: Date.now(),
                    },
                ],
            })

            store.reset()

            const state = useAuthQueueStore.getState()
            expect(state.isRefreshing).toBe(false)
            expect(state.rateLimit).toBe(6)
            expect(state.queue).toEqual([])
        })
    })

    describe('複雜場景測試', () => {
        it('應該正確處理多個並發的 401 請求', async () => {
            mockRefreshToken.mockResolvedValue({
                data: { accessToken: 'new-token' },
            } as AxiosResponse)
            mockAxios.request.mockResolvedValue(mockResponse)

            // 模擬多個並發請求
            const promises = [
                store.handle401({ ...mockConfig, url: '/api1' }, mockAxios),
                store.handle401({ ...mockConfig, url: '/api2' }, mockAxios),
                store.handle401({ ...mockConfig, url: '/api3' }, mockAxios),
            ]

            await Promise.all(promises)

            // 應該只調用一次 refreshToken
            expect(mockRefreshToken).toHaveBeenCalledTimes(1)
            // 應該調用三次 request (重放每個請求)
            expect(mockAxios.request).toHaveBeenCalledTimes(3)
            // 佇列應該被清空
            expect(useAuthQueueStore.getState().queue).toHaveLength(0)
        })

        it('應該在佇列處理過程中正確處理新的 401 請求', async () => {
            let resolveRefresh: (value: AxiosResponse) => void
            const refreshPromise = new Promise<AxiosResponse>((resolve) => {
                resolveRefresh = resolve
            })
            mockRefreshToken.mockReturnValue(refreshPromise)

            // 第一個請求觸發刷新
            const firstRequest = store.handle401({ ...mockConfig, url: '/api1' }, mockAxios)

            // 在刷新過程中又來了一個請求
            const secondRequest = store.handle401({ ...mockConfig, url: '/api2' }, mockAxios)

            // 此時佇列應該有兩個任務
            expect(useAuthQueueStore.getState().queue).toHaveLength(2)
            expect(useAuthQueueStore.getState().isRefreshing).toBe(true)

            // 完成刷新
            mockAxios.request.mockResolvedValue(mockResponse)
            resolveRefresh!({
                data: { accessToken: 'new-token' },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: mockConfig,
            } as AxiosResponse)

            await Promise.all([firstRequest, secondRequest])

            expect(useAuthQueueStore.getState().queue).toHaveLength(0)
            expect(useAuthQueueStore.getState().isRefreshing).toBe(false)
        })
    })
})
