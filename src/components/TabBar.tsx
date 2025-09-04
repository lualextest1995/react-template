import { MoreHorizontal, X } from 'lucide-react'
import type React from 'react'
import { useKeepAliveContext } from '@/hooks/useKeepAliveContext'
import { useTabContext } from '@/hooks/useTabContext'
import { cn } from '@/utils/shadcn'

interface TabBarProps {
    className?: string
}

export const TabBar: React.FC<TabBarProps> = ({ className }) => {
    const { tabs, activeTabId, switchTab, closeTab, closeAll, closeOthers } = useTabContext()
    const { removeCache, clearCaches } = useKeepAliveContext()

    const handleTabClick = (tabId: string) => {
        switchTab(tabId)
    }

    const handleTabClose = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault()
        e.stopPropagation()

        console.log(`[TabBar] 準備關閉 Tab: ${tabId}`)

        // 直接執行關閉操作，不需要延遲
        closeTab(tabId)
        removeCache(tabId)

        console.log(`[TabBar] 已關閉 Tab: ${tabId}`)
    }

    const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault()

        const action = window.confirm('選擇操作:\n[確定] 關閉其他\n[取消] 關閉全部')

        if (action) {
            // 關閉其他 Tab - 使用批量操作
            console.log(`[TabBar] 關閉其他 Tab，保留: ${tabId}`)
            const otherTabIds = tabs.filter((tab) => tab.id !== tabId).map((tab) => tab.id)
            closeOthers(tabId)
            // 清理其他 Tab 的快取
            otherTabIds.forEach((id) => removeCache(id))
        } else {
            // 關閉全部 Tab
            console.log('[TabBar] 關閉全部 Tab')
            closeAll()
            clearCaches()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleTabClick(tabId)
        }
    }

    if (tabs.length === 0) {
        return null
    }

    return (
        <div className={cn('flex items-center bg-background border-t border-border', className)}>
            <div className="flex items-center overflow-x-auto">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        role="tab"
                        tabIndex={0}
                        onContextMenu={(e) => handleContextMenu(e, tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer',
                            'hover:bg-accent transition-colors',
                            activeTabId === tab.id && 'bg-accent text-accent-foreground'
                        )}
                        onClick={() => handleTabClick(tab.id)}
                    >
                        <span className="text-sm font-medium truncate max-w-32">{tab.title}</span>
                        <button
                            type="button"
                            onClick={(e) => handleTabClose(e, tab.id)}
                            className="flex items-center justify-center w-6 h-6 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            aria-label="關閉標籤"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex items-center px-2">
                <button
                    type="button"
                    onClick={() => {
                        const shouldCloseAll = window.confirm('確定要關閉所有標籤嗎？')
                        if (shouldCloseAll) {
                            console.log('[TabBar] 確認關閉所有 Tab')
                            closeAll()
                            clearCaches()
                        }
                    }}
                    className="p-2 rounded-sm hover:bg-accent"
                    title="關閉所有標籤"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
