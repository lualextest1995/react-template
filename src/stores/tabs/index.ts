import * as R from 'ramda'
import { create } from 'zustand'
import { useKeepAliveStore } from '../keepAlive'

export interface Tab {
    id: string // 對應 routeId
    title: string
    path: string
    lastPath: string // 記錄最後的完整路徑（含 query/params）
    closable?: boolean // 是否可關閉
}

interface TabsStore {
    tabs: Tab[]
    activeId: string | null
    lastPathMap: Record<string, string> // routeId -> 最後訪問的完整路徑
    pendingNavigation: string | null // 待導航的路徑

    // 方法
    openByRoute: (params: {
        routeId: string
        title: string
        path: string
        closable?: boolean
    }) => void
    activate: (routeId: string) => void
    close: (routeId: string) => void
    closeAll: () => void
    rename: (routeId: string, title: string) => void
    closeOthers: (routeId: string) => void
    updateTabPath: (routeId: string, path: string) => void
    handleRouteRemoved: (routeId: string) => boolean // 返回是否需要導航
    setPendingNavigation: (path: string | null) => void
    reorderTabs: (fromIndex: number, toIndex: number) => void // 新增拖拉重新排序功能

    // getter
    getActiveTab: () => Tab | null
    getTabById: (routeId: string) => Tab | null
}

// === Pure Functions using Ramda ===

// 檢查 tab 是否存在
const hasTabWithId = R.curry((routeId: string, tabs: Tab[]): boolean =>
    R.any(R.propEq(routeId, 'id'), tabs)
)

// 根據 routeId 查找 tab
const findTabById = R.curry((routeId: string, tabs: Tab[]): Tab | undefined =>
    R.find(R.propEq(routeId, 'id'), tabs)
)

// 根據 routeId 查找 tab 的索引
const findTabIndexById = R.curry((routeId: string, tabs: Tab[]): number =>
    R.findIndex(R.propEq(routeId, 'id'), tabs)
)

// 移除指定 routeId 的 tab
const removeTabById = R.curry((routeId: string, tabs: Tab[]): Tab[] =>
    R.reject(R.propEq(routeId, 'id'), tabs)
)

// 更新 tab 的屬性
const updateTabById = R.curry((routeId: string, updates: Partial<Tab>, tabs: Tab[]): Tab[] =>
    R.map((tab: Tab) => (tab.id === routeId ? { ...tab, ...updates } : tab), tabs)
)

// 創建新的 tab
const createNewTab = (params: {
    routeId: string
    title: string
    path: string
    closable?: boolean
}): Tab => ({
    id: params.routeId,
    title: params.title,
    path: params.path,
    lastPath: params.path,
    closable: params.closable ?? true,
})

// 更新 lastPathMap
const updateLastPathMap = R.curry(
    (routeId: string, path: string, lastPathMap: Record<string, string>): Record<string, string> =>
        R.assoc(routeId, path, lastPathMap)
)

// 從 lastPathMap 移除 routeId
const removeFromLastPathMap = R.curry(
    (routeId: string, lastPathMap: Record<string, string>): Record<string, string> =>
        R.dissoc(routeId, lastPathMap)
)

// 選擇下一個要激活的 tab（用於關閉當前活躍 tab 時）
const selectNextActiveTab = R.curry((closedTabIndex: number, tabs: Tab[]): Tab | null => {
    if (R.isEmpty(tabs)) {
        return null
    }

    // 策略: 優先左邊 → 沒有則選右邊
    if (closedTabIndex > 0) {
        return tabs[closedTabIndex - 1]
    }

    if (closedTabIndex < tabs.length) {
        return tabs[closedTabIndex]
    }

    return R.head(tabs) || null
})

// 處理 tab 關閉後的狀態更新
const createUpdatedStateAfterClose = (
    routeId: string,
    state: { tabs: Tab[]; activeId: string | null; lastPathMap: Record<string, string> }
) => {
    const remainingTabs = removeTabById(routeId, state.tabs)
    const newLastPathMap = removeFromLastPathMap(routeId, state.lastPathMap)

    // 如果關閉的不是當前活躍的 tab
    if (state.activeId !== routeId) {
        return {
            tabs: remainingTabs,
            activeId: state.activeId,
            lastPathMap: newLastPathMap,
        }
    }

    // 關閉的是當前活躍的 tab
    if (R.isEmpty(remainingTabs)) {
        return {
            tabs: remainingTabs,
            activeId: null,
            lastPathMap: newLastPathMap,
        }
    }

    const closedTabIndex = findTabIndexById(routeId, state.tabs)
    const nextTab = selectNextActiveTab(closedTabIndex, remainingTabs)

    return {
        tabs: remainingTabs,
        activeId: nextTab?.id || null,
        lastPathMap: newLastPathMap,
    }
}

// 計算導航目標路徑
const calculateNavigationPath = (
    targetTab: Tab | null,
    lastPathMap: Record<string, string>
): string => {
    if (!targetTab) {
        return '/'
    }

    return lastPathMap[targetTab.id] || targetTab.path
}

// === Store Implementation ===

