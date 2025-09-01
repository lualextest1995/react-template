import { AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { mapKeys, requestValidate, responseValidate } from './index'

// Mock dependencies - 需要在 vi.mock 中直接定義
vi.mock('@/utils/authQueue', () => ({
    useAuthQueueStore: {
        getState: () => ({
            handle401: vi.fn(),
        }),
    },
}))

vi.mock('@/utils/jwt', () => ({
    hasIP: vi.fn(() => true),
    isExpired: vi.fn(() => false),
    isValid: vi.fn(() => true),
    getExpiredTime: vi.fn(() => Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
}))

vi.mock('@/utils/storage', () => ({
    getLocalStorage: vi.fn(),
    removeLocalStorage: vi.fn(),
    setLocalStorage: vi.fn(),
}))

vi.mock('@/utils/cookie', () => ({
    getCookie: vi.fn(),
    setCookie: vi.fn(),
    removeCookie: vi.fn(),
}))

// Mock axios instance
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
        })),
    },
    AxiosHeaders: vi.fn().mockImplementation((headers = {}) => {
        const headersMap = new Map()
        Object.entries(headers).forEach(([key, value]) => {
            headersMap.set(key, value)
        })
        return {
            ...headers,
            set: vi.fn((key: string, value: string) => {
                headersMap.set(key, value)
                return headers
            }),
            get: vi.fn((key: string) => headersMap.get(key)),
            has: vi.fn((key: string) => headersMap.has(key)),
        }
    }),
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
})

