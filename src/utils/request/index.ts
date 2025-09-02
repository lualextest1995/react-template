// request.ts

import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios, { AxiosHeaders } from 'axios'
import * as R from 'ramda'
import { useAuthQueueStore } from '@/stores/authQueue'
import { getCookie, removeCookie, setCookie } from '@/utils/cookie'
import { getExpiredTime, hasIP, isExpired, isValid } from '@/utils/jwt'
import { getLocalStorage } from '@/utils/storage'

/** --------- 遞迴 key 映射工具 --------- */

/**
 * 鍵值映射表，用於定義前端與後端欄位名稱的對應關係
 * @description backend_key -> frontendKey
 */
type KeyMap = Record<string, string>

/**
 * 檢查一個值是否為純對象（plain object）
 * @param v - 待檢查的值
 * @returns 如果是純對象則返回 true，否則返回 false
 */
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    R.is(Object, v) && !R.isNil(v) && Object.getPrototypeOf(v) === Object.prototype

/**
 * 遞迴地映射對象的鍵名，支援深層嵌套的對象和陣列
 * @param input - 待映射的輸入值（可以是對象、陣列或基本類型）
 * @param keyMap - 鍵值映射表
 * @param direction - 映射方向：'b2f' 表示後端到前端，'f2b' 表示前端到後端
 * @returns 映射後的值
 */
export const mapKeys = (input: unknown, keyMap: KeyMap, direction: 'b2f' | 'f2b'): unknown => {
    if (Array.isArray(input)) {
        return R.map((x) => mapKeys(x, keyMap, direction), input)
    }
    if (!isPlainObject(input)) {
        return input
    }

    const getKeyMapping = (k: string): string => {
        if (direction === 'b2f') {
            return keyMap[k] ?? k // 後端 → 前端
        }
        // 前端 → 後端 (反查)
        const backendKey = R.find((bk: string) => keyMap[bk] === k, R.keys(keyMap))
        return backendKey ?? k
    }

    return R.pipe(
        R.toPairs,
        R.map(
            ([k, v]: [string, unknown]) =>
                [getKeyMapping(k), mapKeys(v, keyMap, direction)] as [string, unknown]
        ),
        R.fromPairs
    )(input as Record<string, unknown>)
}

/**
 * 驗證並轉換請求資料
 * @description 使用 codec 配置對請求資料進行驗證和格式轉換
 * @param config - Axios 請求配置對象
 * @returns 驗證和轉換後的資料，如果驗證失敗則返回原始資料
 */
export const requestValidate = (config: AxiosRequestConfig): unknown => {
    const { codec, data, url } = config

    if (!codec?.request) {
        return data
    }

    try {
        const { frontendSchema, backendSchema } = codec.request!
        const dataKeyMap = codec.dataKeyMap ?? {}

        return R.pipe(
            (d) => frontendSchema.parse(d),
            (parsed) => (R.isEmpty(dataKeyMap) ? parsed : mapKeys(parsed, dataKeyMap, 'f2b')),
            (mapped) => backendSchema.parse(mapped)
        )(data)
    } catch (err) {
        console.warn(`路徑 ${url} 請求資料格式錯誤`, err)
        return data
    }
}

/**
 * 驗證並轉換回應資料
 * @description 使用 codec 配置對回應資料進行驗證和格式轉換
 * @param response - Axios 回應對象
 * @returns 驗證和轉換後的資料，如果驗證失敗則返回原始資料
 */
export const responseValidate = (response: AxiosResponse): unknown => {
    const { config, data, status } = response
    const codec = config.codec

    if (!codec?.response) {
        return data
    }

    try {
        const { frontendSchema, backendSchema } = codec.response!
        const dataKeyMap = codec.dataKeyMap ?? {}

        return R.pipe(
            (d) => backendSchema.parse(d),
            (parsed) => (R.isEmpty(dataKeyMap) ? parsed : mapKeys(parsed, dataKeyMap, 'b2f')),
            (mapped) => frontendSchema.parse(mapped)
        )(data)
    } catch (err) {
        console.warn(`路徑 ${config.url} 回應資料格式錯誤 (HTTP ${status})`, err)
        return data
    }
}

