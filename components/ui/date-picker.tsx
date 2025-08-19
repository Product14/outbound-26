'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  minDate?: string
  maxDate?: string
}

export function DatePicker({ 
  value, 
  onChange, 
  className, 
  placeholder = "Select date", 
  disabled = false,
  minDate,
  maxDate 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse initial value
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      setCurrentDate(date)
    }
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateForValue = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const isDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate)) return true
    if (maxDate && date > new Date(maxDate)) return true
    return false
  }

  const handleDateSelect = (date: Date) => {
    if (isDisabled(date)) return
    setSelectedDate(date)
    onChange(formatDateForValue(date))
    setIsOpen(false)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
    onChange(formatDateForValue(today))
    setIsOpen(false)
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-7" />)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const disabled = isDisabled(date)
      
      days.push(
        <Button
          key={day}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleDateSelect(date)}
          disabled={disabled}
          className={cn(
            "h-7 w-7 p-0 text-xs font-normal",
            isToday(date) && "bg-[#4600F2] text-white hover:bg-[#4600F2]/90",
            isSelected(date) && !isToday(date) && "bg-[#4600F2]/10 text-[#4600F2] hover:bg-[#4600F2]/20",
            disabled && "text-[#9CA3AF] cursor-not-allowed",
            !disabled && !isToday(date) && !isSelected(date) && "hover:bg-[#F3F4F6]"
          )}
        >
          {day}
        </Button>
      )
    }

    return days
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-start text-left font-normal h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20 transition-all duration-200",
          !value && "text-muted-foreground",
          className
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {selectedDate ? formatDate(selectedDate) : placeholder}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={previousMonth}
              className="h-7 w-7 p-0 hover:bg-[#4600F2]/10"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <div className="text-sm font-semibold text-[#1A1A1A]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-7 w-7 p-0 hover:bg-[#4600F2]/10"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((day) => (
              <div key={day} className="h-6 flex items-center justify-center text-xs font-medium text-[#6B7280]">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {renderCalendar()}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between items-center pt-1 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs h-6 px-2 border-[#E5E7EB] hover:border-[#4600F2] hover:bg-[#4600F2]/5"
            >
              Today
            </Button>
            
            <div className="text-xs text-[#6B7280]">
              {selectedDate && formatDate(selectedDate)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
