import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type React from 'react'
import { useEffect, useMemo } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import KeepAliveContextProvider from '@/contexts/keepAliveContext'
import TabsContextProvider from '@/contexts/tabContext'
import AppLayout from '@/layouts/AppLayout'
import Test from '@/pages/testPage'
import { useRouteStore } from '@/stores/routes'
import { requireAuth } from '@/utils/auth'

const queryClient = new QueryClient()

const App: React.FC = () => {
    const { routes, addRoute, removeRoute } = useRouteStore()

    // 動態路由測試
    useEffect(() => {
        // 3秒後添加測試頁面路由
        const addTimer = setTimeout(() => {
            console.log('添加測試頁面路由')
            addRoute({
                id: 'test',
                path: '/test',
                title: '測試頁面',
                layout: AppLayout,
                component: Test,
                loader: requireAuth,
                keepAlive: true,
            })
        }, 3000)

        // 15秒後刪除測試頁面路由
        const removeTimer = setTimeout(() => {
            console.log('刪除測試頁面路由')
            removeRoute('test')
        }, 15000)

        return () => {
            clearTimeout(addTimer)
            clearTimeout(removeTimer)
        }
    }, [addRoute, removeRoute])

    // 創建路由配置
    const router = useMemo(() => {
        const routeConfigs = routes.map((route) => {
            const Component = route.component
            const RouteLayout = route.layout

            // 如果有 layout，創建嵌套路由
            if (RouteLayout) {
                return {
                    path: route.path,
                    loader: route.loader,
                    element: <RouteLayout />,
                    children: [
                        {
                            index: route.path === '/',
                            path: route.path === '/' ? undefined : '',
                            element: <Component />,
                        },
                    ],
                }
            }

            // 如果沒有 layout，創建頂層路由
            return {
                path: route.path,
                loader: route.loader,
                element: <Component />,
            }
        })

        return createBrowserRouter(routeConfigs)
    }, [routes])

    return (
        <QueryClientProvider client={queryClient}>
            <KeepAliveContextProvider>
                <TabsContextProvider>
                    <RouterProvider router={router} />
                    <ReactQueryDevtools />
                </TabsContextProvider>
            </KeepAliveContextProvider>
        </QueryClientProvider>
    )
}

export default App
