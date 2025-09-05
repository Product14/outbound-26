import React from "react"
import { cn } from "@/lib/utils"

interface ShimmerProps {
  className?: string
  children?: React.ReactNode
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {children}
    </div>
  )
}

export function ShimmerText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-gray-200 rounded",
            i === lines - 1 ? "w-3/4" : "w-full",
            className
          )}
        />
      ))}
    </div>
  )
}

export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gray-200 rounded-lg p-4", className)}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded w-1/2" />
        <div className="h-3 bg-gray-300 rounded w-full" />
        <div className="h-3 bg-gray-300 rounded w-2/3" />
      </div>
    </div>
  )
}

export function ShimmerBadge({ className }: { className?: string }) {
  return (
    <div className={cn("h-6 bg-gray-200 rounded-full w-16", className)} />
  )
}

export function ShimmerButton({ className }: { className?: string }) {
  return (
    <div className={cn("h-8 bg-gray-200 rounded w-20", className)} />
  )
}

export function ShimmerAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("w-8 h-8 bg-gray-200 rounded-full", className)} />
  )
}

export function ShimmerTranscriptEntry({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-xl p-4 bg-gray-50", className)}>
      <div className="flex gap-3">
        <ShimmerAvatar />
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-3">
            <ShimmerText className="w-16" lines={1} />
            <ShimmerText className="w-12" lines={1} />
          </div>
          <ShimmerText className="w-full" lines={2} />
        </div>
      </div>
    </div>
  )
}
