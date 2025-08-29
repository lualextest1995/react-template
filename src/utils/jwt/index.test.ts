import JWT from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    decode,
    getRemainingTime,
    getUserId,
    hasIP,
    isExpired,
    isValid,
    type JWTPayload,
    shouldRefresh,
} from './index'

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: {
        decode: vi.fn(),
    },
}))

describe('JWT Utils', () => {
    const mockJWT = vi.mocked(JWT)

    // Test data
    const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJfaWQiOiJ1c2VyMTIzIiwibmFtZSI6IkpvaG4gRG9lIiwiaXAiOiIxOTIuMTY4LjEuMSIsImlhdCI6MTYzNDU2NzA0MCwiZXhwIjoxNjM0NTcwNjQwfQ.signature'

    const mockPayload: JWTPayload = {
        id: '123',
        user_id: 'user123',
        name: 'John Doe',
        ip: '192.168.1.1',
        iat: 1634567040, // 過去時間
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 小時後過期
    }

    const expiredPayload: JWTPayload = {
        id: '123',
        user_id: 'user123',
        name: 'John Doe',
        iat: 1634567040,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 小時前已過期
    }

    const payloadWithoutIP: JWTPayload = {
        id: '123',
        user_id: 'user123',
        name: 'John Doe',
        iat: 1634567040,
        exp: Math.floor(Date.now() / 1000) + 3600,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('decode', () => {
        it('should decode valid token successfully', () => {
            mockJWT.decode.mockReturnValue(mockPayload)

            const result = decode(validToken)

            expect(mockJWT.decode).toHaveBeenCalledWith(validToken)
            expect(result).toEqual(mockPayload)
        })

        it('should return null for null token', () => {
            const result = decode(null)

            expect(result).toBeNull()
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return null for undefined token', () => {
            const result = decode(undefined)

            expect(result).toBeNull()
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return null for empty string token', () => {
            const result = decode('')

            expect(result).toBeNull()
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return null when JWT.decode throws error', () => {
            mockJWT.decode.mockImplementation(() => {
                throw new Error('Invalid token')
            })

            const result = decode(validToken)

            expect(result).toBeNull()
        })
    })

    describe('isValid', () => {
        it('should return true for valid token format', () => {
            mockJWT.decode.mockReturnValue(mockPayload)

            const result = isValid(validToken)

            expect(result).toBe(true)
        })

        it('should return false for null token', () => {
            const result = isValid(null)

            expect(result).toBe(false)
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return false for undefined token', () => {
            const result = isValid(undefined)

            expect(result).toBe(false)
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return false for non-string token', () => {
            const result = isValid(123 as unknown as string)

            expect(result).toBe(false)
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return false for token without 3 parts', () => {
            const invalidToken = 'invalid.token'

            const result = isValid(invalidToken)

            expect(result).toBe(false)
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return false for token with too many parts', () => {
            const invalidToken = 'part1.part2.part3.part4'

            const result = isValid(invalidToken)

            expect(result).toBe(false)
            expect(mockJWT.decode).not.toHaveBeenCalled()
        })

        it('should return false when JWT.decode returns null', () => {
            mockJWT.decode.mockReturnValue(null)

            const result = isValid(validToken)

            expect(result).toBe(false)
        })

        it('should return false when JWT.decode throws error', () => {
            mockJWT.decode.mockImplementation(() => {
                throw new Error('Invalid token')
            })

            const result = isValid(validToken)

            expect(result).toBe(false)
        })
    })

    describe('isExpired', () => {
        it('should return false for valid non-expired token', () => {
            mockJWT.decode.mockReturnValue(mockPayload)

            const result = isExpired(validToken)

            expect(result).toBe(false)
        })

        it('should return true for expired token', () => {
            mockJWT.decode.mockReturnValue(expiredPayload)

            const result = isExpired(validToken)

            expect(result).toBe(true)
        })

        it('should return true for invalid token', () => {
            mockJWT.decode.mockReturnValue(null)

            const result = isExpired('invalid-token')

            expect(result).toBe(true)
        })

        it('should return true for token without exp field', () => {
            const payloadWithoutExp: Partial<JWTPayload> = {
                id: mockPayload.id,
                user_id: mockPayload.user_id,
                name: mockPayload.name,
                ip: mockPayload.ip,
                iat: mockPayload.iat,
                // exp 欄位被省略
            }
            mockJWT.decode.mockReturnValue(payloadWithoutExp as JWTPayload)

            const result = isExpired(validToken)

            expect(result).toBe(true)
        })

        it('should return true for null token', () => {
            const result = isExpired(null)

            expect(result).toBe(true)
        })

        it('should return true for undefined token', () => {
            const result = isExpired(undefined)

            expect(result).toBe(true)
        })
    })

    describe('getRemainingTime', () => {
        it('should return correct remaining time for valid token', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 1800 // 30 分鐘後
            const payload = { ...mockPayload, exp: futureExp }
            mockJWT.decode.mockReturnValue(payload)

            const result = getRemainingTime(validToken)

            expect(result).toBeGreaterThan(1790) // 約 30 分鐘，允許一些時間誤差
            expect(result).toBeLessThanOrEqual(1800)
        })

        it('should return 0 for expired token', () => {
            mockJWT.decode.mockReturnValue(expiredPayload)

            const result = getRemainingTime(validToken)

            expect(result).toBe(0)
        })

        it('should return 0 for invalid token', () => {
            mockJWT.decode.mockReturnValue(null)

            const result = getRemainingTime('invalid-token')

            expect(result).toBe(0)
        })

        it('should return 0 for token without exp field', () => {
            const payloadWithoutExp: Partial<JWTPayload> = {
                id: mockPayload.id,
                user_id: mockPayload.user_id,
                name: mockPayload.name,
                ip: mockPayload.ip,
                iat: mockPayload.iat,
                // exp 欄位被省略
            }
            mockJWT.decode.mockReturnValue(payloadWithoutExp as JWTPayload)

            const result = getRemainingTime(validToken)

            expect(result).toBe(0)
        })

        it('should return 0 for null token', () => {
            const result = getRemainingTime(null)

            expect(result).toBe(0)
        })
    })

    describe('getUserId', () => {
        it('should return user_id from valid token', () => {
            mockJWT.decode.mockReturnValue(mockPayload)

            const result = getUserId(validToken)

            expect(result).toBe('user123')
        })

        it('should return null for token without user_id', () => {
            const payloadWithoutUserId: Partial<JWTPayload> = {
                id: mockPayload.id,
                name: mockPayload.name,
                ip: mockPayload.ip,
                iat: mockPayload.iat,
                exp: mockPayload.exp,
                // user_id 欄位被省略
            }
            mockJWT.decode.mockReturnValue(payloadWithoutUserId as JWTPayload)

            const result = getUserId(validToken)

            expect(result).toBeNull()
        })

        it('should return null for invalid token', () => {
            mockJWT.decode.mockReturnValue(null)

            const result = getUserId('invalid-token')

            expect(result).toBeNull()
        })

        it('should return null for null token', () => {
            const result = getUserId(null)

            expect(result).toBeNull()
        })

        it('should return null for undefined token', () => {
            const result = getUserId(undefined)

            expect(result).toBeNull()
        })
    })

    describe('shouldRefresh', () => {
        it('should return false for token with enough remaining time', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 1800 // 30 分鐘後
            const payload = { ...mockPayload, exp: futureExp }
            mockJWT.decode.mockReturnValue(payload)

            const result = shouldRefresh(validToken, 5) // 5 分鐘緩衝時間

            expect(result).toBe(false)
        })

        it('should return true for token that needs refresh soon', () => {
            const soonExp = Math.floor(Date.now() / 1000) + 240 // 4 分鐘後
            const payload = { ...mockPayload, exp: soonExp }
            mockJWT.decode.mockReturnValue(payload)

            const result = shouldRefresh(validToken, 5) // 5 分鐘緩衝時間

            expect(result).toBe(true)
        })

        it('should return true for invalid token', () => {
            mockJWT.decode.mockReturnValue(null)

            const result = shouldRefresh('invalid-token')

            expect(result).toBe(true)
        })

        it('should return true for expired token', () => {
            mockJWT.decode.mockReturnValue(expiredPayload)

            const result = shouldRefresh(validToken)

            expect(result).toBe(true)
        })

        it('should use default buffer time of 5 minutes', () => {
            const closeExp = Math.floor(Date.now() / 1000) + 240 // 4 分鐘後
            const payload = { ...mockPayload, exp: closeExp }
            mockJWT.decode.mockReturnValue(payload)

            const result = shouldRefresh(validToken) // 不指定緩衝時間，應使用預設 5 分鐘

            expect(result).toBe(true)
        })
    })

    describe('hasIP', () => {
        it('should return true for token with IP field', () => {
            mockJWT.decode.mockReturnValue(mockPayload)

            const result = hasIP(validToken)

            expect(result).toBe(true)
        })

        it('should return false for token without IP field', () => {
            mockJWT.decode.mockReturnValue(payloadWithoutIP)

            const result = hasIP(validToken)

            expect(result).toBe(false)
        })

        it('should return false for token with empty IP field', () => {
            const payloadWithEmptyIP = { ...mockPayload, ip: '' }
            mockJWT.decode.mockReturnValue(payloadWithEmptyIP)

            const result = hasIP(validToken)

            expect(result).toBe(false)
        })

        it('should return false for invalid token', () => {
            mockJWT.decode.mockReturnValue(null)

            const result = hasIP('invalid-token')

            expect(result).toBe(false)
        })

        it('should return false for null token', () => {
            const result = hasIP(null)

            expect(result).toBe(false)
        })

        it('should return false for undefined token', () => {
            const result = hasIP(undefined)

            expect(result).toBe(false)
        })
    })

    describe('Integration Tests', () => {
        it('should handle complete JWT workflow', () => {
            // 測試完整的 JWT 處理流程
            mockJWT.decode.mockReturnValue(mockPayload)

            // 驗證 token 有效性
            expect(isValid(validToken)).toBe(true)

            // 檢查是否過期
            expect(isExpired(validToken)).toBe(false)

            // 取得使用者 ID
            expect(getUserId(validToken)).toBe('user123')

            // 檢查剩餘時間
            expect(getRemainingTime(validToken)).toBeGreaterThan(0)

            // 檢查是否有 IP
            expect(hasIP(validToken)).toBe(true)

            // 檢查是否需要刷新
            expect(shouldRefresh(validToken)).toBe(false)
        })

        it('should handle invalid token workflow', () => {
            const invalidToken = 'invalid.token.format'

            // 模擬 JWT.decode 對無效 token 返回 null
            mockJWT.decode.mockReturnValue(null)

            // 無效 token 的所有檢查都應該返回安全的預設值
            expect(isValid(invalidToken)).toBe(false)
            expect(isExpired(invalidToken)).toBe(true)
            expect(getUserId(invalidToken)).toBeNull()
            expect(getRemainingTime(invalidToken)).toBe(0)
            expect(hasIP(invalidToken)).toBe(false)
            expect(shouldRefresh(invalidToken)).toBe(true)
        })
    })
})
