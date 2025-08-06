'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Plus, BarChart3, Menu, X, Zap } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Setup New Campaign', href: '/setup', icon: Plus },
  { name: 'Campaign Results', href: '/results', icon: BarChart3 },
]

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg border-gray-300"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center border-b" style={{ padding: '24px', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>
                  phone
                </span>
              </div>
              <div className="ml-4">
                <h1 className="text-page-heading" style={{ color: 'hsl(var(--text-primary))' }}>Outbound AI</h1>
                <p className="text-small" style={{ color: 'hsl(var(--text-secondary))' }}>Intelligent Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2" style={{ padding: '24px 16px' }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/results' && pathname.startsWith('/results'))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "group flex items-center rounded-lg transition-all duration-150",
                    isActive
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100"
                  )}
                  style={{
                    padding: '12px 16px',
                    ...(!isActive && { color: 'hsl(var(--text-primary))' })
                  }}
                >
                  <item.icon className={cn(
                    "mr-3 transition-transform duration-150",
                    "w-5 h-5"
                  )} />
                  <span className="text-body truncate">{item.name}</span>
                  {item.name === 'Setup New Campaign' && (
                    <Zap className={cn(
                      "ml-auto w-4 h-4 transition-colors duration-150",
                      isActive ? "text-yellow-300" : ""
                    )}
                    style={!isActive ? { color: 'hsl(var(--warning))' } : {}} />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
