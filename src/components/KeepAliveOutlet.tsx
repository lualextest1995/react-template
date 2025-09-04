import type React from 'react'
import { useEffect, useMemo } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { useKeepAliveContext } from '@/hooks/useKeepAliveContext'
import { useTabContext } from '@/hooks/useTabContext'
import { useRouteStore } from '@/stores/routes'

interface KeepAliveOutletProps {
    className?: string
}

export const KeepAliveOutlet: React.FC<KeepAliveOutletProps> = ({ className }) => {
    const outlet = useOutlet()
    const location = useLocation()

    const { match: matchRoute } = useRouteStore()
    const { tabs, activeTabId } = useTabContext()
    const { caches, setCaches, hasCache, getCacheIds } = useKeepAliveContext()

    // 計算當前路由信息
    const currentRoute = useMemo(() => {
        return matchRoute(location.pathname)
    }, [matchRoute, location.pathname])

    // 當前活躍的 Tab
    const activeTab = useMemo(() => {
        return tabs.find((tab) => tab.id === activeTabId)
    }, [tabs, activeTabId])

    // 快取當前組件（只緩存 keepAlive 為 true 的路由）
    useEffect(() => {
        if (outlet && currentRoute?.keepAlive && !hasCache(currentRoute.id)) {
            console.log(`[KeepAlive] 快取組件: ${currentRoute.id}`)
            setCaches(currentRoute.id, outlet)
        }
    }, [outlet, currentRoute, hasCache, setCaches])

    // 渲染邏輯
    const renderContent = useMemo(() => {
        console.log(
            `[KeepAlive] 渲染邏輯 - activeTab: ${activeTab?.id}, currentRoute: ${currentRoute?.id}, keepAlive: ${currentRoute?.keepAlive}`
        )

        // 如果當前路由不需要 keepAlive，直接渲染 outlet
        if (!currentRoute?.keepAlive) {
            console.log(`[KeepAlive] 當前路由不需要緩存，直接渲染 outlet`)
            return outlet
        }

        // 如果沒有活躍的 Tab，直接渲染當前 outlet
        if (!activeTab) {
            console.log(`[KeepAlive] 沒有活躍 Tab，直接渲染 outlet`)
            return outlet
        }

        // 獲取所有快取的組件
        const cachedRouteIds = getCacheIds()
        console.log(`[KeepAlive] 已快取的路由: ${cachedRouteIds.join(', ')}`)

        return (
            <div className="relative w-full h-full">
                {/* 渲染所有快取的元素 */}
                {cachedRouteIds.map((routeId) => {
                    const cachedElement = caches[routeId]
                    const isActive = routeId === activeTab.id

                    console.log(`[KeepAlive] 渲染快取組件: ${routeId}, 是否活躍: ${isActive}`)

                    return (
                        <div
                            key={routeId}
                            style={{
                                display: isActive ? 'block' : 'none',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            {cachedElement}
                        </div>
                    )
                })}

                {/* 如果當前活躍的 Tab 沒有快取，直接顯示 outlet */}
                {activeTab && !hasCache(activeTab.id) && (
                    <div style={{ width: '100%', height: '100%' }}>{outlet}</div>
                )}
            </div>
        )
    }, [activeTab, currentRoute, outlet, caches, getCacheIds, hasCache])

    return <div className={className}>{renderContent}</div>
}
