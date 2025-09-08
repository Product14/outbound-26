"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CircularProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
  animationDuration?: number
  showValue?: boolean
  valueClassName?: string
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  animationDuration = 1000,
  showValue = false,
  valueClassName
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const [displayValue, setDisplayValue] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)

    return () => clearTimeout(timer)
  }, [value])

  // Animate the number counting
  useEffect(() => {
    if (showValue) {
      const startTime = Date.now()
      const startValue = displayValue
      const endValue = (value / 100) * 10 // Convert to score out of 10

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / animationDuration, 1)
        
        const currentValue = startValue + (endValue - startValue) * progress
        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [value, animationDuration, showValue, displayValue])

  const getStrokeColor = (value: number) => {
    if (value >= 90) return "#10b981" // emerald-500 for excellent scores (9.0+)
    if (value >= 80) return "#22c55e" // green-500 for very good scores (8.0-8.9)
    if (value >= 70) return "#3b82f6" // blue-500 for good scores (7.0-7.9)
    if (value >= 60) return "#f59e0b" // amber-500 for fair scores (6.0-6.9)
    if (value >= 40) return "#f97316" // orange-500 for poor scores (4.0-5.9)
    return "#ef4444" // red-500 for very poor scores (<4.0)
  }

  const getBackgroundColor = (value: number) => {
    if (value >= 90) return "#d1fae5" // emerald-100 for excellent scores
    if (value >= 80) return "#dcfce7" // green-100 for very good scores
    if (value >= 70) return "#dbeafe" // blue-100 for good scores
    if (value >= 60) return "#fef3c7" // amber-100 for fair scores
    if (value >= 40) return "#fed7aa" // orange-100 for poor scores
    return "#fee2e2" // red-100 for very poor scores
  }

  const getTextColor = (value: number) => {
    if (value >= 90) return "#065f46" // emerald-800 for excellent scores
    if (value >= 80) return "#166534" // green-800 for very good scores
    if (value >= 70) return "#1e40af" // blue-800 for good scores
    if (value >= 60) return "#92400e" // amber-800 for fair scores
    if (value >= 40) return "#ea580c" // orange-700 for poor scores
    return "#dc2626" // red-600 for very poor scores
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getBackgroundColor(value)}
          strokeWidth={strokeWidth}
          fill={getBackgroundColor(value)}
          className="opacity-80"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor(value)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Content inside the circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <div className="text-center">
            <div className={cn("text-2xl font-bold", valueClassName)} style={{ color: getTextColor(value) }}>
              {displayValue.toFixed(1)}
            </div>
            <div className="text-xs uppercase tracking-wide" style={{ color: getTextColor(value), opacity: 0.7 }}>
              AI Score
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
