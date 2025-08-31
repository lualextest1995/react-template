import { describe, expect, it, vi } from 'vitest'
import { mapKeys } from './index'

// Mock dependencies
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
}))

vi.mock('@/utils/storage', () => ({
    getLocalStorage: vi.fn(() => null),
    removeLocalStorage: vi.fn(),
    setLocalStorage: vi.fn(),
}))

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
