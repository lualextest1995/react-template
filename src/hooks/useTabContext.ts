import { useContext } from 'react'
import { TabsContext } from '@/contexts/tabContext'

export const useTabContext = () => {
    const tabCtx = useContext(TabsContext)
    if (!tabCtx) {
        throw new Error('useTabContext must be used within a TabsContextProvider')
    }
    return tabCtx
}
