"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface MultiSelectOption {
  label: string
  value: string
  icon?: React.ReactNode
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDisplay?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
  maxDisplay = 2,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(selected.filter((item) => item !== value))
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange([])
  }

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder
    }
    
    if (selected.length === 1) {
      const option = options.find(opt => opt.value === selected[0])
      return option?.label || selected[0]
    }

    if (selected.length <= maxDisplay) {
      return selected
        .map(value => options.find(opt => opt.value === value)?.label || value)
        .join(", ")
    }

    return `${selected.length} selected`
  }

  const selectedOptions = selected.map(value => 
    options.find(opt => opt.value === value)
  ).filter(Boolean) as MultiSelectOption[]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            selected.length === 0 && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selected.length === 1 && selectedOptions[0]?.icon && (
              <span className="shrink-0">
                {selectedOptions[0].icon}
              </span>
            )}
            <span className="truncate">
              {getDisplayText()}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selected.length > 0 && (
              <div
                onClick={handleClearAll}
                className="hover:bg-gray-100 rounded-full p-1 transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClearAll(e as any)
                  }
                }}
              >
                <X className="h-3 w-3 text-gray-500" />
              </div>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-64 overflow-auto">
          {/* Select All / Clear All */}
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <div
                onClick={() => onChange(options.map(opt => opt.value))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange(options.map(opt => opt.value))
                  }
                }}
              >
                Select All
              </div>
              <div
                onClick={() => onChange([])}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange([])
                  }
                }}
              >
                Clear All
              </div>
            </div>
          </div>
          
          {/* Options */}
          <div className="p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/50"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleSelect(option.value)}
                    className="pointer-events-none"
                  />
                  {option.icon && (
                    <span className="shrink-0">
                      {option.icon}
                    </span>
                  )}
                  <span className="text-sm font-medium flex-1">
                    {option.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