describe('mapKeys', () => {
    const keyMap = {
        backend_key: 'frontendKey',
        snake_case: 'camelCase',
    }

    describe('backend to frontend (b2f)', () => {
        it('should map keys from backend to frontend', () => {
            const input = {
                backend_key: 'value1',
                snake_case: 'value2',
                unchanged: 'value3',
            }
            const expected = {
                frontendKey: 'value1',
                camelCase: 'value2',
                unchanged: 'value3',
            }
            expect(mapKeys(input, keyMap, 'b2f')).toEqual(expected)
        })

        it('should handle nested objects', () => {
            const input = {
                backend_key: {
                    snake_case: 'nested_value',
                },
            }
            const expected = {
                frontendKey: {
                    camelCase: 'nested_value',
                },
            }
            expect(mapKeys(input, keyMap, 'b2f')).toEqual(expected)
        })

        it('should handle arrays', () => {
            const input = [{ backend_key: 'value1' }, { snake_case: 'value2' }]
            const expected = [{ frontendKey: 'value1' }, { camelCase: 'value2' }]
            expect(mapKeys(input, keyMap, 'b2f')).toEqual(expected)
        })

        it('should handle nested arrays in objects', () => {
            const input = {
                backend_key: [{ snake_case: 'item1' }, { snake_case: 'item2' }],
            }
            const expected = {
                frontendKey: [{ camelCase: 'item1' }, { camelCase: 'item2' }],
            }
            expect(mapKeys(input, keyMap, 'b2f')).toEqual(expected)
        })
    })

    describe('frontend to backend (f2b)', () => {
        it('should map keys from frontend to backend', () => {
            const input = {
                frontendKey: 'value1',
                camelCase: 'value2',
                unchanged: 'value3',
            }
            const expected = {
                backend_key: 'value1',
                snake_case: 'value2',
                unchanged: 'value3',
            }
            expect(mapKeys(input, keyMap, 'f2b')).toEqual(expected)
        })

        it('should handle nested objects', () => {
            const input = {
                frontendKey: {
                    camelCase: 'nested_value',
                },
            }
            const expected = {
                backend_key: {
                    snake_case: 'nested_value',
                },
            }
            expect(mapKeys(input, keyMap, 'f2b')).toEqual(expected)
        })

        it('should handle complex nested structures', () => {
            const input = {
                frontendKey: {
                    nested: {
                        camelCase: 'deep_value',
                    },
                },
            }
            const expected = {
                backend_key: {
                    nested: {
                        snake_case: 'deep_value',
                    },
                },
            }
            expect(mapKeys(input, keyMap, 'f2b')).toEqual(expected)
        })
    })

    describe('edge cases', () => {
        it('should handle null and undefined', () => {
            expect(mapKeys(null, keyMap, 'b2f')).toBeNull()
            expect(mapKeys(undefined, keyMap, 'b2f')).toBeUndefined()
        })

        it('should handle primitive values', () => {
            expect(mapKeys('string', keyMap, 'b2f')).toBe('string')
            expect(mapKeys(123, keyMap, 'b2f')).toBe(123)
            expect(mapKeys(true, keyMap, 'b2f')).toBe(true)
            expect(mapKeys(false, keyMap, 'b2f')).toBe(false)
        })

        it('should handle empty objects and arrays', () => {
            expect(mapKeys({}, keyMap, 'b2f')).toEqual({})
            expect(mapKeys([], keyMap, 'b2f')).toEqual([])
        })

        it('should handle Date objects and other non-plain objects', () => {
            const date = new Date('2023-01-01')
            const result = mapKeys(date, keyMap, 'b2f')
            expect(result).toBe(date) // Should return the same object reference for non-plain objects

            // Test with RegExp
            const regex = /test/g
            expect(mapKeys(regex, keyMap, 'b2f')).toBe(regex)
        })

        it('should handle empty keyMap', () => {
            const input = { some_key: 'value' }
            expect(mapKeys(input, {}, 'b2f')).toEqual(input)
        })

        it('should handle mixed array content', () => {
            const input = [
                { backend_key: 'obj1' },
                'string_value',
                123,
                null,
                { snake_case: 'obj2' },
            ]
            const expected = [
                { frontendKey: 'obj1' },
                'string_value',
                123,
                null,
                { camelCase: 'obj2' },
            ]
            expect(mapKeys(input, keyMap, 'b2f')).toEqual(expected)
        })
    })

    describe('performance and memory', () => {
        it('should handle large objects', () => {
            const largeInput: Record<string, string> = {}
            const expectedOutput: Record<string, string> = {}

            for (let i = 0; i < 1000; i++) {
                largeInput[`backend_key_${i}`] = `value_${i}`
                expectedOutput[`backend_key_${i}`] = `value_${i}` // No mapping for these keys
            }

            largeInput.backend_key = 'mapped_value'
            expectedOutput.frontendKey = 'mapped_value'

            expect(mapKeys(largeInput, keyMap, 'b2f')).toEqual(expectedOutput)
        })

        it('should handle deeply nested objects', () => {
            const input: Record<string, unknown> = { backend_key: 'root' }
            let current = input

            // Create 10 levels of nesting
            for (let i = 0; i < 10; i++) {
                current.nested = { snake_case: `level_${i}` }
                current = current.nested as Record<string, unknown>
            }

            const result = mapKeys(input, keyMap, 'b2f')
            expect(result).toHaveProperty('frontendKey', 'root')

            // Navigate through nested structure to verify mapping
            let currentResult = result as Record<string, unknown>
            for (let i = 0; i < 10; i++) {
                expect(currentResult.nested).toHaveProperty('camelCase', `level_${i}`)
                currentResult = currentResult.nested as Record<string, unknown>
            }
        })
    })

    describe('key mapping edge cases', () => {
        it('should handle keys that exist in both directions', () => {
            const conflictKeyMap = {
                a: 'b',
                b: 'a',
            }

            const input = { a: 'value_a', b: 'value_b' }
            const b2f = mapKeys(input, conflictKeyMap, 'b2f')
            const f2b = mapKeys(b2f, conflictKeyMap, 'f2b')

            expect(b2f).toEqual({ b: 'value_a', a: 'value_b' })
            expect(f2b).toEqual(input)
        })

        it('should handle special characters in keys', () => {
            const specialKeyMap = {
                'key-with-dash': 'keyWithDash',
                'key.with.dot': 'keyWithDot',
                key_with_underscore: 'keyWithUnderscore',
            }

            const input = {
                'key-with-dash': 'value1',
                'key.with.dot': 'value2',
                key_with_underscore: 'value3',
            }

            const expected = {
                keyWithDash: 'value1',
                keyWithDot: 'value2',
                keyWithUnderscore: 'value3',
            }

            expect(mapKeys(input, specialKeyMap, 'b2f')).toEqual(expected)
        })
    })
})

