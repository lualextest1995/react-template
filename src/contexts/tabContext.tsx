import { createContext, type ReactNode, useReducer } from 'react'

type Tab = {
    id: string
    title: string
}

type TabsState = {
    tabs: Tab[]
    activeTabId: string | null
}

type TabsContextValue = TabsState & {
    openTab: (tab: Tab) => void
    closeTab: (id: string) => void
    switchTab: (id: string) => void
    closeAll: () => void
    closeOthers: (keepId: string) => void
}

type TabsContextProviderProps = {
    children: ReactNode
}

type OpenTabAction = {
    type: 'OPEN_TAB'
    payload: Tab
}

type CloseTabAction = {
    type: 'CLOSE_TAB'
    payload: { id: string }
}

type SwitchTabAction = {
    type: 'SWITCH_TAB'
    payload: { id: string }
}

type CloseAllAction = {
    type: 'CLOSE_ALL'
}

type CloseOthersAction = {
    type: 'CLOSE_OTHERS'
    payload: { keepId: string }
}

type Action = OpenTabAction | CloseTabAction | SwitchTabAction | CloseAllAction | CloseOthersAction

/**
 * 選擇關閉標籤後的下一個啟用標籤 ID。
 * @param closingId 要關閉的標籤 ID。
 * @param tabs 所有標籤的列表。
 * @returns 下一個啟用標籤的 ID，如果沒有則回傳 null。
 */
const pickNextActive = (closingId: string, tabs: Tab[]): string | null => {
    const idx = tabs.findIndex((t) => t.id === closingId)
    if (idx === -1) {
        return null
    }
    // 優先選擇右邊的 tab
    if (idx + 1 < tabs.length) {
        return tabs[idx + 1].id
    }
    // 否則選擇左邊的 tab
    if (idx > 0) {
        return tabs[idx - 1].id
    }
    return null
}

const initialState: TabsState = {
    tabs: [],
    activeTabId: null,
}

const tabsReducer = (state: TabsState, action: Action): TabsState => {
    switch (action.type) {
        case 'OPEN_TAB': {
            const tab = action.payload
            const exists = state.tabs.some((t) => t.id === tab.id)
            const newTabs = exists ? state.tabs : [...state.tabs, tab]
            return {
                tabs: newTabs,
                activeTabId: tab.id,
            }
        }
        case 'CLOSE_TAB': {
            const { id } = action.payload
            const exists = state.tabs.some((t) => t.id === id)
            if (!exists) {
                return state
            }
            const nextActive =
                state.activeTabId === id ? pickNextActive(id, state.tabs) : state.activeTabId
            const newTabs = state.tabs.filter((t) => t.id !== id)
            const newActiveTabId =
                nextActive && newTabs.some((t) => t.id === nextActive)
                    ? nextActive
                    : (newTabs[0]?.id ?? null)

            return {
                tabs: newTabs,
                activeTabId: newActiveTabId,
            }
        }
        case 'SWITCH_TAB': {
            const { id } = action.payload
            const exists = state.tabs.some((t) => t.id === id)
            const newActiveTabId = exists ? id : state.activeTabId
            return {
                ...state,
                activeTabId: newActiveTabId,
            }
        }
        case 'CLOSE_ALL': {
            return {
                tabs: [],
                activeTabId: null,
            }
        }
        case 'CLOSE_OTHERS': {
            const { keepId } = action.payload
            const keepTab = state.tabs.find((t) => t.id === keepId)
            if (!keepTab) {
                return state
            }
            return {
                tabs: [keepTab],
                activeTabId: keepId,
            }
        }
        default:
            return state
    }
}

export const TabsContext = createContext<TabsContextValue | null>(null)

const TabsContextProvider = ({ children }: TabsContextProviderProps) => {
    const [tabState, dispatch] = useReducer(tabsReducer, initialState)

    const tabCtx: TabsContextValue = {
        tabs: tabState.tabs,
        activeTabId: tabState.activeTabId,
        openTab: (tab) => dispatch({ type: 'OPEN_TAB', payload: tab }),
        closeTab: (id) => dispatch({ type: 'CLOSE_TAB', payload: { id } }),
        switchTab: (id) => dispatch({ type: 'SWITCH_TAB', payload: { id } }),
        closeAll: () => dispatch({ type: 'CLOSE_ALL' }),
        closeOthers: (keepId) => dispatch({ type: 'CLOSE_OTHERS', payload: { keepId } }),
    }

    return <TabsContext.Provider value={tabCtx}>{children}</TabsContext.Provider>
}

export default TabsContextProvider