/**
 * 函數式風格的請求處理 - 請求上下文介面
 * @description 定義請求處理過程中需要的上下文資訊
 */
// FP-style 請求處理函數
interface RequestContext {
    config: AxiosRequestConfig
    isOnline: boolean
    accessToken: string | null
    refreshToken: string | null
    language: string | null
    isRefreshToken: boolean
}

/**
 * 擴展的請求上下文介面，包含已驗證的資料
 * @description 在資料驗證處理後的上下文，包含驗證後的資料
 */
interface ProcessedRequestContext extends RequestContext {
    validatedData: unknown
}

/**
 * 創建請求上下文
 * @description 從 Axios 配置和環境狀態創建請求處理上下文
 * @param config - Axios 請求配置
 * @returns 包含請求相關資訊的上下文對象
 */
const createRequestContext = (config: AxiosRequestConfig): RequestContext => ({
    config,
    isOnline: navigator.onLine,
    accessToken: getCookie('accessToken') ?? null,
    refreshToken: getCookie('refreshToken') ?? null,
    language: getLocalStorage('language', null),
    isRefreshToken: config.url === '/authorization/refreshToken',
})

/**
 * 驗證網路連接狀態
 * @description 檢查網路連接，如果離線則拋出錯誤
 * @param context - 請求上下文
 * @returns 驗證通過的上下文
 * @throws {Error} 當網路離線時拋出 NETWORK_OFFLINE 錯誤
 */
const validateNetworkConnection = (context: RequestContext): RequestContext => {
    if (!context.isOnline) {
        console.warn('網路連線已斷開，請檢查您的網路設定')
        throw new Error('NETWORK_OFFLINE')
    }
    return context
}

/**
 * 處理請求資料驗證
 * @description 使用 codec 對請求資料進行驗證和轉換
 * @param context - 請求上下文
 * @returns 包含驗證後資料的處理上下文
 */
const processRequestData = (context: RequestContext): ProcessedRequestContext => {
    const { config } = context
    const { codec, isCodec = false } = config

    const shouldValidate =
        codec && R.is(Object, codec) && !R.isNil(codec) && R.has('request', codec) && !isCodec

    if (shouldValidate) {
        const validatedData = requestValidate(config)
        return R.pipe(
            R.assoc('validatedData', validatedData || config.data || {}),
            R.assocPath(['config', 'isCodec'], true)
        )(context)
    }

    return R.assoc('validatedData', config.data || {}, context)
}

/**
 * 根據 HTTP 方法設置請求資料位置
 * @description 根據請求方法決定將資料放在 body 還是 query parameters
 * @param context - 已處理的請求上下文
 * @returns 更新配置後的上下文
 */
const setRequestMethod = (context: ProcessedRequestContext): ProcessedRequestContext => {
    const { config, validatedData } = context
    const writeMethod = ['post', 'put', 'patch', 'delete']
    const isWrite = R.includes(R.toLower(config.method ?? ''), writeMethod)

    const updatedConfig = isWrite
        ? R.assoc('data', validatedData, config)
        : R.assoc('params', validatedData, config)

    return R.assoc('config', updatedConfig, context)
}

/**
 * 創建請求標頭
 * @description 根據上下文資訊創建包含語言和認證信息的 HTTP 標頭
 * @param context - 請求上下文
 * @returns 配置完成的 AxiosHeaders 對象
 */
