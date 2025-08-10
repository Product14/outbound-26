'use client'

import { Toaster } from "@/components/ui/toaster"
import { SidebarNav } from "./sidebar-nav"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <SidebarNav />
      <main className="ml-[272px] w-[calc(100%-272px)]">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
