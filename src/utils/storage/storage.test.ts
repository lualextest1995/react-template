import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage,
  clearSessionStorage,
  getStorageSize,
  isStorageAvailable,
  withStorageHandler,
  parseStorageValue,
  stringifyStorageValue,
  createStorageGetter,
  createStorageSetter,
  createStorageRemover,
  createStorageAPI
} from './index'

// Mock localStorage and sessionStorage
const createMockStorage = () => {
  const storage: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    get length() {
      return Object.keys(storage).length
    },
    key: vi.fn((index: number) => Object.keys(storage)[index] || null)
  }
}

let mockLocalStorage: ReturnType<typeof createMockStorage>
let mockSessionStorage: ReturnType<typeof createMockStorage>

beforeEach(() => {
  vi.clearAllMocks()
  mockLocalStorage = createMockStorage()
  mockSessionStorage = createMockStorage()
  
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true
  })
})

describe('parseStorageValue', () => {
  it('should parse valid JSON strings', () => {
    expect(parseStorageValue('{"name":"test"}')).toEqual({ name: 'test' })
    expect(parseStorageValue('[1,2,3]')).toEqual([1, 2, 3])
    expect(parseStorageValue('true')).toBe(true)
    expect(parseStorageValue('null')).toBe(null)
    expect(parseStorageValue('123')).toBe(123)
  })

  it('should return original string for invalid JSON', () => {
    expect(parseStorageValue('invalid json')).toBe('invalid json')
    expect(parseStorageValue('undefined')).toBe('undefined')
    expect(parseStorageValue('')).toBe('')
  })
})

describe('stringifyStorageValue', () => {
  it('should stringify values to JSON', () => {
    expect(stringifyStorageValue({ name: 'test' })).toBe('{"name":"test"}')
    expect(stringifyStorageValue([1, 2, 3])).toBe('[1,2,3]')
    expect(stringifyStorageValue(true)).toBe('true')
    expect(stringifyStorageValue(null)).toBe('null')
    expect(stringifyStorageValue(123)).toBe('123')
    expect(stringifyStorageValue('string')).toBe('"string"')
  })

  it('should handle undefined values', () => {
    expect(stringifyStorageValue(undefined)).toBe('null')
  })
})

describe('isStorageAvailable', () => {
  it('should return true when storage is available', () => {
    expect(isStorageAvailable('localStorage')).toBe(true)
    expect(isStorageAvailable('sessionStorage')).toBe(true)
  })

  it('should return false when storage is not available', () => {
    const originalLocalStorage = window.localStorage
    // @ts-ignore
    delete window.localStorage
    expect(isStorageAvailable('localStorage')).toBe(false)
    
    // Restore localStorage for other tests
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true
    })
  })
})

describe('localStorage utilities', () => {
  describe('getLocalStorage', () => {
    it('should return parsed value when key exists', () => {
      mockLocalStorage.getItem.mockReturnValue('{"name":"test"}')
      const result = getLocalStorage('testKey')
      expect(result).toEqual({ name: 'test' })
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey')
    })

    it('should return default value when key does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const result = getLocalStorage('nonExistentKey', 'default')
      expect(result).toBe('default')
    })

    it('should return null when key does not exist and no default provided', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const result = getLocalStorage('nonExistentKey')
      expect(result).toBe(null)
    })

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      const result = getLocalStorage('errorKey', 'fallback')
      expect(result).toBe('fallback')
    })
  })

  describe('setLocalStorage', () => {
    it('should store stringified value', () => {
      const testData = { name: 'test', age: 25 }
      const result = setLocalStorage('testKey', testData)
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', '{"name":"test","age":25}')
    })

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      const result = setLocalStorage('errorKey', 'value')
      expect(result).toBe(false)
    })
  })

  describe('removeLocalStorage', () => {
    it('should remove item from storage', () => {
      const result = removeLocalStorage('testKey')
      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey')
    })

    it('should handle removal errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Removal error')
      })
      const result = removeLocalStorage('errorKey')
      expect(result).toBe(false)
    })
  })

  describe('clearLocalStorage', () => {
    it('should clear all items from localStorage', () => {
      const result = clearLocalStorage()
      expect(result).toBe(true)
      expect(mockLocalStorage.clear).toHaveBeenCalled()
    })

    it('should handle clear errors gracefully', () => {
      mockLocalStorage.clear.mockImplementation(() => {
        throw new Error('Clear error')
      })
      const result = clearLocalStorage()
      expect(result).toBe(false)
    })
  })
})

