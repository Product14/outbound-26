'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutGrid, Settings2, Sparkles } from 'lucide-react'
import { buildUrlWithParams } from '@/lib/url-utils'
import { cn } from '@/lib/utils'

interface OutboundShellProps {
  children: React.ReactNode
}

const navItems = [
  {
    label: 'Campaigns',
    href: '/results',
    icon: LayoutGrid,
  },
  {
    label: 'Campaign Setup',
    href: '/setup',
    icon: Sparkles,
  },
  {
    label: 'Reports',
    href: '/results',
    icon: BarChart3,
  },
]

export function OutboundShell({ children }: OutboundShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#17211b]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-[#d9dfd4] bg-[#eef2e9] lg:flex lg:flex-col">
          <div className="border-b border-[#d9dfd4] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2f7a45] text-sm font-semibold text-white shadow-sm shadow-[#2f7a45]/20">
                OA
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[-0.02em] text-[#17211b]">
                  Outbound AI
                </div>
                <div className="text-xs uppercase tracking-[0.22em] text-[#667165]">
                  Campaign Console
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-8 px-4 py-5">
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a8578]">
                Workspace
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === '/results'
                    ? pathname?.startsWith('/results')
                    : pathname === item.href

                return (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={buildUrlWithParams(item.href)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white text-[#1d2a20] shadow-sm ring-1 ring-[#d9dfd4]'
                        : 'text-[#5f6a60] hover:bg-white/70 hover:text-[#1d2a20]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="space-y-1">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a8578]">
                System
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#5f6a60]">
                <Settings2 className="h-4 w-4" />
                <span>Settings</span>
              </div>
            </div>
          </nav>

          <div className="border-t border-[#d9dfd4] p-4">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#d9dfd4]">
              <div className="text-xs uppercase tracking-[0.22em] text-[#7a8578]">
                Account
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff1e4] text-sm font-semibold text-[#2f7a45]">
                  AU
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#17211b]">Admin User</div>
                  <div className="text-xs text-[#6a756b]">Live analytics enabled</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
