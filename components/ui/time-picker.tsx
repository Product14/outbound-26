'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  minTime?: string // Format: "HH:MM" - minimum selectable time
  selectedDate?: string // Format: "YYYY-MM-DD" - to check if it's today
  allowPastTimes?: boolean // If true, allows selection of past times even for today (useful for CRM imports)
  isCrmImport?: boolean // If true, uses CRM import logic (allow past times, restrict future times for today)
}

interface TimeSlot {
  time: string
  display: string
}

export function TimePicker({ value, onChange, className, placeholder = "Select time", disabled = false, minTime, selectedDate, allowPastTimes = false, isCrmImport = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to check if a time slot should be disabled
  const isTimeDisabled = (timeSlot: string): boolean => {
    // If allowPastTimes is true, don't disable any times (useful for CRM imports)
    if (allowPastTimes) return false
    
    // Check if selected date is today
    const today = new Date().toISOString().split('T')[0]
    const isToday = selectedDate === today
    
    // For non-today dates, no times are disabled
    if (!isToday) return false
    
    // For CRM imports on today's date: disable future times, allow past times
    if (isCrmImport && isToday) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinute
      
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number)
      const slotTimeInMinutes = slotHour * 60 + slotMinute
      
      // Disable future times (times that haven't happened yet)
      return slotTimeInMinutes > currentTimeInMinutes
    }
    
    // For regular campaign scheduling: disable past times
    const effectiveMinTime = getEffectiveMinTime()
    if (!selectedDate || effectiveMinTime === '00:00') return false
    
    // Convert times to minutes for comparison
    const [minHour, minMinute] = effectiveMinTime.split(':').map(Number)
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number)
    
    const minTimeInMinutes = minHour * 60 + minMinute
    const slotTimeInMinutes = slotHour * 60 + slotMinute
    
    return slotTimeInMinutes < minTimeInMinutes
  }

  // Get current time as minimum time if selectedDate is today and no minTime provided
  const getEffectiveMinTime = (): string => {
    if (minTime) return minTime
    
    const today = new Date().toISOString().split('T')[0]
    const isToday = selectedDate === today
    
    if (isToday) {
      const now = new Date()
      // Add 30 minutes buffer to current time
      now.setMinutes(now.getMinutes() + 30)
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = Math.ceil(now.getMinutes() / 30) * 30 // Round up to next 30-minute interval
      const adjustedMinutes = minutes >= 60 ? '00' : minutes.toString().padStart(2, '0')
      const adjustedHours = minutes >= 60 ? (parseInt(hours) + 1).toString().padStart(2, '0') : hours
      
      return `${adjustedHours}:${adjustedMinutes}`
    }
    
    return '00:00'
  }

  // Predefined time slots - Full 24 hour range
  const timeSlots: TimeSlot[] = [
    { time: "00:00", display: "12:00am" },
    { time: "00:30", display: "12:30am" },
    { time: "01:00", display: "1:00am" },
    { time: "01:30", display: "1:30am" },
    { time: "02:00", display: "2:00am" },
    { time: "02:30", display: "2:30am" },
    { time: "03:00", display: "3:00am" },
    { time: "03:30", display: "3:30am" },
    { time: "04:00", display: "4:00am" },
    { time: "04:30", display: "4:30am" },
    { time: "05:00", display: "5:00am" },
    { time: "05:30", display: "5:30am" },
    { time: "06:00", display: "6:00am" },
    { time: "06:30", display: "6:30am" },
    { time: "07:00", display: "7:00am" },
    { time: "07:30", display: "7:30am" },
    { time: "08:00", display: "8:00am" },
    { time: "08:30", display: "8:30am" },
    { time: "09:00", display: "9:00am" },
    { time: "09:30", display: "9:30am" },
    { time: "10:00", display: "10:00am" },
    { time: "10:30", display: "10:30am" },
    { time: "11:00", display: "11:00am" },
    { time: "11:30", display: "11:30am" },
    { time: "12:00", display: "12:00pm" },
    { time: "12:30", display: "12:30pm" },
    { time: "13:00", display: "1:00pm" },
    { time: "13:30", display: "1:30pm" },
    { time: "14:00", display: "2:00pm" },
    { time: "14:30", display: "2:30pm" },
    { time: "15:00", display: "3:00pm" },
    { time: "15:30", display: "3:30pm" },
    { time: "16:00", display: "4:00pm" },
    { time: "16:30", display: "4:30pm" },
    { time: "17:00", display: "5:00pm" },
    { time: "17:30", display: "5:30pm" },
    { time: "18:00", display: "6:00pm" },
    { time: "18:30", display: "6:30pm" },
    { time: "19:00", display: "7:00pm" },
    { time: "19:30", display: "7:30pm" },
    { time: "20:00", display: "8:00pm" },
    { time: "20:30", display: "8:30pm" },
    { time: "21:00", display: "9:00pm" },
    { time: "21:30", display: "9:30pm" },
    { time: "22:00", display: "10:00pm" },
    { time: "22:30", display: "10:30pm" },
    { time: "23:00", display: "11:00pm" },
    { time: "23:30", display: "11:30pm" },
  ]

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

  const getSelectedTimeSlot = () => {
    return timeSlots.find(slot => slot.time === value)
  }

  const selectedSlot = getSelectedTimeSlot()

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    onChange(timeSlot.time)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-between text-left font-normal h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20 transition-all duration-200 bg-[#F9FAFB]",
          !value && "text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-[#6B7280]" />
          <span className="text-[#1A1A1A]">
            {selectedSlot ? selectedSlot.display : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-[#6B7280] transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {timeSlots.map((timeSlot) => {
            const isDisabled = isTimeDisabled(timeSlot.time)
            return (
              <button
                key={timeSlot.time}
                type="button"
                onClick={() => !isDisabled && handleTimeSelect(timeSlot)}
                disabled={isDisabled}
                className={cn(
                  "w-full px-4 py-3 text-left text-[14px] transition-colors duration-150",
                  !isDisabled && "hover:bg-[#F3F4F6]",
                  timeSlot.time === value && !isDisabled && "bg-[#F3F4F6]",
                  isDisabled && "text-gray-400 cursor-not-allowed bg-gray-50",
                  "first:rounded-t-lg last:rounded-b-lg"
                )}
              >
                <span className={cn(
                  "font-medium",
                  isDisabled ? "text-gray-400" : "text-[#1A1A1A]"
                )}>
                  {timeSlot.display}
                </span>
                {isDisabled && (
                  <span className="text-xs text-gray-400 ml-2">
                    {isCrmImport ? "(Future time)" : "(Past time)"}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
