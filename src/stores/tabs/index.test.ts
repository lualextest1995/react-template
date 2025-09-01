import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock keepAlive store
const mockKeepAliveStore = {
    remove: vi.fn(),
    clear: vi.fn(),
}

vi.mock('../keepAlive', () => ({
    useKeepAliveStore: {
        getState: () => mockKeepAliveStore,
    },
}))

// Mock console.log for cleaner test output
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
    // no-op
})

// 動態導入 store 以確保 mock 生效
const { useTabsStore } = await import('./index')

describe('useTabsStore', () => {
    beforeEach(() => {
        // 重置所有 mocks
        vi.clearAllMocks()

        // 重置 store 狀態
        useTabsStore.setState({
            tabs: [],
            activeId: null,
            lastPathMap: {},
            pendingNavigation: null,
        })
    })

    afterEach(() => {
        consoleSpy.mockClear()
    })

    describe('基本操作', () => {
        it('應該能創建新的 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({
                routeId: 'home',
                title: '首頁',
                path: '/home',
                closable: true,
            })

            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(1)
            expect(state.tabs[0]).toEqual({
                id: 'home',
                title: '首頁',
                path: '/home',
                lastPath: '/home',
                closable: true,
            })
            expect(state.activeId).toBe('home')
            expect(state.lastPathMap).toEqual({ home: '/home' })
        })

        it('應該能更新現有 tab 的路徑', () => {
            const store = useTabsStore.getState()

            // 先創建一個 tab
            store.openByRoute({
                routeId: 'users',
                title: '用戶管理',
                path: '/users',
            })

            // 更新路徑
            store.openByRoute({
                routeId: 'users',
                title: '用戶管理',
                path: '/users?page=2',
            })

            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(1)
            expect(state.tabs[0].path).toBe('/users?page=2')
            expect(state.tabs[0].lastPath).toBe('/users?page=2')
            expect(state.lastPathMap.users).toBe('/users?page=2')
        })

        it('應該能激活指定的 tab', () => {
            const store = useTabsStore.getState()

            // 創建多個 tabs
            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            // 激活第一個 tab
            store.activate('home')

            const state = useTabsStore.getState()
            expect(state.activeId).toBe('home')
        })

        it('應該能重命名 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.rename('home', '主頁')

            const state = useTabsStore.getState()
            expect(state.tabs[0].title).toBe('主頁')
        })

        it('應該能更新 tab 路徑', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })
            store.updateTabPath('users', '/users?filter=active')

            const state = useTabsStore.getState()
            expect(state.tabs[0].path).toBe('/users?filter=active')
            expect(state.tabs[0].lastPath).toBe('/users?filter=active')
            expect(state.lastPathMap.users).toBe('/users?filter=active')
        })
    })

    describe('關閉操作', () => {
        it('應該能關閉指定的 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            store.close('home')

            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(1)
            expect(state.tabs[0].id).toBe('users')
            expect(state.activeId).toBe('users')
            expect(mockKeepAliveStore.remove).toHaveBeenCalledWith('home')
        })

        it('關閉當前活躍 tab 時應該激活左邊的 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })
            store.openByRoute({ routeId: 'settings', title: '設定', path: '/settings' })

            // 激活中間的 tab
            store.activate('users')

            // 關閉中間的 tab
            store.close('users')

            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(2)
            expect(state.activeId).toBe('home') // 應該激活左邊的 tab
        })

        it('關閉當前活躍 tab 且右邊沒有 tab 時應該激活左邊的 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            // 關閉最後一個 tab
            store.close('users')

            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(1)
            expect(state.activeId).toBe('home') // 應該激活左邊的 tab
        })

        it('應該能關閉所有 tabs', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            store.closeAll()

            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(0)
            expect(state.activeId).toBeNull()
            expect(state.lastPathMap).toEqual({})
            expect(mockKeepAliveStore.clear).toHaveBeenCalled()
        })

        it('應該能關閉其他所有 tabs', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })
            store.openByRoute({ routeId: 'settings', title: '設定', path: '/settings' })

            store.closeOthers('users')

            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(1)
            expect(state.tabs[0].id).toBe('users')
            expect(state.activeId).toBe('users')
            expect(mockKeepAliveStore.remove).toHaveBeenCalledWith('home')
            expect(mockKeepAliveStore.remove).toHaveBeenCalledWith('settings')
        })
    })

    describe('handleRouteRemoved', () => {
        it('當沒有對應的 tab 時應該返回 false', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })

            const result = store.handleRouteRemoved('nonexistent')

            expect(result).toBe(false)
            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(1) // tab 數量不變
        })

        it('移除非活躍 tab 時應該返回 false 且不需要導航', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            // 激活 home
            store.activate('home')

            const result = store.handleRouteRemoved('users')

            expect(result).toBe(false)
            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(1)
            expect(state.tabs[0].id).toBe('home')
            expect(state.activeId).toBe('home') // 活躍 tab 不變
            expect(state.pendingNavigation).toBeNull()
        })

        it('移除當前活躍 tab 且有其他 tabs 時應該返回 true 並設置導航', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })
            store.openByRoute({ routeId: 'settings', title: '設定', path: '/settings' })

            // 激活中間的 tab
            store.activate('users')

            const result = store.handleRouteRemoved('users')

            expect(result).toBe(true)
            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(2)
            expect(state.activeId).toBe('home') // 應該激活左邊的 tab（優先策略）
            expect(state.pendingNavigation).toBe('/home')
        })

        it('移除當前活躍 tab 且優先激活右邊的 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })
            store.openByRoute({ routeId: 'settings', title: '設定', path: '/settings' })

            // 激活第一個 tab
            store.activate('home')

            const result = store.handleRouteRemoved('home')

            expect(result).toBe(true)
            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(2)
            expect(state.activeId).toBe('users') // 左邊沒有則激活右邊的 tab
            expect(state.pendingNavigation).toBe('/users')
        })

        it('移除當前活躍 tab 且沒有其他 tabs 時應該導航到根路徑', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })

            const result = store.handleRouteRemoved('home')

            expect(result).toBe(true)
            const state = useTabsStore.getState()
            expect(state.tabs).toHaveLength(0)
            expect(state.activeId).toBeNull()
            expect(state.pendingNavigation).toBe('/')
        })

        it('應該使用 lastPathMap 中的路徑進行導航', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            // 更新 users 的路徑
            store.updateTabPath('users', '/users?page=2')

            // 激活 home 然後移除它
            store.activate('home')

            const result = store.handleRouteRemoved('home')

            expect(result).toBe(true)
            const state = useTabsStore.getState()
            expect(state.activeId).toBe('users')
            expect(state.pendingNavigation).toBe('/users?page=2') // 應該使用 lastPathMap 中的路徑
        })
    })

    describe('重新排序', () => {
        it('應該能重新排序 tabs', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })
            store.openByRoute({ routeId: 'settings', title: '設定', path: '/settings' })

            // 將第一個 tab 移到最後
            store.reorderTabs(0, 2)

            const state = useTabsStore.getState()
            expect(state.tabs.map((tab) => tab.id)).toEqual(['users', 'settings', 'home'])
        })
    })

    describe('Getters', () => {
        it('getActiveTab 應該返回當前活躍的 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            store.activate('users')

            const activeTab = store.getActiveTab()
            expect(activeTab?.id).toBe('users')
            expect(activeTab?.title).toBe('用戶')
        })

        it('getActiveTab 在沒有活躍 tab 時應該返回 null', () => {
            const store = useTabsStore.getState()

            const activeTab = store.getActiveTab()
            expect(activeTab).toBeNull()
        })

        it('getTabById 應該返回指定的 tab', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            store.openByRoute({ routeId: 'users', title: '用戶', path: '/users' })

            const tab = store.getTabById('users')
            expect(tab?.id).toBe('users')
            expect(tab?.title).toBe('用戶')
        })

        it('getTabById 在找不到 tab 時應該返回 null', () => {
            const store = useTabsStore.getState()

            const tab = store.getTabById('nonexistent')
            expect(tab).toBeNull()
        })
    })

    describe('待導航狀態', () => {
        it('應該能設置和清除待導航路徑', () => {
            const store = useTabsStore.getState()

            store.setPendingNavigation('/test-path')
            expect(useTabsStore.getState().pendingNavigation).toBe('/test-path')

            store.setPendingNavigation(null)
            expect(useTabsStore.getState().pendingNavigation).toBeNull()
        })
    })

    describe('邊界情況', () => {
        it('激活不存在的 tab 時應該不改變狀態', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            const originalState = useTabsStore.getState()

            store.activate('nonexistent')

            const newState = useTabsStore.getState()
            expect(newState.activeId).toBe(originalState.activeId)
        })

        it('關閉不存在的 tab 時應該不改變狀態', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            const originalState = useTabsStore.getState()

            store.close('nonexistent')

            const newState = useTabsStore.getState()
            expect(newState.tabs).toHaveLength(originalState.tabs.length)
        })

        it('關閉其他 tabs 但目標 tab 不存在時應該不改變狀態', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            const originalState = useTabsStore.getState()

            store.closeOthers('nonexistent')

            const newState = useTabsStore.getState()
            expect(newState.tabs).toHaveLength(originalState.tabs.length)
        })

        it('重命名不存在的 tab 時應該不改變狀態', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            const originalState = useTabsStore.getState()

            store.rename('nonexistent', 'New Title')

            const newState = useTabsStore.getState()
            expect(newState.tabs[0].title).toBe(originalState.tabs[0].title)
        })

        it('更新不存在的 tab 路徑時應該不改變狀態', () => {
            const store = useTabsStore.getState()

            store.openByRoute({ routeId: 'home', title: '首頁', path: '/home' })
            const originalState = useTabsStore.getState()

            store.updateTabPath('nonexistent', '/new-path')

            const newState = useTabsStore.getState()
            expect(newState.tabs[0].path).toBe(originalState.tabs[0].path)
            expect(newState.lastPathMap).toEqual(originalState.lastPathMap)
        })
    })
})
