import type React from 'react'
import { create } from 'zustand'
import AppLayout from '@/layouts/AppLayout'
import LoginLayout from '@/layouts/LoginLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UsersPage } from '@/pages/UsersPage'
import { requireAuth, requireGuest } from '@/utils/auth'

export interface RouteConfig {
    id: string
    path: string
    title?: string
    layout?: React.ComponentType
    component: React.ComponentType
    loader?: () => Promise<unknown> | unknown
    meta?: Record<string, unknown>
    keepAlive?: boolean // 是否需要 keep alive
}

interface RouteStore {
    routes: RouteConfig[]
    addRoute: (route: RouteConfig) => void
    removeRoute: (id: string) => void
    match: (pathname: string) => RouteConfig | null
    getRouteById: (id: string) => RouteConfig | null
    updateRoute: (id: string, updates: Partial<RouteConfig>) => void
}

// 預設路由配置
const defaultRoutes: RouteConfig[] = [
    {
        id: 'home',
        path: '/',
        title: '首頁',
        layout: AppLayout,
        component: HomePage,
        loader: requireAuth,
        keepAlive: false, // 首頁不需要 tab 和緩存
        meta: { icon: 'home' },
    },
    {
        id: 'dashboard',
        path: '/dashboard',
        title: '儀表板',
        layout: AppLayout,
        component: DashboardPage,
        loader: requireAuth,
        keepAlive: true,
        meta: { icon: 'dashboard' },
    },
    {
        id: 'users',
        path: '/users',
        title: '用戶管理',
        layout: AppLayout,
        component: UsersPage,
        loader: requireAuth,
        keepAlive: true,
        meta: { icon: 'users' },
    },
    {
        id: 'settings',
        path: '/settings',
        title: '設定',
        layout: AppLayout,
        component: SettingsPage,
        loader: requireAuth,
        keepAlive: true,
        meta: { icon: 'settings' },
    },
    {
        id: 'login',
        path: '/login',
        title: '登入',
        layout: LoginLayout,
        component: LoginPage,
        loader: requireGuest,
        keepAlive: false,
        meta: { icon: 'login' },
    },
    {
        id: 'notfound',
        path: '*',
        title: '404',
        component: NotFoundPage,
        keepAlive: false,
    },
]

export const useRouteStore = create<RouteStore>((set, get) => ({
    routes: defaultRoutes,

    addRoute: (route) => {
        set((state) => {
            // 檢查是否已存在相同 id 的路由
            const existingIndex = state.routes.findIndex((r) => r.id === route.id)
            if (existingIndex !== -1) {
                // 更新現有路由
                const newRoutes = [...state.routes]
                newRoutes.splice(existingIndex, 1, route)
                return { routes: newRoutes }
            }
            // 添加新路由
            return { routes: [...state.routes, route] }
        })
    },

    removeRoute: (id: string) => {
        set((state) => ({
            routes: state.routes.filter((route) => route.id !== id),
        }))
    },

    updateRoute: (id: string, updates: Partial<RouteConfig>) => {
        set((state) => ({
            routes: state.routes.map((route) =>
                route.id === id ? { ...route, ...updates } : route
            ),
        }))
    },

    match: (pathname: string) => {
        const { routes } = get()

        // 精確匹配
        const exactMatch = routes.find((route) => route.path === pathname)
        if (exactMatch) {
            return exactMatch
        }

        // 動態路由匹配（例如 /users/:id）
        for (const route of routes) {
            if (route.path.includes(':')) {
                const routePattern = route.path.replace(/:[^/]+/g, '[^/]+')
                const regex = new RegExp(`^${routePattern}$`)
                if (regex.test(pathname)) {
                    return route
                }
            }
        }

        // 路徑前綴匹配（例如 /users/123 匹配 /users）
        const prefixMatch = routes.find((route) => {
            if (route.path === '/' || route.path === '*') {
                return false
            }
            return pathname.startsWith(`${route.path}/`)
        })

        if (prefixMatch) {
            return prefixMatch
        }

        // 最後檢查 404 路由
        return routes.find((route) => route.path === '*') || null
    },

    getRouteById: (id) => {
        const { routes } = get()
        return routes.find((route) => route.id === id) || null
    },
}))
