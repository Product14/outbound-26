'use client'

import { MetricCard } from "./metric-card"
import { CampaignMetrics } from "@/lib/metrics-utils"
import { Voicemail, PhoneOff, MessageSquare, Star } from "lucide-react"

interface MetricsGridProps {
  metrics: CampaignMetrics
  className?: string
}

export function MetricsGrid({ metrics, className }: MetricsGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {/* Voicemail Rate */}
      <MetricCard
        title="Voicemail"
        value={`${metrics.voicemailRate.percentage}%`}
        subtitle={`(${metrics.voicemailRate.count} calls)`}
        valueColor="text-orange-600"
        icon={<Voicemail className="h-5 w-5" />}
      />
      
      {/* Call Failed Rate */}
      <MetricCard
        title="Call Failed"
        value={`${metrics.callFailedRate.percentage}%`}
        subtitle={`(${metrics.callFailedRate.count} calls)`}
        valueColor="text-red-600"
        icon={<PhoneOff className="h-5 w-5" />}
      />
      
      {/* Positive Followup Rate */}
      <MetricCard
        title="Positive Followup"
        value={`${metrics.positiveFollowupRate.percentage}%`}
        subtitle={`(${metrics.positiveFollowupRate.count} calls)`}
        valueColor="text-green-600"
        icon={<MessageSquare className="h-5 w-5" />}
      />
      
      {/* Average AI Quality Score */}
      <MetricCard
        title="Avg AI Quality Score"
        value={metrics.avgAiQualityScore.toFixed(1)}
        valueColor="text-blue-600"
        icon={<Star className="h-5 w-5" />}
      />
    </div>
  )
}