export const useTabsStore = create<TabsStore>()((set, get) => ({
    tabs: [],
    activeId: null,
    lastPathMap: {},
    pendingNavigation: null,

    openByRoute: ({ routeId, title, path, closable = true }) => {
        set((state) => {
            const existingTabIndex = findTabIndexById(routeId, state.tabs)

            if (existingTabIndex >= 0) {
                // 更新現有 tab 的路徑
                const updatedTabs = updateTabById(routeId, { path, lastPath: path }, state.tabs)

                return {
                    tabs: updatedTabs,
                    activeId: routeId,
                    lastPathMap: updateLastPathMap(routeId, path, state.lastPathMap),
                }
            }

            // 新增 tab
            const newTab = createNewTab({ routeId, title, path, closable })

            return {
                tabs: R.append(newTab, state.tabs),
                activeId: routeId,
                lastPathMap: updateLastPathMap(routeId, path, state.lastPathMap),
            }
        })
    },

    activate: (routeId) => {
        const { tabs } = get()
        const tab = findTabById(routeId, tabs)
        if (tab) {
            set({ activeId: routeId })
        }
    },

    close: (routeId) => {
        set((state) => {
            const newState = createUpdatedStateAfterClose(routeId, state)

            // 如果關閉的是當前 active tab 且還有其他 tabs，設置新的 active tab
            if (state.activeId === routeId && newState.activeId && newState.activeId !== routeId) {
                const targetPath = calculateNavigationPath(
                    findTabById(newState.activeId, newState.tabs),
                    newState.lastPathMap
                )

                return {
                    ...newState,
                    pendingNavigation: targetPath,
                }
            }

            return newState
        })

        // 同步清理 keep-alive 快取
        useKeepAliveStore.getState().remove(routeId)
    },

    closeAll: () => {
        set({
            tabs: [],
            activeId: null,
            lastPathMap: {},
        })

        // 同步清理所有 keep-alive 快取
        useKeepAliveStore.getState().clear()
    },

    closeOthers: (routeId) => {
        set((state) => {
            const targetTab = findTabById(routeId, state.tabs)
            if (!targetTab) {
                return state
            }

            const preservedLastPathMap = R.pick([routeId], state.lastPathMap)

            // 收集要清理的 routeIds
            const otherTabs = removeTabById(routeId, state.tabs)
            const routeIdsToRemove = R.map((tab: Tab) => tab.id, otherTabs)

            // 同步清理其他 keep-alive 快取
            const keepAliveStore = useKeepAliveStore.getState()
            routeIdsToRemove.forEach((id: string) => keepAliveStore.remove(id))

            return {
                tabs: [targetTab],
                activeId: routeId,
                lastPathMap: preservedLastPathMap,
            }
        })
    },

    rename: (routeId, title) => {
        set((state) => {
            const tabExists = hasTabWithId(routeId, state.tabs)
            if (!tabExists) {
                return state
            }

            return {
                tabs: updateTabById(routeId, { title }, state.tabs),
            }
        })
    },

    updateTabPath: (routeId, path) => {
        set((state) => {
            const tabExists = hasTabWithId(routeId, state.tabs)
            if (!tabExists) {
                return state
            }

            return {
                tabs: updateTabById(routeId, { path, lastPath: path }, state.tabs),
                lastPathMap: updateLastPathMap(routeId, path, state.lastPathMap),
            }
        })
    },

    handleRouteRemoved: (routeId) => {
        const { tabs, activeId, lastPathMap } = get()
        const hasTab = hasTabWithId(routeId, tabs)

        if (!hasTab) {
            return false // 如果沒有對應的 tab，不需要導航
        }

        console.log(`正在處理被移除的路由: ${routeId}, 當前活躍tab: ${activeId}`)

        const remainingTabs = removeTabById(routeId, tabs)

        // 如果關閉的是當前活躍的 tab
        if (activeId === routeId) {
            if (R.isEmpty(remainingTabs)) {
                console.log('沒有其他tab，將跳轉到根路徑: /')

                set((state) => ({
                    tabs: [],
                    activeId: null,
                    lastPathMap: removeFromLastPathMap(routeId, state.lastPathMap),
                    pendingNavigation: '/',
                }))

                return true // 需要導航
            }

            // 選擇下一個要激活的 tab
            const closedTabIndex = findTabIndexById(routeId, tabs)
            const nextTab = selectNextActiveTab(closedTabIndex, remainingTabs)

            if (nextTab) {
                const targetPath = calculateNavigationPath(nextTab, lastPathMap)

                console.log(`將跳轉到tab: ${nextTab.id}, 路徑: ${targetPath}`)

                set((state) => ({
                    tabs: remainingTabs,
                    activeId: nextTab.id,
                    lastPathMap: removeFromLastPathMap(routeId, state.lastPathMap),
                    pendingNavigation: targetPath,
                }))

                return true // 需要導航
            }
        }

        // 關閉的不是當前活躍的 tab，只需要移除 tab
        console.log(`關閉非活躍tab: ${routeId}`)
        set((state) => ({
            tabs: remainingTabs,
            activeId: state.activeId,
            lastPathMap: removeFromLastPathMap(routeId, state.lastPathMap),
        }))

        return false // 不需要導航
    },

    setPendingNavigation: (path) => {
        set((state) => ({ ...state, pendingNavigation: path }))
    },

    reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
            const tabs = [...state.tabs]
            const draggedTab = tabs[fromIndex]
            const tabsWithoutDragged = R.remove(fromIndex, 1, tabs)
            const reorderedTabs = R.insert(toIndex, draggedTab, tabsWithoutDragged)

            return {
                ...state,
                tabs: reorderedTabs,
            }
        })
    },

    // Getters
    getActiveTab: () => {
        const { tabs, activeId } = get()
        return activeId ? findTabById(activeId, tabs) || null : null
    },

    getTabById: (routeId) => {
        const { tabs } = get()
        return findTabById(routeId, tabs) || null
    },
}))
