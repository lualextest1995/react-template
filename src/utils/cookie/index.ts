import Cookies from 'js-cookie'

/**
 * Cookie 操作選項介面
 */
export interface CookieOptions {
    expires?: number | Date
    path?: string
    domain?: string
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    httpOnly?: boolean
}

/**
 * 設置 cookie
 * @param key - cookie 的鍵名
 * @param value - cookie 的值
 * @param options - cookie 設置選項
 */
export const setCookie = (key: string, value: string, options: CookieOptions = {}): void => {
    Cookies.set(key, value, options)
}

/**
 * 獲取 cookie 值
 * @param key - cookie 的鍵名
 * @returns cookie 值或 undefined
 */
export const getCookie = (key: string): string | undefined => {
    return Cookies.get(key)
}

/**
 * 刪除 cookie
 * @param key - cookie 的鍵名
 * @param options - cookie 刪除選項
 */
export const removeCookie = (key: string, options: CookieOptions = {}): void => {
    Cookies.remove(key, options)
}

/**
 * 檢查 cookie 是否存在
 * @param key - cookie 的鍵名
 * @returns 是否存在該 cookie
 */
export const hasCookie = (key: string): boolean => {
    return getCookie(key) !== undefined
}

/**
 * 獲取所有 cookies
 * @returns 所有 cookies 組成的物件
 */
export const getAllCookies = (): Record<string, string> => {
    return Cookies.get() || {}
}

/**
 * 清除所有 cookies
 */
export const clearAllCookies = (): void => {
    const cookies = getAllCookies()
    Object.keys(cookies).forEach((key) => removeCookie(key))
}

/**
 * 設置帶有效期的 cookie
 * @param key - cookie 的鍵名
 * @param value - cookie 的值
 * @param days - 有效期天數
 */
export const setCookieWithExpiry = (key: string, value: string, days: number): void => {
    setCookie(key, value, { expires: days })
}

/**
 * 獲取 cookie 值，如果不存在則返回預設值
 * @param key - cookie 的鍵名
 * @param defaultValue - 預設值
 * @returns cookie 值或預設值
 */
export const getCookieWithDefault = <T extends string>(
    key: string,
    defaultValue: T
): string | T => {
    return getCookie(key) ?? defaultValue
}

/**
 * 設置物件類型的 cookie
 * @param key - cookie 的鍵名
 * @param object - 要存儲的物件
 * @param options - cookie 設置選項
 */
export const setObjectCookie = <T extends Record<string, unknown>>(
    key: string,
    object: T,
    options: CookieOptions = {}
): void => {
    try {
        const jsonString = JSON.stringify(object)
        setCookie(key, jsonString, options)
    } catch {
        // 處理循環引用等序列化錯誤
        setCookie(key, '{}', options)
    }
}

/**
 * 獲取物件類型的 cookie
 * @param key - cookie 的鍵名
 * @returns 解析後的物件或 null
 */
export const getObjectCookie = <T extends Record<string, unknown>>(key: string): T | null => {
    const value = getCookie(key)
    if (!value) {
        return null
    }

    try {
        return JSON.parse(value) as T
    } catch {
        return null
    }
}

/**
 * 設置陣列類型的 cookie
 * @param key - cookie 的鍵名
 * @param array - 要存儲的陣列
 * @param options - cookie 設置選項
 */
export const setArrayCookie = <T>(key: string, array: T[], options: CookieOptions = {}): void => {
    const jsonString = JSON.stringify(array)
    setCookie(key, jsonString, options)
}

/**
 * 獲取陣列類型的 cookie
 * @param key - cookie 的鍵名
 * @returns 解析後的陣列或空陣列
 */
export const getArrayCookie = <T>(key: string): T[] => {
    const value = getCookie(key)
    if (!value) {
        return []
    }

    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

/**
 * 設置安全的 cookie
 * @param key - cookie 的鍵名
 * @param value - cookie 的值
 * @param options - 額外的 cookie 設置選項
 */
export const setSecureCookie = (key: string, value: string, options: CookieOptions = {}): void => {
    const secureOptions: CookieOptions = {
        secure: true,
        sameSite: 'strict',
        path: '/',
        ...options,
    }
    setCookie(key, value, secureOptions)
}

/**
 * 設置會話 cookie (瀏覽器關閉時自動刪除)
 * @param key - cookie 的鍵名
 * @param value - cookie 的值
 */
export const setSessionCookie = (key: string, value: string): void => {
    setCookie(key, value, { path: '/' })
}

/**
 * 獲取指定 cookie 的大小
 * @param key - cookie 的鍵名
 * @returns cookie 的大小 (bytes)
 */
export const getCookieSize = (key: string): number => {
    const value = getCookie(key)
    return value ? new Blob([value]).size : 0
}

/**
 * 獲取所有 cookies 的總大小
 * @returns 所有 cookies 的總大小 (bytes)
 */
export const getTotalCookieSize = (): number => {
    const cookieString = document.cookie
    return cookieString ? new Blob([cookieString]).size : 0
}
