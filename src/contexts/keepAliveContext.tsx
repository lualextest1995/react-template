import { createContext, type ReactNode, useReducer } from 'react'

type KeepAliveState = {
    caches: Record<string, ReactNode>
}

type KeepAliveContextValue = KeepAliveState & {
    setCaches: (id: string, element: ReactNode) => void
    hasCache: (id: string) => boolean
    getCache: (id: string) => ReactNode | null
    removeCache: (id: string) => void
    clearCaches: () => void
    getCacheIds: () => string[]
}

type KeepAliveContextProviderProps = {
    children: ReactNode
}

type SetCachesAction = {
    type: 'SET_CACHES'
    payload: { id: string; element: ReactNode }
}

type RemoveCacheAction = {
    type: 'REMOVE_CACHE'
    payload: { id: string }
}
type ClearCachesAction = {
    type: 'CLEAR_CACHES'
}

type Action = SetCachesAction | RemoveCacheAction | ClearCachesAction

const initialState: KeepAliveState = {
    caches: {},
}

const cachesReducer = (state: KeepAliveState, action: Action): KeepAliveState => {
    switch (action.type) {
        case 'SET_CACHES': {
            const { id, element } = action.payload
            return {
                caches: {
                    ...state.caches,
                    [id]: element,
                },
            }
        }
        case 'REMOVE_CACHE': {
            const { id } = action.payload
            if (!(id in state.caches)) {
                return state
            }
            const newCaches = { ...state.caches }
            delete newCaches[id]
            return {
                caches: newCaches,
            }
        }
        case 'CLEAR_CACHES': {
            return {
                caches: {},
            }
        }
        default:
            return state
    }
}

export const KeepAliveContext = createContext<KeepAliveContextValue | null>(null)

const KeepAliveContextProvider = ({ children }: KeepAliveContextProviderProps) => {
    const [cacheState, dispatch] = useReducer(cachesReducer, initialState)

    const cacheCtx: KeepAliveContextValue = {
        caches: cacheState.caches,
        setCaches: (id: string, element: ReactNode) =>
            dispatch({ type: 'SET_CACHES', payload: { id, element } }),
        hasCache: (id: string) => {
            return id in cacheState.caches
        },
        getCache: (id: string) => {
            return cacheState.caches[id] || null
        },
        removeCache: (id: string) => {
            dispatch({ type: 'REMOVE_CACHE', payload: { id } })
        },
        clearCaches: () => {
            dispatch({ type: 'CLEAR_CACHES' })
        },
        getCacheIds: () => {
            return Object.keys(cacheState.caches)
        },
    }

    return <KeepAliveContext.Provider value={cacheCtx}>{children}</KeepAliveContext.Provider>
}

export default KeepAliveContextProvider