describe('sessionStorage utilities', () => {
  describe('getSessionStorage', () => {
    it('should return parsed value when key exists', () => {
      mockSessionStorage.getItem.mockReturnValue('[1,2,3]')
      const result = getSessionStorage('testKey')
      expect(result).toEqual([1, 2, 3])
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('testKey')
    })

    it('should return default value when key does not exist', () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      const result = getSessionStorage('nonExistentKey', [])
      expect(result).toEqual([])
    })
  })

  describe('setSessionStorage', () => {
    it('should store stringified value', () => {
      const testData = [1, 2, 3]
      const result = setSessionStorage('testKey', testData)
      
      expect(result).toBe(true)
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('testKey', '[1,2,3]')
    })
  })

  describe('removeSessionStorage', () => {
    it('should remove item from sessionStorage', () => {
      const result = removeSessionStorage('testKey')
      expect(result).toBe(true)
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('testKey')
    })
  })

  describe('clearSessionStorage', () => {
    it('should clear all items from sessionStorage', () => {
      const result = clearSessionStorage()
      expect(result).toBe(true)
      expect(mockSessionStorage.clear).toHaveBeenCalled()
    })
  })
})

describe('getStorageSize', () => {
  it('should calculate localStorage size in bytes', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      const data: Record<string, string> = {
        'key1': '"value1"', // JSON stringified value
        'key2': '"value2"'  // JSON stringified value
      }
      return data[key] || null
    })
    mockLocalStorage.key.mockImplementation((index) => ['key1', 'key2'][index])
    Object.defineProperty(mockLocalStorage, 'length', { value: 2 })

    const size = getStorageSize('localStorage')
    // 'key1' (4) + '"value1"' (8) + 'key2' (4) + '"value2"' (8) = 24 bytes
    expect(size).toBe(24)
  })

  it('should return 0 for empty storage', () => {
    Object.defineProperty(mockLocalStorage, 'length', { value: 0 })
    const size = getStorageSize('localStorage')
    expect(size).toBe(0)
  })
})

describe('withStorageHandler', () => {
  it('should execute operation and return result', () => {
    const operation = vi.fn().mockReturnValue('success')
    const result = withStorageHandler(operation, 'fallback')
    
    expect(operation).toHaveBeenCalled()
    expect(result).toBe('success')
  })

  it('should return fallback value on error', () => {
    const operation = vi.fn().mockImplementation(() => {
      throw new Error('Operation failed')
    })
    const result = withStorageHandler(operation, 'fallback')
    
    expect(result).toBe('fallback')
  })

  it('should use default fallback when none provided', () => {
    const operation = vi.fn().mockImplementation(() => {
      throw new Error('Operation failed')
    })
    const result = withStorageHandler(operation)
    
    expect(result).toBe(null)
  })
})

