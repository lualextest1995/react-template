/**
 * 基於函數式程式設計的 localStorage 和 sessionStorage 工具庫
 * 提供型別安全、錯誤抗性的 storage 操作，並支援自動 JSON 序列化
 */

/**
 * Storage 類型枚舉，用於型別安全
 */
export type StorageType = 'localStorage' | 'sessionStorage'

/**
 * Storage 值的通用型別
 */
export type StorageValue = string | number | boolean | object | null

/**
 * 從 JSON 字串解析 storage 值
 * @param value - 要解析的字串值
 * @returns 解析後的值，若解析失敗則返回原始字串
 *
 * @example
 * parseStorageValue('{"name":"test"}') // { name: "test" }
 * parseStorageValue('invalid json') // "invalid json"
 */
export const parseStorageValue = (value: string): StorageValue => {
    try {
        return JSON.parse(value)
    } catch {
        return value
    }
}

/**
 * 將值序列化為 storage 字串
 * @param value - 要序列化的值
 * @returns 值的 JSON 字串表示
 *
 * @example
 * stringifyStorageValue({ name: "test" }) // '{"name":"test"}'
 * stringifyStorageValue("string") // '"string"'
 */
export const stringifyStorageValue = (value: StorageValue | undefined): string => {
    try {
        // 將 undefined 轉換為 null 處理
        const valueToStringify = value === undefined ? null : value
        return JSON.stringify(valueToStringify)
    } catch {
        return JSON.stringify(null)
    }
}

/**
 * 檢查指定的 storage 類型是否可用
 * @param storageType - 要檢查的 storage 類型
 * @returns 若 storage 可用則返回 true，否則返回 false
 *
 * @example
 * isStorageAvailable('localStorage') // true (在大多數瀏覽器中)
 * isStorageAvailable('sessionStorage') // true (在大多數瀏覽器中)
 */
export const isStorageAvailable = (storageType: StorageType): boolean => {
    try {
        const storage = window[storageType]
        const testKey = '__storage_test__'
        storage.setItem(testKey, 'test')
        storage.removeItem(testKey)
        return true
    } catch {
        return false
    }
}

/**
 * 高階函數，用於處理 storage 操作並提供錯誤處理
 * @param operation - 要執行的 storage 操作
 * @param fallback - 發生錯誤時返回的後備值
 * @returns 操作的結果或後備值
 *
 * @example
 * withStorageHandler(() => localStorage.getItem('key'), null)
 */
export const withStorageHandler = <T>(operation: () => T, fallback: T = null as T): T => {
    try {
        return operation()
    } catch {
        return fallback
    }
}

/**
 * 從 localStorage 獲取值
 * @param key - 要獲取的鍵名
 * @param defaultValue - 鍵不存在時返回的預設值
 * @returns 解析後的值或預設值
 *
 * @example
 * getLocalStorage('user') // { name: "John", age: 30 }
 * getLocalStorage('nonexistent', 'default') // "default"
 */
export const getLocalStorage = <T = StorageValue>(key: string, defaultValue: T = null as T): T => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('localStorage')) {
            return defaultValue
        }

        const item = localStorage.getItem(key)
        if (item === null) {
            return defaultValue
        }

        return parseStorageValue(item) as T
    }, defaultValue)
}

/**
 * 在 localStorage 中設定值
 * @param key - 要設定的鍵名
 * @param value - 要儲存的值
 * @returns 成功時返回 true，失敗時返回 false
 *
 * @example
 * setLocalStorage('user', { name: "John", age: 30 }) // true
 * setLocalStorage('settings', { theme: "dark" }) // true
 */
export const setLocalStorage = (key: string, value: StorageValue): boolean => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('localStorage')) {
            return false
        }

        localStorage.setItem(key, stringifyStorageValue(value))
        return true
    }, false)
}

/**
 * 從 localStorage 移除值
 * @param key - 要移除的鍵名
 * @returns 成功時返回 true，失敗時返回 false
 *
 * @example
 * removeLocalStorage('user') // true
 * removeLocalStorage('settings') // true
 */
export const removeLocalStorage = (key: string): boolean => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('localStorage')) {
            return false
        }

        localStorage.removeItem(key)
        return true
    }, false)
}

/**
 * 清空 localStorage 中的所有值
 * @returns 成功時返回 true，失敗時返回 false
 *
 * @example
 * clearLocalStorage() // true
 */
export const clearLocalStorage = (): boolean => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('localStorage')) {
            return false
        }

        localStorage.clear()
        return true
    }, false)
}

/**
 * 從 sessionStorage 獲取值
 * @param key - 要獲取的鍵名
 * @param defaultValue - 鍵不存在時返回的預設值
 * @returns 解析後的值或預設值
 *
 * @example
 * getSessionStorage('tempData') // { id: 123, timestamp: 1640995200000 }
 * getSessionStorage('nonexistent', []) // []
 */
