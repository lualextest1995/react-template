import { AppSidebar } from '@/components/app-sidebar'
import { KeepAliveOutlet } from '@/components/KeepAliveOutlet'
import { TabBar } from '@/components/TabBar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useSyncTabsWithRouter } from '@/hooks/useSyncTabsWithRouter'

export default function Layout() {
    useSyncTabsWithRouter()
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full relative">
                <SidebarTrigger />
                <KeepAliveOutlet className="min-h-[calc(100vh-70px)]" />
                <TabBar className="sticky -20 z-10" />
            </main>
        </SidebarProvider>
    )
}
