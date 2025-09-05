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
    <Card className={cn("bg-white border border-gray-200 shadow-sm", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-medium text-gray-600">{title}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
            <p className={cn("text-xl font-bold", valueColor)}>{value}</p>
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-3 text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
