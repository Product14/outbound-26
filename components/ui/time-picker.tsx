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
}

interface TimeSlot {
  time: string
  display: string
}

export function TimePicker({ value, onChange, className, placeholder = "Select time", disabled = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Predefined time slots
  const timeSlots: TimeSlot[] = [
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
          <span className={cn(
            "text-[#1A1A1A]",
            value && "bg-[#4600F2]/10 px-2 py-1 rounded"
          )}>
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
          {timeSlots.map((timeSlot) => (
            <button
              key={timeSlot.time}
              type="button"
              onClick={() => handleTimeSelect(timeSlot)}
              className={cn(
                "w-full px-4 py-3 text-left text-[14px] hover:bg-[#F3F4F6] transition-colors duration-150",
                timeSlot.time === value && "bg-[#F3F4F6]",
                "first:rounded-t-lg last:rounded-b-lg"
              )}
            >
                           <span className="text-[#1A1A1A] font-medium">{timeSlot.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
