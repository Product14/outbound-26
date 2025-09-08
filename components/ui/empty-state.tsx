import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-16 px-4",
      className
    )}>
      <div className="max-w-md mx-auto">
        {Icon && (
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
            <Icon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            className={cn(
              action.variant === "default" && "bg-[#4600f2] hover:bg-[#3d00d9] text-white"
            )}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
