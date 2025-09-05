"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { LiveIcon } from '@/components/ui/icons'

interface LiveCallChipProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LiveCallChip({ className, size = 'md' }: LiveCallChipProps) {
  const sizeClasses = {
    sm: 'px-2 py-[3px] text-[10px] gap-1',
    md: 'px-2 py-[3.158px] text-[10px] gap-1',
    lg: 'px-3 py-1 text-sm gap-1.5'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-4 h-4'
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center bg-[#c31812] text-white font-medium rounded-full font-['Inter']",
        sizeClasses[size],
        className
      )}
    >
      <LiveIcon className={cn("text-white", iconSizes[size])} />
      <span className="leading-none">Live</span>
    </div>
  )
}
