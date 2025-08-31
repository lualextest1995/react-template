import { useMutation } from '@tanstack/react-query'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '@/apis/global/user'
import { Button } from '@/components/base/button'
import { KeepAliveOutlet } from '@/components/KeepAliveOutlet'
import { TabBar } from '@/components/TabBar'
import { useSyncTabsWithRouter } from '@/hooks/useSyncTabsWithRouter'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'
import { requireAuth } from '@/utils/auth'

const Layout: React.FC = () => {
    const { routes } = useRouteStore()
    const { user } = useUserStore()
    const resetUser = useUserStore((s) => s.resetUser)
    const navigate = useNavigate()
    useSyncTabsWithRouter()

    const { mutateAsync } = useMutation({
        mutationFn: () => logout(),
        onSettled: () => {
            resetUser()
            navigate('/login', { replace: true })
            console.log('登出請求已完成')
        },
    })

    const handleLogout = () => {
        mutateAsync()
    }

    return (
        <div className="min-h-screen bg-background">
            {/* 側邊導航 */}
            <aside className="fixed left-0 top-0 w-64 h-full bg-muted/20 border-r p-4 flex flex-col">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-4">導航選單</h2>
                    <nav className="space-y-2">
                        {routes
                            .filter((route) => route.loader === requireAuth)
                            .map((route) => (
                                <Link
                                    key={route.id}
                                    to={route.path}
                                    className="block px-3 py-2 rounded hover:bg-muted/50 transition-colors"
                                >
                                    {route.title}
                                </Link>
                            ))}
                    </nav>
                </div>

                {/* 用戶資訊和登出 */}
                <div className="border-t pt-4 mt-4">
                    <div className="mb-3">
                        <p className="text-sm text-gray-600">歡迎</p>
                        <p className="font-medium">{user?.name || user?.username}</p>
                    </div>
                    <Button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                    >
                        登出
                    </Button>
                </div>
            </aside>

            {/* 主要內容區 */}
            <main className="ml-64">
                {/* Tab 欄 */}
                <TabBar className="sticky -0 z-10" />

                {/* 頁面內容 */}
                <div className="h-[calc(100vh-60px)] overflow-auto ">
                    <KeepAliveOutlet className="min-h-full" />
                </div>
            </main>
        </div>
    )
}

export default Layout