const createHeaders = (context: RequestContext): AxiosHeaders => {
    const { language, accessToken, refreshToken, isRefreshToken } = context
    const headers = new AxiosHeaders()

    // 複製原有 headers
    if (context.config.headers) {
        R.toPairs(context.config.headers).forEach(([key, value]) => {
            headers.set(key, value)
        })
    }

    // 設置語言標頭
    const withLanguage = R.when(
        () => Boolean(language),
        (h: AxiosHeaders) => h.set('x-locale', language!)
    )

    // 設置認證標頭
    const withAuth = R.when(
        () =>
            Boolean(
                accessToken &&
                    refreshToken &&
                    isValid(accessToken) &&
                    isValid(refreshToken) &&
                    !isExpired(accessToken)
            ),
        (h: AxiosHeaders) => {
            if (isRefreshToken && !hasIP(accessToken!)) {
                return h
            }
            h.set('x-access-token', accessToken!)
            if (isRefreshToken) {
                h.set('x-refresh-token', refreshToken!)
            }
            return h
        }
    )

    return R.pipe(withLanguage, withAuth)(headers)
}

/**
 * Axios 實例 - 預配置的 HTTP 客戶端
 * @description 創建具有基礎配置的 Axios 實例，包含 baseURL、timeout 和預設標頭
 */
// 建立 axios instance
const http = axios.create({
    baseURL: '/api',
    timeout: 24 * 60 * 60 * 1000, // 24h
    headers: {
        'Content-Type': 'application/json',
        charset: 'utf-8',
    },
})

/**
 * 請求攔截器
 * @description 在發送請求前進行資料驗證、網路檢查、標頭設置等處理
 */
// 請求攔截器
http.interceptors.request.use(
    (config) => {
        try {
            const context = createRequestContext(config)
            const validatedContext = validateNetworkConnection(context)
            const processedContext = processRequestData(validatedContext)
            const finalContext = setRequestMethod(processedContext)
            const headers = createHeaders(finalContext)

            return {
                ...finalContext.config,
                headers,
            }
        } catch (error) {
            return Promise.reject(error)
        }
    },
    (error) => Promise.reject(error)
)

/**
 * 函數式風格的回應處理 - 回應上下文介面
 * @description 定義回應處理過程中需要的上下文資訊
 */
// FP-style 回應處理函數
interface ResponseContext {
    response: AxiosResponse
    responseData: unknown
    accessToken: string | null
    refreshToken: string | null
}

/**
 * 創建回應上下文
 * @description 從 Axios 回應創建回應處理上下文，包含驗證後的資料和認證令牌
 * @param response - Axios 回應對象
 * @returns 包含回應相關資訊的上下文對象
 */
const createResponseContext = (response: AxiosResponse): ResponseContext => {
    const codec = response.config.codec
    const responseData = R.has('response', codec || {}) ? responseValidate(response) : response.data

    const getToken = (path: string[]) => R.path(path, responseData) as string | null

    return {
        response,
        responseData,
        accessToken: getToken(['data', 'accessToken']) ?? getToken(['data', 'access_token']),
        refreshToken: getToken(['data', 'refreshToken']) ?? getToken(['data', 'refresh_token']),
    }
}

/**
 * 處理認證令牌
 * @description 從回應資料中提取並儲存 access token 和 refresh token
 * @param context - 回應上下文
 * @returns 處理完成的回應上下文
 */
const processTokens = (context: ResponseContext): ResponseContext => {
    const { accessToken, refreshToken } = context

    if (accessToken) {
        setCookie('accessToken', accessToken)
    }

    if (refreshToken) {
        const expiredTime = getExpiredTime(refreshToken)
        const expiredDate = new Date(expiredTime * 1000)
        setCookie('refreshToken', refreshToken, { expires: expiredDate })
    }

    return context
}

/**
 * 檢查回應資料類型
 * @description 檢查回應資料是否為 Blob 或 ArrayBuffer 類型，決定返回格式
 * @param context - 回應上下文
 * @returns 適當格式的 Axios 回應對象
 */
