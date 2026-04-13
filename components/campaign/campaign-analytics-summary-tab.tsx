'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CampaignAnalyticsResponse, CampaignMetrics } from '@/lib/metrics-utils'

interface CampaignAnalyticsSummaryTabProps {
  analyticsData?: CampaignAnalyticsResponse | null
  campaignMetrics?: CampaignMetrics | null
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4">
      <div className="text-sm font-semibold text-[#6B7280]">{label}</div>
      <div className="mt-2 text-[24px] font-bold leading-[1.4] text-[#1A1A1A]">{value}</div>
    </div>
  )
}

export function CampaignAnalyticsSummaryTab({
  analyticsData,
  campaignMetrics,
}: CampaignAnalyticsSummaryTabProps) {
  const overview = analyticsData?.overview

  const connected = overview?.totalConnectedCalls ?? 0
  const voicemail = overview?.totalVoicemailCount ?? 0
  const failed = overview?.totalCallsFailed ?? 0
  const callbacks = overview?.callbacksRequested ?? 0
  const total = Math.max(connected + voicemail + failed + callbacks, 1)

  const connectionMix = [
    {
      label: 'Connected',
      count: connected,
      tone: 'bg-[#D1FAE5] text-[#065F46]',
    },
    {
      label: 'Voicemail',
      count: voicemail,
      tone: 'bg-[#FEF3C7] text-[#92400E]',
    },
    {
      label: 'Failed',
      count: failed,
      tone: 'bg-[#FEE2E2] text-[#991B1B]',
    },
    {
      label: 'Callbacks',
      count: callbacks,
      tone: 'bg-[#EDE9FE] text-[#5B21B6]',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
            Connection Mix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {connectionMix.map((item) => {
            const width = Math.max((item.count / total) * 100, item.count > 0 ? 10 : 0)
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-32 text-sm text-[#4F5A50]">{item.label}</div>
                <div className="h-9 flex-1 overflow-hidden rounded-full bg-[#F1F4EE]">
                  <div
                    className={`flex h-full items-center rounded-full px-3 text-sm font-semibold ${item.tone}`}
                    style={{ width: `${width}%` }}
                  >
                    {item.count}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
            Campaign Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
          <MetricTile
            label="Callbacks Requested"
            value={String(overview?.callbacksRequested ?? 0)}
          />
          <MetricTile
            label="Voicemails"
            value={String(overview?.totalVoicemailCount ?? 0)}
          />
          <MetricTile
            label="Failed Calls"
            value={String(overview?.totalCallsFailed ?? 0)}
          />
          <MetricTile
            label="Connected Rate"
            value={`${campaignMetrics?.answerRate?.percentage ?? 0}%`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