describe('requestValidate', () => {
    it('should return original data when no codec', () => {
        const config = {
            data: { test: 'value' },
            url: '/test',
        }
        const result = requestValidate(config)
        expect(result).toEqual({ test: 'value' })
    })

    it('should validate and transform request data with codec', () => {
        const frontendSchema = z.object({ testKey: z.string() })
        const backendSchema = z.object({ test_key: z.string() })
        const dataKeyMap = { test_key: 'testKey' }

        const config = {
            data: { testKey: 'value' },
            url: '/test',
            codec: {
                request: {
                    frontendSchema,
                    backendSchema,
                },
                dataKeyMap,
            },
        }

        const result = requestValidate(config)
        expect(result).toEqual({ test_key: 'value' })
    })

    it('should return original data when validation fails', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
            // Mock implementation
        })

        const frontendSchema = z.object({ requiredField: z.string() })
        const backendSchema = z.object({ required_field: z.string() })

        const config = {
            data: { wrongField: 'value' },
            url: '/test',
            codec: {
                request: {
                    frontendSchema,
                    backendSchema,
                },
            },
        }

        const result = requestValidate(config)
        expect(result).toEqual({ wrongField: 'value' })
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('路徑 /test 請求資料格式錯誤'),
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })

    it('should handle empty dataKeyMap', () => {
        const frontendSchema = z.object({ testKey: z.string() })
        const backendSchema = z.object({ testKey: z.string() })

        const config = {
            data: { testKey: 'value' },
            url: '/test',
            codec: {
                request: {
                    frontendSchema,
                    backendSchema,
                },
                dataKeyMap: {},
            },
        }

        const result = requestValidate(config)
        expect(result).toEqual({ testKey: 'value' })
    })
})

describe('responseValidate', () => {
    it('should return original data when no codec', () => {
        const response = {
            data: { test: 'value' },
            config: {
                headers: new AxiosHeaders(),
            },
            status: 200,
            statusText: 'OK',
            headers: {},
        }
        const result = responseValidate(response)
        expect(result).toEqual({ test: 'value' })
    })

    it('should validate and transform response data with codec', () => {
        const frontendSchema = z.object({ testKey: z.string() })
        const backendSchema = z.object({ test_key: z.string() })
        const dataKeyMap = { test_key: 'testKey' }

        const response = {
            data: { test_key: 'value' },
            config: {
                url: '/test',
                headers: new AxiosHeaders(),
                codec: {
                    response: {
                        frontendSchema,
                        backendSchema,
                    },
                    dataKeyMap,
                },
            },
            status: 200,
            statusText: 'OK',
            headers: {},
        }

        const result = responseValidate(response)
        expect(result).toEqual({ testKey: 'value' })
    })

    it('should return original data when validation fails', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
            // Mock implementation
        })

        const frontendSchema = z.object({ requiredField: z.string() })
        const backendSchema = z.object({ required_field: z.string() })

        const response = {
            data: { wrongField: 'value' },
            config: {
                url: '/test',
                headers: new AxiosHeaders(),
                codec: {
                    response: {
                        frontendSchema,
                        backendSchema,
                    },
                },
            },
            status: 200,
            statusText: 'OK',
            headers: {},
        }

        const result = responseValidate(response)
        expect(result).toEqual({ wrongField: 'value' })
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('路徑 /test 回應資料格式錯誤 (HTTP 200)'),
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })

    it('should handle missing dataKeyMap', () => {
        const frontendSchema = z.object({ testKey: z.string() })
        const backendSchema = z.object({ testKey: z.string() })

        const response = {
            data: { testKey: 'value' },
            config: {
                url: '/test',
                headers: new AxiosHeaders(),
                codec: {
                    response: {
                        frontendSchema,
                        backendSchema,
                    },
                },
            },
            status: 200,
            statusText: 'OK',
            headers: {},
        }

        const result = responseValidate(response)
        expect(result).toEqual({ testKey: 'value' })
    })
})