describe('函數式程式設計 Storage 工具', () => {
  describe('createStorageGetter', () => {
    it('should create a localStorage getter function', () => {
      mockLocalStorage.getItem.mockReturnValue('{"name":"test"}')
      
      const getUser = createStorageGetter('localStorage', 'user', {})
      const result = getUser()
      
      expect(result).toEqual({ name: 'test' })
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user')
    })

    it('should create a sessionStorage getter function', () => {
      mockSessionStorage.getItem.mockReturnValue('[1,2,3]')
      
      const getData = createStorageGetter('sessionStorage', 'data', [])
      const result = getData()
      
      expect(result).toEqual([1, 2, 3])
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('data')
    })

    it('should return default value when key does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const getSettings = createStorageGetter('localStorage', 'settings', { theme: 'light' })
      const result = getSettings()
      
      expect(result).toEqual({ theme: 'light' })
    })
  })

  describe('createStorageSetter', () => {
    it('should create a localStorage setter function', () => {
      const setUser = createStorageSetter('localStorage', 'user')
      const result = setUser({ name: 'John', age: 30 })
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', '{"name":"John","age":30}')
    })

    it('should create a sessionStorage setter function', () => {
      const setData = createStorageSetter('sessionStorage', 'data')
      const result = setData([1, 2, 3, 4])
      
      expect(result).toBe(true)
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('data', '[1,2,3,4]')
    })
  })

  describe('createStorageRemover', () => {
    it('should create a localStorage remover function', () => {
      const removeUser = createStorageRemover('localStorage', 'user')
      const result = removeUser()
      
      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('should create a sessionStorage remover function', () => {
      const removeData = createStorageRemover('sessionStorage', 'data')
      const result = removeData()
      
      expect(result).toBe(true)
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('data')
    })
  })

  describe('createStorageAPI', () => {
    it('should create a complete localStorage API', () => {
      mockLocalStorage.getItem.mockReturnValue('{"theme":"dark","language":"en"}')
      
      const userSettingsAPI = createStorageAPI('localStorage', 'userSettings', {})
      
      // Test getter
      const settings = userSettingsAPI.get()
      expect(settings).toEqual({ theme: 'dark', language: 'en' })
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('userSettings')
      
      // Test setter
      const setResult = userSettingsAPI.set({ theme: 'light', language: 'zh' })
      expect(setResult).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userSettings', '{"theme":"light","language":"zh"}')
      
      // Test remover
      const removeResult = userSettingsAPI.remove()
      expect(removeResult).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userSettings')
    })

    it('should create a complete sessionStorage API', () => {
      mockSessionStorage.getItem.mockReturnValue('["item1","item2","item3"]')
      
      const cartAPI = createStorageAPI('sessionStorage', 'cart', [])
      
      // Test getter
      const cart = cartAPI.get()
      expect(cart).toEqual(['item1', 'item2', 'item3'])
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('cart')
      
      // Test setter
      const setResult = cartAPI.set(['item1', 'item2', 'item3', 'item4'])
      expect(setResult).toBe(true)
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('cart', '["item1","item2","item3","item4"]')
      
      // Test remover
      const removeResult = cartAPI.remove()
      expect(removeResult).toBe(true)
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('cart')
    })

    it('should handle errors gracefully in API functions', () => {
      // Mock error in localStorage
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const errorAPI = createStorageAPI('localStorage', 'errorKey', { default: true })
      
      // Should return default value on get error
      expect(errorAPI.get()).toEqual({ default: true })
      
      // Should return false on set error
      expect(errorAPI.set({ test: 'value' })).toBe(false)
      
      // Should return false on remove error
      expect(errorAPI.remove()).toBe(false)
    })
  })

  describe('函數式組合範例', () => {
    it('should allow functional composition of storage operations', () => {
      const getUserSettings = createStorageGetter('localStorage', 'userSettings', { theme: 'light' })
      const setUserSettings = createStorageSetter('localStorage', 'userSettings')
      
      // Simulate getting current settings
      mockLocalStorage.getItem.mockReturnValue('{"theme":"dark","notifications":true}')
      
      // Update theme while preserving other settings
      const updateTheme = (theme: string) => {
        const settings = getUserSettings()
        return setUserSettings({ ...settings, theme })
      }
      
      const result = updateTheme('light')
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'userSettings', 
        '{"theme":"light","notifications":true}'
      )
    })

    it('should support chaining storage operations', () => {
      const api = createStorageAPI('localStorage', 'testKey', null)
      
      // Chain operations: set -> get -> remove
      const testValue = { id: 1, name: 'test' }
      
      api.set(testValue)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', '{"id":1,"name":"test"}')
      
      mockLocalStorage.getItem.mockReturnValue('{"id":1,"name":"test"}')
      const retrieved = api.get()
      expect(retrieved).toEqual(testValue)
      
      api.remove()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey')
    })
  })
})
