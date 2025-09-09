'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Plus, Zap } from 'lucide-react'
import Link from "next/link"
import { buildUrlWithParams } from '@/lib/url-utils'
import { calculateAndFormatTimeRange, calculateEndDate, formatTimeRange } from '@/lib/time-utils'
import { CampaignData } from '@/types/campaign-setup'

interface Step5CampaignSuccessProps {
  campaignData: CampaignData
  setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
  createdCampaignId: string
  startFreshCampaign: () => void
}

export default function Step5CampaignSuccess({
  campaignData,
  setCampaignData,
  createdCampaignId,
  startFreshCampaign
}: Step5CampaignSuccessProps) {
  const getCampaignDateRange = () => {
    // For "now" campaigns, just show the start date without time
    if (campaignData.schedule === 'now') {
      const startDate = new Date()
      return startDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    // For scheduled campaigns, use the user-selected dates with full time range
    if (campaignData.schedule === 'scheduled' && campaignData.scheduledDate) {
      const startDate = new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime || '09:00'}`)
      const endDate = campaignData.scheduledEndDate 
        ? new Date(`${campaignData.scheduledEndDate}T23:59:59`)
        : calculateEndDate(startDate, campaignData.totalRecords)
      return formatTimeRange(startDate, endDate)
    }
    
    // Fallback to current date if schedule details are incomplete
    const startDate = new Date()
    return startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="max-w-3xl">
      <div className="space-y-6">
        <div className="bg-transparent border-0 p-0">
          <div className="mb-4">
            <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Campaign Started!</h1>
            <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
              Your AI-powered outbound calling campaign is now active and running
            </p>
          </div>
        </div>

        {/* Campaign Status Overview */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <p className="text-[14px] font-medium text-[#666666] mb-1">Campaign ID</p>
              <p className="text-[16px] font-mono text-[#1A1A1A]">{createdCampaignId || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#666666] mb-2">Status</p>
              <Badge className="bg-[#4600F2] text-white px-3 py-1 text-[12px]">
                <Zap className="h-4 w-4 mr-2" />
                {campaignData.schedule === 'now' ? 'Running' : 'Scheduled'}
              </Badge>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#666666] mb-1">
                {campaignData.schedule === 'now' ? 'Campaign Start Date' : 'Scheduled Time Range'}
              </p>
              <p className="text-[16px] text-[#1A1A1A]">
                {getCampaignDateRange()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={buildUrlWithParams(createdCampaignId ? `/results/${createdCampaignId}` : '/results')}>
            <Button size="lg" className="w-full h-11 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium">
              <BarChart3 className="h-5 w-5 mr-2" />
              View Campaign Analytics
            </Button>
          </Link>
          <Button 
            size="lg" 
            onClick={startFreshCampaign}
            className="w-full h-11 px-4 text-[14px] bg-white hover:bg-gray-50 text-[#1A1A1A] border border-[#E5E7EB] rounded-lg font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Setup Another Campaign
            </Button>
        </div>
      </div>
    </div>
  )
}
