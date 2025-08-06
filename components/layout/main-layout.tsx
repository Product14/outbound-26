'use client'

import { Sidebar } from './sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <main className="flex-1 overflow-auto">
          <div className="lg:pl-0 pt-16 lg:pt-0 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
