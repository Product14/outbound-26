"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  AlertCircle,
  CheckCircle,
  Phone,
  Smile,
  Frown,
  Minus,
  Clock,
  ArrowUpDown,
} from "lucide-react"

interface FilterControlsProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  outcomeFilter: string
  setOutcomeFilter: (value: string) => void
  sentimentFilter: string
  setSentimentFilter: (value: string) => void
  intentFilter: string
  setIntentFilter: (value: string) => void
  viewMode: 'cards' | 'table'
  setViewMode: (value: 'cards' | 'table') => void
  selectedQuickFilters: string[]
  toggleQuickFilter: (filter: string) => void
  loading?: boolean
}

export const FilterControls = React.memo(function FilterControls({
  searchTerm,
  setSearchTerm,
  outcomeFilter,
  setOutcomeFilter,
  sentimentFilter,
  setSentimentFilter,
  intentFilter,
  setIntentFilter,
  viewMode,
  setViewMode,
  selectedQuickFilters,
  toggleQuickFilter,
  loading = false
}: FilterControlsProps) {
  const [compactFilters, setCompactFilters] = React.useState(false)
  const filtersRowRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateCompact = () => {
      const el = filtersRowRef.current
      if (!el) return
      const isOverflowing = el.scrollWidth > el.clientWidth
      const shouldCompact = isOverflowing || window.innerWidth < 360
      // Avoid re-render loops by only updating when the value actually changes
      setCompactFilters((prev) => (prev !== shouldCompact ? shouldCompact : prev))
    }

    updateCompact()
    const onResize = () => updateCompact()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        {/* Search Bar - Full Width on Mobile */}
        <div className="w-full mb-4 lg:mb-0">
          <div className="relative w-full max-w-md lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none shrink-0" />
            <Input
              placeholder="Search by customer, phone, agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 pl-10 text-sm shadow-sm transition-all duration-200 ease-out focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>
        
        {/* Filter Controls - Wrap on smaller screens */}
        <div ref={filtersRowRef} className="flex flex-wrap items-center gap-3 lg:justify-end">
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className={`${compactFilters ? "w-10 h-10 px-0 justify-center" : "w-auto min-w-[170px] justify-between px-3 h-10"} flex items-center gap-2 rounded-xl border border-gray-200 bg-white text-sm transition-all duration-150 ease-out hover:bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none`}>
              {compactFilters ? (
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All Resolutions" />
                </div>
              )}
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
              <SelectItem value="all">All Resolutions</SelectItem>
              <SelectItem value="appointment_scheduled">Appointments</SelectItem>
              <SelectItem value="transferred_to_human">Transfers</SelectItem>
              <SelectItem value="info_provided">Info Provided</SelectItem>
              <SelectItem value="callback_requested">Callbacks</SelectItem>

            </SelectContent>
          </Select>

          {/* Sentiment filter removed per requirements */}

          {/* Time filter removed per requirements */}

          {/* Recent/Sort filter removed per requirements */}

          {/* View Toggle */}
          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 h-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('cards')}
              className={`h-8 w-8 p-0 rounded-md transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                viewMode === 'cards' 
                  ? 'bg-[#4600f2] text-white shadow-sm hover:bg-[#4600f2]/90' 
                  : 'text-muted-foreground hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Cards View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none shrink-0">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={`h-8 w-8 p-0 rounded-md transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                viewMode === 'table' 
                  ? 'bg-[#4600f2] text-white shadow-sm hover:bg-[#4600f2]/90' 
                  : 'text-muted-foreground hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Table View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none shrink-0">
                <path d="M3 6h18"/>
                <path d="M3 12h18"/>
                <path d="M3 18h18"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Filters - COMMENTED OUT 
      <div className="mt-4 mb-3">
        {loading ? (
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-2xl" />
            <Skeleton className="h-8 w-20 rounded-2xl" />
            <Skeleton className="h-8 w-24 rounded-2xl" />
            <Skeleton className="h-8 w-20 rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            All Quick Filter buttons would be here
          </div>
        )}
      </div>
      */}

      {/* Applied Filters (Dismissible Chips) */}
      {((searchTerm && searchTerm.trim() !== "") || 
        outcomeFilter !== "all" 
        /* sentimentFilter !== "all" || */
        /* intentFilter !== "all" */) && (
        <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
          {searchTerm && searchTerm.trim() !== "" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-[color,box-shadow] outline-none" style={{ borderColor: '#4600F2', color: '#4600F2' }}>
              <span>Search: "{searchTerm}"</span>
              <button
                onClick={() => setSearchTerm("")}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-gray-100 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: '#4600F2' }}
              >
                ×
              </button>
            </div>
          )}
          
          {outcomeFilter !== "all" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-[color,box-shadow] outline-none" style={{ borderColor: '#4600F2', color: '#4600F2' }}>
              <span>Outcome: {outcomeFilter === "appointment_scheduled" ? "Appointments" : 
                    outcomeFilter === "transferred_to_human" ? "Transfers" : 
                    outcomeFilter === "info_provided" ? "Info Provided" : 
                    outcomeFilter === "callback_requested" ? "Callbacks" : 
                    outcomeFilter}</span>
              <button
                onClick={() => setOutcomeFilter("all")}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-gray-100 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: '#4600F2' }}
              >
                ×
              </button>
            </div>
          )}
          
          {/* Sentiment chip removed */}
          
          {/* Sort chip removed */}
          
          {/* Time period chip removed */}
        </div>
      )}
    </div>
  )
})