export const getSessionStorage = <T = StorageValue>(
    key: string,
    defaultValue: T = null as T
): T => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('sessionStorage')) {
            return defaultValue
        }

        const item = sessionStorage.getItem(key)
        if (item === null) {
            return defaultValue
        }

        return parseStorageValue(item) as T
    }, defaultValue)
}

/**
 * 在 sessionStorage 中設定值
 * @param key - 要設定的鍵名
 * @param value - 要儲存的值
 * @returns 成功時返回 true，失敗時返回 false
 *
 * @example
 * setSessionStorage('tempData', { id: 123, timestamp: Date.now() }) // true
 * setSessionStorage('formData', { name: "John", email: "john@example.com" }) // true
 */
export const setSessionStorage = (key: string, value: StorageValue): boolean => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('sessionStorage')) {
            return false
        }

        sessionStorage.setItem(key, stringifyStorageValue(value))
        return true
    }, false)
}

/**
 * 從 sessionStorage 移除值
 * @param key - 要移除的鍵名
 * @returns 成功時返回 true，失敗時返回 false
 *
 * @example
 * removeSessionStorage('tempData') // true
 * removeSessionStorage('formData') // true
 */
export const removeSessionStorage = (key: string): boolean => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('sessionStorage')) {
            return false
        }

        sessionStorage.removeItem(key)
        return true
    }, false)
}

/**
 * 清空 sessionStorage 中的所有值
 * @returns 成功時返回 true，失敗時返回 false
 *
 * @example
 * clearSessionStorage() // true
 */
export const clearSessionStorage = (): boolean => {
    return withStorageHandler(() => {
        if (!isStorageAvailable('sessionStorage')) {
            return false
        }

        sessionStorage.clear()
        return true
    }, false)
}

/**
 * 計算 storage 的近似大小（以位元組為單位）
 * @param storageType - 要測量的 storage 類型
 * @returns 大小（位元組）
 *
 * @example
 * getStorageSize('localStorage') // 1024
 * getStorageSize('sessionStorage') // 512
 */
export const getStorageSize = (storageType: StorageType): number => {
    return withStorageHandler(() => {
        if (!isStorageAvailable(storageType)) {
            return 0
        }

        const storage = window[storageType]
        let totalSize = 0

        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i)
            if (key) {
                const value = storage.getItem(key)
                totalSize += key.length + (value?.length || 0)
            }
        }

        return totalSize
    }, 0)
}

/**
 * 用於建立 storage 相關操作的工具函數
 */

/**
 * 建立特定鍵名的 storage 獲取函數
 * @param storageType - storage 類型
 * @param key - 要獲取的鍵名
 * @param defaultValue - 預設值
 * @returns 獲取值的函數
 *
 * @example
 * const getUserSettings = createStorageGetter('localStorage', 'userSettings', {})
 * const settings = getUserSettings() // { theme: "dark", language: "en" }
 */
export const createStorageGetter =
    <T = StorageValue>(storageType: StorageType, key: string, defaultValue: T = null as T) =>
    (): T => {
        const getter = storageType === 'localStorage' ? getLocalStorage : getSessionStorage
        return getter(key, defaultValue)
    }

/**
 * 建立特定鍵名的 storage 設定函數
 * @param storageType - storage 類型
 * @param key - 要設定的鍵名
 * @returns 設定值的函數
 *
 * @example
 * const setUserSettings = createStorageSetter('localStorage', 'userSettings')
 * setUserSettings({ theme: "dark", language: "en" }) // true
 */
export const createStorageSetter =
    (storageType: StorageType, key: string) =>
    (value: StorageValue): boolean => {
        const setter = storageType === 'localStorage' ? setLocalStorage : setSessionStorage
        return setter(key, value)
    }

/**
 * 建立特定鍵名的 storage 移除函數
 * @param storageType - storage 類型
 * @param key - 要移除的鍵名
 * @returns 移除值的函數
 *
 * @example
 * const removeUserSettings = createStorageRemover('localStorage', 'userSettings')
 * removeUserSettings() // true
 */
export const createStorageRemover = (storageType: StorageType, key: string) => (): boolean => {
    const remover = storageType === 'localStorage' ? removeLocalStorage : removeSessionStorage
    return remover(key)
}

/**
 * 建立特定鍵名的完整 storage API
 * @param storageType - storage 類型
 * @param key - 要管理的鍵名
 * @param defaultValue - 獲取時的預設值
 * @returns 包含 get、set、remove 函數的物件
 *
 * @example
 * const userSettingsStorage = createStorageAPI('localStorage', 'userSettings', {})
 * userSettingsStorage.set({ theme: "dark" })
 * const settings = userSettingsStorage.get() // { theme: "dark" }
 * userSettingsStorage.remove()
 */
export const createStorageAPI = <T = StorageValue>(
    storageType: StorageType,
    key: string,
    defaultValue: T = null as T
) => ({
    get: createStorageGetter(storageType, key, defaultValue),
    set: createStorageSetter(storageType, key),
    remove: createStorageRemover(storageType, key),
})
