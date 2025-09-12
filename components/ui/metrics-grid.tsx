'use client'

import { MetricCard } from "./metric-card"
import { CampaignMetrics } from "@/lib/metrics-utils"
import { Phone, Users, Calendar, CheckCircle, Voicemail, Clock, PhoneOff, MessageSquare } from "lucide-react"

interface MetricsGridProps {
  metrics: CampaignMetrics
  className?: string
}

export function MetricsGrid({ metrics, className }: MetricsGridProps) {
  return (
    <>
      {/* Desktop view - 4 columns */}
      <div className={`hidden md:grid md:grid-cols-4 gap-4 auto-rows-fr ${className}`}>
        {/* Row 1 */}
        <MetricCard
          title="Total Calls Made"
          value={metrics.totalCallsMade.count.toLocaleString()}
          valueColor="text-blue-600"
          icon={<Phone className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Total Contacted"
          value={metrics.totalCustomersContacted.count.toLocaleString()}
          valueColor="text-green-600"
          icon={<Users className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Total Appointments"
          value={metrics.totalAppointmentsSet.count.toLocaleString()}
          valueColor="text-purple-600"
          icon={<Calendar className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Answer Rate"
          value={`${metrics.answerRate.percentage}%`}
          valueColor="text-emerald-600"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        
        {/* Row 2 */}
        <MetricCard
          title="Voice Mail %"
          value={`${metrics.voicemailPercentage.percentage}%`}
          valueColor="text-orange-600"
          icon={<Voicemail className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Avg. Call Duration"
          value={metrics.avgCallDuration.duration}
          valueColor="text-teal-600"
          icon={<Clock className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Call failed %"
          value={`${metrics.callFailedPercentage.percentage}%`}
          valueColor="text-red-600"
          icon={<PhoneOff className="h-4 w-4" />}
        />
        
        <MetricCard
          title="% of followups"
          value={`${metrics.percentageOfFollowups.percentage}%`}
          valueColor="text-indigo-600"
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </div>

      {/* Mobile view - 2 columns with custom layout */}
      <div className={`md:hidden space-y-3 ${className}`}>
        {/* Row 1 - First 4 metrics in 2x2 grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Total Calls Made"
            value={metrics.totalCallsMade.count.toLocaleString()}
            valueColor="text-blue-600"
            icon={<Phone className="h-4 w-4" />}
          />
          
          <MetricCard
            title="Total Contacted"
            value={metrics.totalCustomersContacted.count === 0 ? "--" : metrics.totalCustomersContacted.count.toLocaleString()}
            valueColor="text-green-600"
            icon={<Users className="h-4 w-4" />}
          />
          
          <MetricCard
            title="Total Appointments"
            value={metrics.totalAppointmentsSet.count.toLocaleString()}
            valueColor="text-purple-600"
            icon={<Calendar className="h-4 w-4" />}
          />
          
          <MetricCard
            title="Answer Rate"
            value={`${metrics.answerRate.percentage}%`}
            valueColor="text-emerald-600"
            icon={<CheckCircle className="h-4 w-4" />}
          />
        </div>

        {/* Row 2 - Remaining metrics with Average call duration and Percentage of followups in same row */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Voice Mail %"
            value={`${metrics.voicemailPercentage.percentage}%`}
            valueColor="text-orange-600"
            icon={<Voicemail className="h-4 w-4" />}
          />
          
          <MetricCard
            title="Call failed %"
            value={`${metrics.callFailedPercentage.percentage}%`}
            valueColor="text-red-600"
            icon={<PhoneOff className="h-4 w-4" />}
          />
          
          {/* Keep these two in the same row as requested */}
          <MetricCard
            title="Avg. Call Duration"
            value={metrics.avgCallDuration.duration}
            valueColor="text-teal-600"
            icon={<Clock className="h-4 w-4" />}
          />
          
          <MetricCard
            title="% of followups"
            value={`${metrics.percentageOfFollowups.percentage}%`}
            valueColor="text-indigo-600"
            icon={<MessageSquare className="h-4 w-4" />}
          />
        </div>
      </div>
    </>
  )
}
