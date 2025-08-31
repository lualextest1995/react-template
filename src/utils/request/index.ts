// request.ts

import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios, { AxiosHeaders } from 'axios'
import { useAuthQueueStore } from '@/utils/authQueue'
import { hasIP, isExpired, isValid } from '@/utils/jwt'
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/utils/storage'

/** --------- 遞迴 key 映射工具 --------- */
type KeyMap = Record<string, string> // backend_key -> frontendKey

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.prototype.toString.call(v) === '[object Object]'

export function mapKeys(input: unknown, keyMap: KeyMap, direction: 'b2f' | 'f2b'): unknown {
    if (Array.isArray(input)) {
        return input.map((x) => mapKeys(x, keyMap, direction))
    }
    if (!isPlainObject(input)) {
        return input
    }

    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) {
        const mapped =
            direction === 'b2f'
                ? (keyMap[k] ?? k) // 後端 → 前端
                : (Object.keys(keyMap).find((bk) => keyMap[bk] === k) ?? k) // 前端 → 後端 (反查)

        // biome-ignore lint/style/noParameterAssign: result is a local variable, not a parameter
        result[mapped] = mapKeys(v, keyMap, direction)
    }
    return result
}

// 建立 axios instance
const http = axios.create({
    baseURL: '/api',
    timeout: 24 * 60 * 60 * 1000, // 24h
    headers: {
        'Content-Type': 'application/json',
        charset: 'utf-8',
    },
})

function requestValidate(config: AxiosRequestConfig) {
    const { codec, data, url } = config
    try {
        if (!codec?.request) {
            return data
        }
        const { frontendSchema, backendSchema } = codec.request
        const dataKeyMap = codec.dataKeyMap ?? {}

        // 1. 驗證 frontend
        const parsedF = frontendSchema.parse(data)

        // 2. keyMap camel → snake
        const mapped =
            Object.keys(dataKeyMap).length > 0 ? mapKeys(parsedF, dataKeyMap, 'f2b') : parsedF

        // 3. 驗證 backend
        const parsedB = backendSchema.parse(mapped)

        return parsedB
    } catch (err) {
        console.warn(`路徑 ${url} 請求資料格式錯誤`, err)
    }
}

function responseValidate(response: AxiosResponse) {
    const { config, data, status } = response
    try {
        const codec = config.codec
        if (!codec?.response) {
            return data
        }
        const { frontendSchema, backendSchema } = codec.response
        const dataKeyMap = codec.dataKeyMap ?? {}

        // 1. 驗證 backend
        const parsedB = backendSchema.parse(data)

        // 2. keyMap snake → camel
        const mapped =
            Object.keys(dataKeyMap).length > 0 ? mapKeys(parsedB, dataKeyMap, 'b2f') : parsedB

        // 3. 驗證 frontend
        const parsedF = frontendSchema.parse(mapped)

        return parsedF
    } catch (err) {
        console.warn(`路徑 ${config.url} 回應資料格式錯誤 (HTTP ${status})`, err)
    }
}

// 請求攔截器
http.interceptors.request.use(
    (config) => {
        const { method, data, headers, codec } = config
        const isOnline = navigator.onLine
        const accessToken = getLocalStorage('accessToken', null)
        const refreshToken = getLocalStorage('refreshToken', null)
        const language = getLocalStorage('language', null)
        const isRefreshToken = config.url === '/authorization/refreshToken'
        const newConfig = { ...config }
        const newHeaders = new AxiosHeaders(headers)
        let newData = { ...data }

        // 檢查網路狀態
        if (!isOnline) {
            console.warn(`網路連線已斷開，請檢查您的網路設定`)
            return Promise.reject(new Error('NETWORK_OFFLINE'))
        }

        // 使用 zod 進行簡單的請求參數驗證
        if (codec?.request) {
            newData = requestValidate(config)
        }

        // 根據 HTTP method 自動決定將 data 放置在 params 或 data 字段
        const methodList = ['post', 'put', 'patch', 'delete']
        const isWrite = methodList.includes((method ?? '').toLowerCase())
        if (isWrite) {
            newConfig.data = newData
        } else {
            newConfig.params = newData
        }

        // 添加 Language 在 headers 中
        if (language) {
            newHeaders.set('x-locale', language)
            newConfig.headers = newHeaders
        }

        // 檢查 access token 跟 refresh token，其中一個沒有就不帶 token
        if (!accessToken || !refreshToken) {
            return newConfig
        }

        // 檢查 access token 跟 refresh token 是否合法，其中一個不合法就不帶 token
        if (!isValid(accessToken) || !isValid(refreshToken)) {
            return newConfig
        }

        // 檢查 access token 是否過期，沒有過期才帶 token
        if (isExpired(accessToken)) {
            return newConfig
        }

        // 如果是 refreshToken 的 api，且 accessToken 沒有 IP 資訊，則不帶 token
        if (isRefreshToken && !hasIP(accessToken)) {
            return newConfig
        }

        // 帶上 access token
        newHeaders.set('x-access-token', accessToken)

        // 如果是 refreshToken 的 api，則帶上 refresh token
        if (isRefreshToken) {
            newHeaders.set('x-refresh-token', refreshToken)
        }

        // 設定 headers
        newConfig.headers = newHeaders

        return newConfig
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 回應攔截器
http.interceptors.response.use(
    (response) => {
        // 使用 zod 進行簡單的回應資料驗證
        const codec = response.config.codec
        const responseData = codec?.response ? responseValidate(response) : response.data

        // 設置 access token 跟 refresh token
        const accessToken = responseData?.accessToken ?? responseData?.access_token ?? null
        const refreshToken = responseData?.refreshToken ?? responseData?.refresh_token ?? null
        if (accessToken) {
            setLocalStorage('accessToken', accessToken)
        }
        if (refreshToken) {
            setLocalStorage('refreshToken', refreshToken)
        }

        // 檢查回應資料類型
        const type = Object.prototype.toString.call(responseData)
        const isBlobOrArrayBuffer = type === '[object Blob]' || type === '[object ArrayBuffer]'
        if (isBlobOrArrayBuffer) {
            return response
        }

        return responseData
    },
    async (error) => {
        const { config, status, response } = error
        const isRefreshToken = config.url === '/authorization/refreshToken'
        if (status === 401 && isRefreshToken) {
            removeLocalStorage('accessToken')
            removeLocalStorage('refreshToken')
            return Promise.reject(error)
        }

        //Blob 錯誤解析（
        if (response?.data instanceof Blob) {
            try {
                const text = await (response.data as Blob).text()
                const json = JSON.parse(text)
                if (json?.status === 401 && config) {
                    const q = useAuthQueueStore.getState()
                    return q.handle401(config, http)
                }
                return Promise.reject(Object.assign(error, { parsed: json }))
            } catch {
                return Promise.reject(error)
            }
        }

        // 401 錯誤處理
        if (status === 401 && config) {
            const q = useAuthQueueStore.getState()
            return q.handle401(config, http)
        }
        return Promise.reject(error)
    }
)

export default http