const checkResponseType = (context: ResponseContext): AxiosResponse => {
    const { response, responseData } = context
    const type = Object.prototype.toString.call(responseData)
    const isBlobOrArrayBuffer = R.includes(type, ['[object Blob]', '[object ArrayBuffer]'])

    return isBlobOrArrayBuffer ? response : R.assoc('data', responseData, response)
}

/**
 * 錯誤處理上下文介面
 * @description 定義錯誤處理過程中需要的上下文資訊
 */
// 錯誤處理函數
interface ErrorContext {
    error: unknown
    config?: AxiosRequestConfig
    status?: number
    response?: AxiosResponse
}

/**
 * 處理 refresh token 相關錯誤
 * @description 當 refresh token API 返回 401 錯誤時，清除儲存的認證令牌
 * @param errorContext - 錯誤上下文
 * @returns Promise，成功時解析為原錯誤，失敗時拒絕
 */
const handleRefreshTokenError = (errorContext: ErrorContext): Promise<unknown> => {
    const { error, config, status } = errorContext
    const isRefreshToken = config?.url === '/authorization/refreshToken'

    if (status === 401 && isRefreshToken) {
        removeCookie('accessToken')
        removeCookie('refreshToken')
        return Promise.reject(error)
    }

    return Promise.resolve(error)
}

/**
 * 處理 Blob 格式錯誤回應
 * @description 解析 Blob 格式的錯誤回應，提取 JSON 錯誤資訊
 * @param errorContext - 錯誤上下文
 * @returns Promise，處理後的錯誤資訊
 */
const handleBlobError = async (errorContext: ErrorContext): Promise<unknown> => {
    const { error, config, response } = errorContext

    if (response?.data instanceof Blob) {
        try {
            const text = await (response.data as Blob).text()
            const json = JSON.parse(text)
            if (json?.status === 401 && config) {
                const q = useAuthQueueStore.getState()
                return q.handle401(config, http)
            }
            // 類型安全的錯誤合併
            const errorObj = R.is(Object, error) && !R.isNil(error) ? error : {}
            return Promise.reject(R.assoc('parsed', json, errorObj))
        } catch {
            return Promise.reject(error)
        }
    }

    return error
}

/**
 * 處理 401 和 400 錯誤
 * @description 對於 401 和 400 錯誤，使用認證佇列進行統一處理
 * @param errorContext - 錯誤上下文
 * @returns Promise，處理後的結果
 */
const handle401Error = (errorContext: ErrorContext): Promise<unknown> => {
    const { error, config, status } = errorContext

    if (R.includes(status, [400, 401]) && config) {
        const q = useAuthQueueStore.getState()
        return q.handle401(config, http)
    }

    return Promise.reject(error)
}

/**
 * 回應攔截器
 * @description 處理回應資料驗證、令牌提取和錯誤處理
 */
// 回應攔截器
http.interceptors.response.use(
    (response) => {
        const context = createResponseContext(response)
        const processedContext = processTokens(context)
        return checkResponseType(processedContext)
    },
    async (error) => {
        try {
            const errorContext: ErrorContext = {
                error,
                config: error.config,
                status: error.status,
                response: error.response,
            }

            // 使用 composition 處理錯誤
            const refreshTokenResult = await handleRefreshTokenError(errorContext)
            // 如果 refreshTokenResult 不等於原始錯誤，表示已處理，則返回該結果
            if (refreshTokenResult !== error) {
                return refreshTokenResult
            }

            // 如果 blobResult 不等於原始錯誤，表示已處理，則返回該結果
            const blobResult = await handleBlobError(errorContext)
            if (blobResult !== error) {
                return blobResult
            }

            return await handle401Error(errorContext)
        } catch (finalError) {
            return Promise.reject(finalError)
        }
    }
)

/**
 * 預設匯出的 HTTP 客戶端
 * @description 完全配置的 Axios 實例，包含請求/回應攔截器、資料驗證、認證處理等功能
 * @default
 */
export default http
