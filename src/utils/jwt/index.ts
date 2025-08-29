// jwt.ts
import JWT from 'jsonwebtoken'

/**
 * JWT Token Payload 介面定義
 *
 * @interface JWTPayload
 * @property {string} [sub] - Subject (通常是使用者 ID)
 * @property {number} [exp] - 過期時間 (Unix timestamp)
 * @property {number} [iat] - 簽發時間 (Unix timestamp)
 * @property {string[]} [roles] - 使用者角色陣列
 * @property {unknown} [key] - 其他自訂欄位
 */
export interface JWTPayload {
    id: string
    ip?: string
    name?: string
    user_id?: string
    iat: number
    exp: number
}

/**
 * 解析 JWT token 並回傳 payload
 *
 * @description 使用 jsonwebtoken 函式庫解析 JWT token，回傳其中的 payload 資料
 * @param {string | null | undefined} token - 要解析的 JWT token
 * @returns {JWTPayload | null} 解析成功回傳 payload 物件，失敗回傳 null
 */
export const decode = (token: string | null | undefined): JWTPayload | null => {
    if (!token) {
        return null
    }

    try {
        const decoded = JWT.decode(token) as JWTPayload
        return decoded
    } catch {
        return null
    }
}

/**
 * 檢查 JWT token 是否為合法格式
 *
 * @description 驗證 token 是否符合 JWT 標準格式 (三個部分以 . 分隔) 且可被正確解析
 * @param {string | null | undefined} token - 要驗證的 JWT token
 * @returns {boolean} 格式正確回傳 true，否則回傳 false
 */
export const isValid = (token: string | null | undefined): boolean => {
    if (!token || typeof token !== 'string') {
        return false
    }

    try {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return false
        }

        // Try to decode to verify format
        const decoded = JWT.decode(token)
        return decoded !== null
    } catch {
        return false
    }
}

/**
 * 檢查 JWT token 是否已過期
 *
 * @description 比較 token 中的 exp (過期時間) 與當前時間，判斷是否已過期
 * @param {string | null | undefined} token - 要檢查的 JWT token
 * @returns {boolean} 已過期或無效 token 回傳 true，有效回傳 false
 */
export const isExpired = (token: string | null | undefined): boolean => {
    const payload = decode(token)
    if (!payload || !payload.exp) {
        return true
    }

    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
}

/**
 * 取得 JWT token 的剩餘有效時間 (秒)
 *
 * @description 計算 token 的 exp 時間與當前時間的差值，回傳剩餘秒數
 * @param {string | null | undefined} token - 要檢查的 JWT token
 * @returns {number} 剩餘秒數，若已過期或無效則回傳 0
 */
export const getRemainingTime = (token: string | null | undefined): number => {
    const payload = decode(token)
    if (!payload || !payload.exp) {
        return 0
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const remaining = payload.exp - currentTime
    return Math.max(0, remaining)
}

/**
 * 從 JWT token 取得使用者 ID
 *
 * @description 解析 token 並取得其中的 user_id (subject) 欄位，通常代表使用者 ID
 * @param {string | null | undefined} token - 要解析的 JWT token
 * @returns {string | null} 使用者 ID 字串或 null
 */
export const getUserId = (token: string | null | undefined): string | null => {
    const payload = decode(token)
    return payload?.user_id || null
}

/**
 * 判斷 JWT token 是否需要刷新
 *
 * @description 檢查 token 是否即將在指定時間內過期，用於決定是否需要刷新 token
 * @param {string | null | undefined} token - 要檢查的 JWT token
 * @param {number} [bufferTimeMinutes=5] - 緩衝時間 (分鐘)，預設 5 分鐘
 * @returns {boolean} 需要刷新回傳 true，否則回傳 false
 */
export const shouldRefresh = (
    token: string | null | undefined,
    bufferTimeMinutes: number = 5
): boolean => {
    if (!isValid(token)) {
        return true
    }

    const remainingTime = getRemainingTime(token)
    const bufferTimeSeconds = bufferTimeMinutes * 60

    return remainingTime <= bufferTimeSeconds
}

/**
 * 檢查 JWT token 是否有 IP 欄位
 * @param token - 要檢查的 JWT token
 * @returns {boolean} 如果有 IP 欄位則回傳 true，否則回傳 false
 */
export const hasIP = (token: string | null | undefined): boolean => {
    const payload = decode(token)
    return !!payload?.ip
}
