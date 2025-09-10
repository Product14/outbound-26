'use client'

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  className?: string
  valueColor?: string
  icon?: React.ReactNode
}

export function MetricCard({
  title,
  value,
  subtitle,
  className,
  valueColor = "text-gray-900",
  icon
}: MetricCardProps) {
  return (
    <Card className={cn("bg-white border border-gray-200 shadow-sm h-24", className)}>
      <CardContent className="p-3 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-gray-600 leading-relaxed">{title}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 hidden md:block">{subtitle}</p>
              )}
            </div>
            <p className={cn("text-xl font-bold leading-relaxed", valueColor)}>{value}</p>
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-3 text-gray-400 hidden min-[1100px]:block">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
