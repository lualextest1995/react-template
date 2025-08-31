import { redirect } from 'react-router-dom'
import { useUserStore } from '@/stores/user'

export const requireAuth = () => {
    const { isAuthenticated } = useUserStore.getState()
    console.log('isAuthenticated', isAuthenticated)

    if (!isAuthenticated) {
        throw redirect('/login')
    }

    return null
}

export const requireGuest = () => {
    const { isAuthenticated } = useUserStore.getState()
    console.log('isAuthenticated', isAuthenticated)
    if (isAuthenticated) {
        throw redirect('/')
    }

    return null
}
