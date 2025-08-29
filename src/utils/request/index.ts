// request
import axios, { AxiosHeaders } from 'axios'
import z from 'zod'
import { decode } from '@/utils/jwt'
import { getLocalStorage, setLocalStorage } from '@/utils/storage'

/** --------- 遞迴 key 映射工具 --------- */
type KeyMap = Record<string, string> // backend_key -> frontendKey

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

export function mapKeys(input: unknown, keyMap: KeyMap, direction: 'b2f' | 'f2b'): unknown {
    if (Array.isArray(input)) {
        return input.map((x) => mapKeys(x, keyMap, direction))
    }
    if (!isPlainObject(input)) {
        return input
    }

    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) {
        const mapped =
            direction === 'b2f'
                ? (keyMap[k] ?? k) // 後端 → 前端
                : // 前端 → 後端 (反查)
                  (Object.keys(keyMap).find((bk) => keyMap[bk] === k) ?? k)

        out[mapped] = mapKeys(v, keyMap, direction)
    }
    return out
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

function requestValidate(config) {
    const { codec, data, url } = config
    try {
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

function responseValidate(response) {
    ;``
    const { config, data, status } = response
    try {
        const codec = config.codec
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
        const newConfig = { ...config }
        const newHeaders = new AxiosHeaders(headers)
        let newData = { ...data }

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

        // 添加 JWT token & Language 在 headers 中
        const accessToken = getLocalStorage('accessToken', null)
        if (accessToken) {
            newHeaders.set('x-access-token', accessToken)
        }
        const language = getLocalStorage('language', null)
        if (language) {
            newHeaders.set('x-locale', language)
        }
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
        const { config, data, status } = response
        const accessToken = data.data?.access_token ?? null
        const refreshToken = data.data?.refresh_token ?? null
        if (accessToken) {
            setLocalStorage('accessToken', accessToken)
        }
        if (refreshToken) {
            setLocalStorage('refreshToken', refreshToken)
        }
        // 使用 zod 進行簡單的回應資料驗證
        const codec = response.config.codec
        if (codec?.response) {
            return responseValidate(response)
        }
        return response.data
    },
    (error) => {
        const { response, config, status } = error
        console.log('error', response)
        const isRefreshToken = config.url === '/authorization/refreshToken'
        if (status === 401 && isRefreshToken) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            return Promise.reject(error)
        }
        return Promise.reject(error)
    }
)

export default http