// ==================== FP Style Testing ====================
// 針對 FP 改寫後的程式碼，我們主要測試純函數的特性

describe('FP Functions Properties', () => {
    describe('mapKeys function - FP properties', () => {
        const keyMap = { backend_key: 'frontendKey' }

        it('should be pure function - idempotent', () => {
            const input = { backend_key: 'value', nested: { backend_key: 'nested_value' } }

            // 多次調用應該產生相同結果
            const result1 = mapKeys(input, keyMap, 'b2f')
            const result2 = mapKeys(input, keyMap, 'b2f')
            const result3 = mapKeys(input, keyMap, 'b2f')

            expect(result1).toEqual(result2)
            expect(result2).toEqual(result3)
            expect(result1).not.toBe(result2) // 不同的物件引用
        })

        it('should be immutable - not modify input', () => {
            const input = {
                backend_key: 'value',
                nested: { backend_key: 'nested_value' },
                array: [{ backend_key: 'array_value' }],
            }
            const inputSnapshot = JSON.parse(JSON.stringify(input))

            mapKeys(input, keyMap, 'b2f')

            // 原始輸入不應該被修改
            expect(input).toEqual(inputSnapshot)
        })

        it('should be composable - b2f -> f2b should return to original', () => {
            const original = { backend_key: 'value', unchanged: 'stays' }

            const transformed = mapKeys(original, keyMap, 'b2f')
            const restored = mapKeys(transformed, keyMap, 'f2b')

            expect(restored).toEqual(original)
        })

        it('should handle complex nested transformations correctly', () => {
            const complexInput = {
                backend_key: {
                    nested_backend_key: 'deep_value',
                    array: [{ backend_key: 'item1' }, { backend_key: 'item2' }],
                },
            }

            const keyMapComplex = {
                backend_key: 'frontendKey',
                nested_backend_key: 'nestedFrontendKey',
            }

            const result = mapKeys(complexInput, keyMapComplex, 'b2f')

            expect(result).toEqual({
                frontendKey: {
                    nestedFrontendKey: 'deep_value',
                    array: [{ frontendKey: 'item1' }, { frontendKey: 'item2' }],
                },
            })
        })
    })

    describe('requestValidate function - FP properties', () => {
        it('should be pure - no side effects', () => {
            const config = {
                data: { test: 'value' },
                url: '/test',
                nested: { prop: 'unchanged' },
            }
            const configSnapshot = JSON.parse(JSON.stringify(config))

            requestValidate(config)

            expect(config).toEqual(configSnapshot)
        })

        it('should be deterministic - same input produces same output', () => {
            const config = {
                data: { test: 'value' },
                url: '/test',
            }

            const result1 = requestValidate(config)
            const result2 = requestValidate(config)

            expect(result1).toEqual(result2)
        })

        it('should handle edge cases gracefully without throwing', () => {
            const testCases = [
                { url: '/test' }, // no data
                { data: null, url: '/test' }, // null data
                { data: undefined, url: '/test' }, // undefined data
                { data: '', url: '/test' }, // empty string
                { data: 0, url: '/test' }, // falsy number
                { data: false, url: '/test' }, // boolean false
            ]

            testCases.forEach((testCase) => {
                expect(() => requestValidate(testCase)).not.toThrow()
            })
        })

        it('should maintain referential transparency with codec', () => {
            const frontendSchema = z.object({ testKey: z.string() })
            const backendSchema = z.object({ test_key: z.string() })
            const dataKeyMap = { test_key: 'testKey' }

            const config = {
                data: { testKey: 'value' },
                url: '/test',
                codec: {
                    request: { frontendSchema, backendSchema },
                    dataKeyMap,
                },
            }

            // 同樣的輸入應該產生同樣的輸出
            const result1 = requestValidate(config)
            const result2 = requestValidate(config)

            expect(result1).toEqual(result2)
            expect(result1).toEqual({ test_key: 'value' })
        })
    })

    describe('responseValidate function - FP properties', () => {
        it('should be pure - no mutation of input', () => {
            const response = {
                data: { test: 'value' },
                config: { headers: new AxiosHeaders() },
                status: 200,
                statusText: 'OK',
                headers: {},
            }
            const originalData = JSON.parse(JSON.stringify(response.data))

            responseValidate(response)

            expect(response.data).toEqual(originalData)
        })

        it('should be deterministic with validation', () => {
            const frontendSchema = z.object({ testKey: z.string() })
            const backendSchema = z.object({ test_key: z.string() })
            const dataKeyMap = { test_key: 'testKey' }

            const response = {
                data: { test_key: 'value' },
                config: {
                    headers: new AxiosHeaders(),
                    codec: {
                        response: { frontendSchema, backendSchema },
                        dataKeyMap,
                    },
                },
                status: 200,
                statusText: 'OK',
                headers: {},
            }

            const result1 = responseValidate(response)
            const result2 = responseValidate(response)

            expect(result1).toEqual(result2)
            expect(result1).toEqual({ testKey: 'value' })
        })

        it('should handle transformation pipeline correctly', () => {
            // 測試 backend -> frontend 的轉換管道
            const frontendSchema = z.object({
                userId: z.number(),
                userName: z.string(),
                isActive: z.boolean(),
            })
            const backendSchema = z.object({
                user_id: z.number(),
                user_name: z.string(),
                is_active: z.boolean(),
            })
            const dataKeyMap = {
                user_id: 'userId',
                user_name: 'userName',
                is_active: 'isActive',
            }

            const response = {
                data: {
                    user_id: 123,
                    user_name: 'john_doe',
                    is_active: true,
                },
                config: {
                    headers: new AxiosHeaders(),
                    codec: {
                        response: { frontendSchema, backendSchema },
                        dataKeyMap,
                    },
                },
                status: 200,
                statusText: 'OK',
                headers: {},
            }

            const result = responseValidate(response)

            expect(result).toEqual({
                userId: 123,
                userName: 'john_doe',
                isActive: true,
            })
        })
    })
})

