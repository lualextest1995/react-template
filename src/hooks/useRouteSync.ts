import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRouteStore } from '@/stores/routes'
import { useTabContext } from './useTabContext'
import { useKeepAliveContext } from './useKeepAliveContext'

/**
 * 路由同步 Hook - 簡化版本
 * 功能：
 * 1. 路由跳轉就開啟對應的 tab
 * 2. 關閉 tab 時路由也會跳轉
 * 3. 管理頁面緩存
 * 4. 訪問沒有 keepAlive 的頁面時清除所有 tab 和 cache
 */
export const useRouteSync = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { match: matchRoute, getRouteById } = useRouteStore()
    const { openTab, tabs, activeTabId, switchTab, closeAll } = useTabContext()
    const { clearCaches } = useKeepAliveContext()
    const lastPathRef = useRef<string>('')
    const lastActiveTabIdRef = useRef<string | null>(null)
    const lastTabsLengthRef = useRef<number>(0)

    // 監聽路由變化，自動開啟對應的 Tab
    useEffect(() => {
        const currentPath = location.pathname

        // 避免重複處理同一個路由
        if (lastPathRef.current === currentPath) {
            return
        }

        lastPathRef.current = currentPath
        const matchedRoute = matchRoute(currentPath)

        if (matchedRoute) {
            // 如果訪問的是沒有 keepAlive 的頁面，清除所有 tab 和 cache
            if (!matchedRoute.keepAlive) {
                console.log(`[RouteSync] 訪問非 keepAlive 頁面: ${matchedRoute.id}，清除所有 tab 和 cache`)
                closeAll()
                clearCaches()
                return
            }

            // 只有 keepAlive 為 true 的路由才創建 tab
            // 檢查是否已經有這個 tab
            const existingTab = tabs.find((tab) => tab.id === matchedRoute.id)

            if (!existingTab) {
                console.log(`[RouteSync] 路由變化到: ${matchedRoute.id}，開啟新 Tab`)
                openTab({
                    id: matchedRoute.id,
                    title: matchedRoute.title || matchedRoute.id,
                })
            } else if (activeTabId !== matchedRoute.id) {
                // tab 已存在但不是當前活躍的，切換到該 tab
                console.log(`[RouteSync] 路由變化到: ${matchedRoute.id}，切換到已存在的 Tab`)
                switchTab(matchedRoute.id)
            }
        }
    }, [location.pathname, matchRoute, tabs, activeTabId, openTab, switchTab, closeAll, clearCaches])

    // 監聽 Tab 變化，處理關閉 tab 時的路由跳轉和緩存清理
    useEffect(() => {
        // Tab 關閉時的處理邏輯
        if (lastActiveTabIdRef.current !== activeTabId) {
            const previousTabId = lastActiveTabIdRef.current
            lastActiveTabIdRef.current = activeTabId

            // 如果當前沒有活躍的 tab，導航到首頁
            if (!activeTabId) {
                console.log('[RouteSync] 沒有活躍 Tab，導航到首頁')
                navigate('/', { replace: true })
            }
            // 如果切換到新的 tab，導航到對應路由
            else if (activeTabId !== previousTabId) {
                const route = getRouteById(activeTabId)
                if (route && location.pathname !== route.path) {
                    console.log(`[RouteSync] Tab 切換到: ${activeTabId}，導航到: ${route.path}`)
                    navigate(route.path, { replace: true })
                }
            }
        }
    }, [activeTabId, navigate, getRouteById, location.pathname])

    // 監聽 Tab 數量變化，檢測 Tab 被關閉
    useEffect(() => {
        const currentTabsLength = tabs.length

        // 如果 Tab 數量減少，說明有 Tab 被關閉
        if (currentTabsLength < lastTabsLengthRef.current) {
            console.log('[RouteSync] 檢測到 Tab 被關閉')
            // 注意：實際的緩存清理在 TabBar 組件的關閉操作中處理
            // 這裡只是記錄日志
        }

        lastTabsLengthRef.current = currentTabsLength
    }, [tabs])
}
