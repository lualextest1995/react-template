import { useContext } from 'react'
import { KeepAliveContext } from '@/contexts/keepAliveContext'

export const useKeepAliveContext = () => {
    const keepAliveCtx = useContext(KeepAliveContext)
    if (!keepAliveCtx) {
        throw new Error('useKeepAliveContext must be used within a KeepAliveContextProvider')
    }
    return keepAliveCtx
}
