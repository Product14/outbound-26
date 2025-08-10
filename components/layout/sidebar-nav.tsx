'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, BarChart3, Settings, Users, Phone, Calendar, FileText, Target } from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Campaign Setup',
    href: '/setup',
    icon: Target,
  },
  {
    title: 'Campaign Results',
    href: '/results',
    icon: BarChart3,
  },
  {
    title: 'Call Analytics',
    href: '/analytics',
    icon: Phone,
  },
  {
    title: 'Appointments',
    href: '/appointments',
    icon: Calendar,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 z-50 h-screen w-[272px] border-r border-[#E5E7EB] bg-white">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-[#E5E7EB] px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#4600F2] flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#1A1A1A]">Outbound AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-[#4600F2]/10 text-[#4600F2]' 
                    : 'text-[#6B7280] hover:bg-[#F4F5F8] hover:text-[#1A1A1A]'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E5E7EB] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-[#F4F5F8] p-3">
          <div className="h-8 w-8 rounded-full bg-[#4600F2] flex items-center justify-center">
            <span className="text-xs font-medium text-white">AU</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">Admin User</p>
            <p className="text-xs text-[#6B7280] truncate">admin@outbound.ai</p>
          </div>
        </div>
      </div>
    </div>
  )
}
