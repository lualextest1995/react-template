import Cookies from 'js-cookie'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    clearAllCookies,
    getAllCookies,
    getArrayCookie,
    getCookie,
    getCookieSize,
    getCookieWithDefault,
    getObjectCookie,
    getTotalCookieSize,
    hasCookie,
    removeCookie,
    setArrayCookie,
    setCookie,
    setCookieWithExpiry,
    setObjectCookie,
    setSecureCookie,
    setSessionCookie,
} from './index'

// Mock js-cookie
vi.mock('js-cookie', () => ({
    default: {
        set: vi.fn(),
        get: vi.fn(),
        remove: vi.fn(),
        getJSON: vi.fn(),
    },
}))

interface MockCookies {
    set: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    getJSON: ReturnType<typeof vi.fn>
}

const mockCookies = Cookies as unknown as MockCookies

describe('Cookie Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset document.cookie for each test
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: '',
        })
    })

    describe('setCookie', () => {
        it('should set a cookie with default options', () => {
            setCookie('test', 'value')
            expect(mockCookies.set).toHaveBeenCalledWith('test', 'value', {})
        })

        it('should set a cookie with custom options', () => {
            const options = { expires: 7, path: '/' }
            setCookie('test', 'value', options)
            expect(mockCookies.set).toHaveBeenCalledWith('test', 'value', options)
        })
    })

    describe('getCookie', () => {
        it('should get a cookie value', () => {
            mockCookies.get.mockReturnValue('value')
            const result = getCookie('test')
            expect(mockCookies.get).toHaveBeenCalledWith('test')
            expect(result).toBe('value')
        })

        it('should return undefined for non-existent cookie', () => {
            mockCookies.get.mockReturnValue(undefined)
            const result = getCookie('nonexistent')
            expect(result).toBeUndefined()
        })
    })

    describe('removeCookie', () => {
        it('should remove a cookie with default options', () => {
            removeCookie('test')
            expect(mockCookies.remove).toHaveBeenCalledWith('test', {})
        })

        it('should remove a cookie with custom options', () => {
            const options = { path: '/' }
            removeCookie('test', options)
            expect(mockCookies.remove).toHaveBeenCalledWith('test', options)
        })
    })

    describe('hasCookie', () => {
        it('should return true if cookie exists', () => {
            mockCookies.get.mockReturnValue('value')
            const result = hasCookie('test')
            expect(result).toBe(true)
        })

        it('should return false if cookie does not exist', () => {
            mockCookies.get.mockReturnValue(undefined)
            const result = hasCookie('test')
            expect(result).toBe(false)
        })
    })

    describe('getAllCookies', () => {
        it('should return all cookies as object', () => {
            const allCookies = { test1: 'value1', test2: 'value2' }
            mockCookies.get.mockReturnValue(allCookies)
            const result = getAllCookies()
            expect(mockCookies.get).toHaveBeenCalledWith()
            expect(result).toEqual(allCookies)
        })
    })

    describe('clearAllCookies', () => {
        it('should remove all cookies', () => {
            const allCookies = { test1: 'value1', test2: 'value2' }
            mockCookies.get.mockReturnValue(allCookies)

            clearAllCookies()

            expect(mockCookies.remove).toHaveBeenCalledWith('test1', {})
            expect(mockCookies.remove).toHaveBeenCalledWith('test2', {})
        })
    })

    describe('setCookieWithExpiry', () => {
        it('should set cookie with expiry in days', () => {
            setCookieWithExpiry('test', 'value', 7)
            expect(mockCookies.set).toHaveBeenCalledWith('test', 'value', { expires: 7 })
        })
    })

    describe('getCookieWithDefault', () => {
        it('should return cookie value if exists', () => {
            mockCookies.get.mockReturnValue('existing')
            const result = getCookieWithDefault('test', 'default')
            expect(result).toBe('existing')
        })

        it('should return default value if cookie does not exist', () => {
            mockCookies.get.mockReturnValue(undefined)
            const result = getCookieWithDefault('test', 'default')
            expect(result).toBe('default')
        })
    })

    describe('setObjectCookie', () => {
        it('should set object as JSON string', () => {
            const obj = { name: 'test', value: 123 }
            setObjectCookie('test', obj)
            expect(mockCookies.set).toHaveBeenCalledWith('test', JSON.stringify(obj), {})
        })

        it('should handle circular references gracefully', () => {
            const obj: Record<string, unknown> = { name: 'test' }
            obj.self = obj // circular reference

            setObjectCookie('test', obj)
            expect(mockCookies.set).toHaveBeenCalledWith('test', '{}', {})
        })
    })

    describe('getObjectCookie', () => {
        it('should parse JSON cookie to object', () => {
            const obj = { name: 'test', value: 123 }
            mockCookies.get.mockReturnValue(JSON.stringify(obj))

            const result = getObjectCookie('test')
            expect(result).toEqual(obj)
        })

        it('should return null for invalid JSON', () => {
            mockCookies.get.mockReturnValue('invalid json')
            const result = getObjectCookie('test')
            expect(result).toBeNull()
        })

        it('should return null for non-existent cookie', () => {
            mockCookies.get.mockReturnValue(undefined)
            const result = getObjectCookie('test')
            expect(result).toBeNull()
        })
    })

    describe('setArrayCookie', () => {
        it('should set array as JSON string', () => {
            const arr = [1, 2, 3, 'test']
            setArrayCookie('test', arr)
            expect(mockCookies.set).toHaveBeenCalledWith('test', JSON.stringify(arr), {})
        })
    })

    describe('getArrayCookie', () => {
        it('should parse JSON cookie to array', () => {
            const arr = [1, 2, 3, 'test']
            mockCookies.get.mockReturnValue(JSON.stringify(arr))

            const result = getArrayCookie('test')
            expect(result).toEqual(arr)
        })

        it('should return empty array for invalid JSON', () => {
            mockCookies.get.mockReturnValue('invalid json')
            const result = getArrayCookie('test')
            expect(result).toEqual([])
        })
    })

    describe('setSecureCookie', () => {
        it('should set secure cookie with default secure options', () => {
            setSecureCookie('test', 'value')
            expect(mockCookies.set).toHaveBeenCalledWith('test', 'value', {
                secure: true,
                sameSite: 'strict',
                path: '/',
            })
        })

        it('should merge custom options with secure defaults', () => {
            setSecureCookie('test', 'value', { expires: 7 })
            expect(mockCookies.set).toHaveBeenCalledWith('test', 'value', {
                secure: true,
                sameSite: 'strict',
                path: '/',
                expires: 7,
            })
        })
    })

    describe('setSessionCookie', () => {
        it('should set session cookie without expires', () => {
            setSessionCookie('test', 'value')
            expect(mockCookies.set).toHaveBeenCalledWith('test', 'value', {
                path: '/',
            })
        })
    })

    describe('getCookieSize', () => {
        it('should return cookie size in bytes', () => {
            mockCookies.get.mockReturnValue('test value')
            const result = getCookieSize('test')
            expect(result).toBe(10) // 'test value' is 10 bytes
        })

        it('should return 0 for non-existent cookie', () => {
            mockCookies.get.mockReturnValue(undefined)
            const result = getCookieSize('test')
            expect(result).toBe(0)
        })
    })

    describe('getTotalCookieSize', () => {
        it('should return total size of all cookies', () => {
            Object.defineProperty(document, 'cookie', {
                value: 'test1=value1; test2=value2',
                writable: true,
            })

            const result = getTotalCookieSize()
            expect(result).toBe(26) // 'test1=value1; test2=value2' is 26 bytes
        })

        it('should return 0 when no cookies exist', () => {
            Object.defineProperty(document, 'cookie', {
                value: '',
                writable: true,
            })

            const result = getTotalCookieSize()
            expect(result).toBe(0)
        })
    })
})
