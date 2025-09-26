"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { updateUrlWithFilters, restoreFiltersFromUrl, type FilterState } from '@/lib/url-utils'

interface UseFilterStateOptions {
  enableUrlSync?: boolean
  debounceMs?: number
  onFiltersChange?: (filters: FilterState) => void
}

interface UseFilterStateReturn {
  // Filter states
  searchTerm: string
  statusFilter: string[]
  connectionFilter: string[]
  outcomeFilter: string
  timePeriodFilter: string
  currentPage: number
  itemsPerPage: number

  // Filter setters
  setSearchTerm: (search: string) => void
  setStatusFilter: (status: string[]) => void
  setConnectionFilter: (connection: string[]) => void
  setOutcomeFilter: (outcome: string) => void
  setTimePeriodFilter: (timePeriod: string) => void
  setCurrentPage: (page: number) => void
  setItemsPerPage: (limit: number) => void

  // Utility functions
  clearAllFilters: () => void
  resetPagination: () => void
  getFilterState: () => FilterState
  hasActiveFilters: boolean
}

export function useFilterState(options: UseFilterStateOptions = {}): UseFilterStateReturn {
  const {
    enableUrlSync = true,
    debounceMs = 300,
    onFiltersChange
  } = options

  const pathname = usePathname()

  // Initialize state from URL or defaults
  const [searchTerm, setSearchTermState] = useState('')
  const [statusFilter, setStatusFilterState] = useState<string[]>(['all'])
  const [connectionFilter, setConnectionFilterState] = useState<string[]>(['all'])
  const [outcomeFilter, setOutcomeFilterState] = useState('all')
  const [timePeriodFilter, setTimePeriodFilterState] = useState('30')
  const [currentPage, setCurrentPageState] = useState(1)
  const [itemsPerPage, setItemsPerPageState] = useState(10)
  const [isInitialized, setIsInitialized] = useState(false)

  // Restore state from URL on mount
  useEffect(() => {
    if (enableUrlSync && !isInitialized) {
      const restored = restoreFiltersFromUrl()
      setSearchTermState(restored.search || '')
      setStatusFilterState(restored.status || ['all'])
      setConnectionFilterState(restored.connection || ['all'])
      setOutcomeFilterState(restored.outcome || 'all')
      setTimePeriodFilterState(restored.timePeriod || '30')
      setCurrentPageState(restored.page || 1)
      setItemsPerPageState(Math.min(restored.limit || 10, 50))
      setIsInitialized(true)
    } else if (!enableUrlSync && !isInitialized) {
      setIsInitialized(true)
    }
  }, [enableUrlSync, isInitialized])

  // Get current filter state
  const getFilterState = useCallback((): FilterState => ({
    search: searchTerm,
    status: statusFilter,
    connection: connectionFilter,
    outcome: outcomeFilter,
    timePeriod: timePeriodFilter,
    page: currentPage,
    limit: itemsPerPage,
  }), [searchTerm, statusFilter, connectionFilter, outcomeFilter, timePeriodFilter, currentPage, itemsPerPage])

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return (
      (searchTerm && searchTerm.trim() !== '') ||
      (statusFilter.length > 1 || (statusFilter.length === 1 && statusFilter[0] !== 'all')) ||
      (connectionFilter.length > 1 || (connectionFilter.length === 1 && connectionFilter[0] !== 'all')) ||
      outcomeFilter !== 'all' ||
      timePeriodFilter !== '30' ||
      currentPage > 1
    )
  }, [searchTerm, statusFilter, connectionFilter, outcomeFilter, timePeriodFilter, currentPage])

  // Debounced URL update
  useEffect(() => {
    if (!isInitialized) return

    const timeoutId = setTimeout(() => {
      if (enableUrlSync) {
        updateUrlWithFilters(pathname, getFilterState())
      }
      
      if (onFiltersChange) {
        onFiltersChange(getFilterState())
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [
    searchTerm, statusFilter, connectionFilter, outcomeFilter, 
    timePeriodFilter, currentPage, itemsPerPage, 
    enableUrlSync, pathname, debounceMs, onFiltersChange, 
    getFilterState, isInitialized
  ])

  // Filter setters with automatic pagination reset (except for pagination changes)
  const setSearchTerm = useCallback((search: string) => {
    setSearchTermState(search)
    if (currentPage > 1) {
      setCurrentPageState(1)
    }
  }, [currentPage])

  const setStatusFilter = useCallback((status: string[]) => {
    setStatusFilterState(status)
    if (currentPage > 1) {
      setCurrentPageState(1)
    }
  }, [currentPage])

  const setConnectionFilter = useCallback((connection: string[]) => {
    setConnectionFilterState(connection)
    if (currentPage > 1) {
      setCurrentPageState(1)
    }
  }, [currentPage])

  const setOutcomeFilter = useCallback((outcome: string) => {
    setOutcomeFilterState(outcome)
    if (currentPage > 1) {
      setCurrentPageState(1)
    }
  }, [currentPage])

  const setTimePeriodFilter = useCallback((timePeriod: string) => {
    setTimePeriodFilterState(timePeriod)
    if (currentPage > 1) {
      setCurrentPageState(1)
    }
  }, [currentPage])

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page)
  }, [])

  const setItemsPerPage = useCallback((limit: number) => {
    // Cap limit to maximum of 50 to comply with API constraints
    const cappedLimit = Math.min(limit, 50)
    setItemsPerPageState(cappedLimit)
    if (currentPage > 1) {
      setCurrentPageState(1)
    }
  }, [currentPage])

  // Reset pagination to page 1
  const resetPagination = useCallback(() => {
    setCurrentPageState(1)
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTermState('')
    setStatusFilterState(['all'])
    setConnectionFilterState(['all'])
    setOutcomeFilterState('all')
    setTimePeriodFilterState('30')
    setCurrentPageState(1)
    setItemsPerPageState(10)
  }, [])

  return {
    // Filter states
    searchTerm,
    statusFilter,
    connectionFilter,
    outcomeFilter,
    timePeriodFilter,
    currentPage,
    itemsPerPage,

    // Filter setters
    setSearchTerm,
    setStatusFilter,
    setConnectionFilter,
    setOutcomeFilter,
    setTimePeriodFilter,
    setCurrentPage,
    setItemsPerPage,

    // Utility functions
    clearAllFilters,
    resetPagination,
    getFilterState,
    hasActiveFilters,
  }
}