describe('FP Functional Composition Tests', () => {
    describe('Pipeline behavior verification', () => {
        it('should demonstrate function composition properties', () => {
            const keyMap = { snake_case: 'camelCase', another_key: 'anotherKey' }

            // 測試函數組合: f(g(x)) 的行為
            const original = { snake_case: 'value1', another_key: 'value2' }

            // 組合1: b2f 然後 f2b (這應該回到原點)
            const pipeline1 = (data: unknown) =>
                mapKeys(mapKeys(data, keyMap, 'b2f'), keyMap, 'f2b')

            // 組合2: f2b 然後 b2f (這應該回到原點，但從前端鍵開始)
            const frontendOriginal = { camelCase: 'value1', anotherKey: 'value2' }
            const pipeline2 = (data: unknown) =>
                mapKeys(mapKeys(data, keyMap, 'f2b'), keyMap, 'b2f')

            expect(pipeline1(original)).toEqual(original)
            expect(pipeline2(frontendOriginal)).toEqual(frontendOriginal)
        })

        it('should maintain consistency across request-response cycle', () => {
            const frontendSchema = z.object({ testKey: z.string() })
            const backendSchema = z.object({ test_key: z.string() })
            const dataKeyMap = { test_key: 'testKey' }

            const requestData = { testKey: 'test_value' }

            // 模擬請求處理
            const requestConfig = {
                data: requestData,
                url: '/test',
                codec: {
                    request: { frontendSchema, backendSchema },
                    dataKeyMap,
                },
            }

            const processedRequest = requestValidate(requestConfig)

            // 模擬伺服器回應（使用處理過的請求資料）
            const mockResponse = {
                data: processedRequest,
                config: {
                    headers: new AxiosHeaders(),
                    codec: {
                        response: { frontendSchema, backendSchema },
                        dataKeyMap,
                    },
                },
                status: 200,
                statusText: 'OK',
                headers: {},
            }

            const processedResponse = responseValidate(mockResponse)

            // 驗證整個循環的一致性
            expect(processedRequest).toEqual({ test_key: 'test_value' })
            expect(processedResponse).toEqual(requestData)
        })
    })
})
