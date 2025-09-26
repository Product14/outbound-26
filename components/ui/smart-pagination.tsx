"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, MoreHorizontal, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartPaginationProps {
  currentPage: number
  totalPages: number
  totalRecords: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  className?: string
  showProgressIndicator?: boolean
  showGoToPage?: boolean
  itemsPerPageOptions?: number[]
}

export function SmartPagination({
  currentPage,
  totalPages,
  totalRecords,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
  showProgressIndicator = true,
  showGoToPage = true,
  itemsPerPageOptions = [5, 10, 25, 50]
}: SmartPaginationProps) {
  const [goToPageInput, setGoToPageInput] = useState("")
  const [showGoToInput, setShowGoToInput] = useState(false)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords)
  const progressPercentage = totalRecords > 0 ? Math.round((endIndex / totalRecords) * 100) : 0

  // Generate page numbers with intelligent ellipsis
  const getPageNumbers = useCallback(() => {
    const delta = 2 // Number of pages to show around current page
    const range = []
    const rangeWithDots = []

    // Always show first page
    range.push(1)

    // Add pages around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      range.push(totalPages)
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b)

    // Add ellipsis where needed
    let prev = 0
    for (const page of uniqueRange) {
      if (page - prev === 2) {
        rangeWithDots.push(prev + 1)
      } else if (page - prev !== 1) {
        rangeWithDots.push('...')
      }
      rangeWithDots.push(page)
      prev = page
    }

    return rangeWithDots
  }, [currentPage, totalPages])

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPageInput)
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum)
      setGoToPageInput("")
      setShowGoToInput(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage()
    } else if (e.key === 'Escape') {
      setGoToPageInput("")
      setShowGoToInput(false)
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-between px-6 py-4 border-t border-gray-200", className)} data-total-pages={totalPages}>
      {/* Results info and progress indicator */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className="text-sm text-gray-700">
          Showing <span data-start-index>{startIndex + 1}</span> to <span data-end-index>{endIndex}</span> of <span data-total-records>{totalRecords.toLocaleString()}</span> results
          <span data-current-page style={{ display: 'none' }}>{currentPage}</span>
          <span data-page-size style={{ display: 'none' }}>{itemsPerPage}</span>
        </span>
        
        {showProgressIndicator && totalRecords > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {progressPercentage}% complete
            </span>
          </div>
        )}
      </div>

      {/* Items per page selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Select 
          value={itemsPerPage.toString()} 
          onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          data-page-size-select
        >
          <SelectTrigger className="w-20 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map(option => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-700">per page</span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
          data-pagination-prev
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <Button
                key={pageNum}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
          data-pagination-next
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Go to page input for large datasets */}
        {showGoToPage && totalPages > 10 && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
            {!showGoToInput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGoToInput(true)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Go to page
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Page</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={goToPageInput}
                  onChange={(e) => setGoToPageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-16 h-8 text-sm text-center"
                  placeholder={currentPage.toString()}
                  autoFocus
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToPage}
                  disabled={!goToPageInput || parseInt(goToPageInput) < 1 || parseInt(goToPageInput) > totalPages}
                  className="h-8 px-2"
                >
                  Go
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGoToPageInput("")
                    setShowGoToInput(false)
                  }}
                  className="h-8 px-2"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
