'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { fetchCampaignList, type CampaignListItem } from '@/lib/campaign-api'
import {
  aggregateCampaignStats,
  formatDate,
  formatNumber,
  formatPercent,
  getCampaignKind,
  getStatusMeta,
} from '@/lib/outbound-dashboard'
import { buildUrlWithParams, extractUrlParams } from '@/lib/url-utils'
import { OutboundShell } from '@/components/outbound/outbound-shell'

const fallbackCampaigns: CampaignListItem[] = [
  {
    campaignId: 'demo-sales-001',
    name: 'Aged Lead Re-Activation',
    campaignType: 'Sales',
    campaignUseCase: 'lead_follow_up',
    campaignStatus: 'running',
    status: 'running',
    totalCallPlaced: 342,
    answerRate: 41,
    appointmentScheduled: 38,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    campaignId: 'demo-service-002',
    name: 'Oil Change Win-Back',
    campaignType: 'recall',
    campaignUseCase: 'service_reminder',
    campaignStatus: 'paused',
    status: 'paused',
    totalCallPlaced: 214,
    answerRate: 54,
    appointmentScheduled: 27,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    startDate: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    campaignId: 'demo-sales-003',
    name: 'Weekend Trade-In Push',
    campaignType: 'Sales',
    campaignUseCase: 'trade_in_follow_up',
    campaignStatus: 'completed',
    status: 'completed',
    totalCallPlaced: 518,
    answerRate: 47,
    appointmentScheduled: 66,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    startDate: new Date(Date.now() - 18 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
]

export function CampaignConsolePage() {
  const urlParams = extractUrlParams()
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallbackData, setUsingFallbackData] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all')
  const [kindFilter, setKindFilter] = useState<'all' | 'sales' | 'service'>('all')

  useEffect(() => {
    let cancelled = false

    async function loadCampaigns() {
      setLoading(true)
      setError(null)

      try {
        if (!urlParams.enterprise_id || !urlParams.team_id || !urlParams.auth_key) {
          if (!cancelled) {
            setCampaigns(fallbackCampaigns)
            setUsingFallbackData(true)
          }
          return
        }

        const response = await fetchCampaignList(
          urlParams.enterprise_id,
          urlParams.team_id,
          urlParams.auth_key,
        )

        if (!cancelled) {
          setCampaigns(response.campaigns || [])
          setUsingFallbackData(false)
        }
      } catch (err) {
        if (!cancelled) {
          setCampaigns(fallbackCampaigns)
          setUsingFallbackData(true)
          setError(err instanceof Error ? err.message : 'Failed to load live campaign data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCampaigns()
    return () => {
      cancelled = true
    }
  }, [urlParams.auth_key, urlParams.enterprise_id, urlParams.team_id])

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesQuery = campaign.name.toLowerCase().includes(query.toLowerCase())
      const status = (campaign.campaignStatus || campaign.status || '').toLowerCase()
      const normalizedStatus =
        ['running', 'active', 'in_progress'].includes(status)
          ? 'active'
          : ['paused'].includes(status)
            ? 'paused'
            : ['completed', 'stopped', 'done'].includes(status)
              ? 'completed'
              : 'all'

      const campaignKind = getCampaignKind(campaign.campaignType).toLowerCase()

      return (
        matchesQuery &&
        (statusFilter === 'all' || normalizedStatus === statusFilter) &&
        (kindFilter === 'all' || campaignKind === kindFilter)
      )
    })
  }, [campaigns, kindFilter, query, statusFilter])

  const stats = useMemo(() => aggregateCampaignStats(campaigns), [campaigns])

  return (
    <OutboundShell>
      <div className="min-h-screen">
        <div className="border-b border-[#d9dfd4] bg-[#f8faf5] px-5 py-4 sm:px-7 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#788275]">
                Outbound Campaign Analytics
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#17211b]">
                Campaign console
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[#667165]">
                A light-themed operational dashboard wired to the current Outbound AI campaign list.
                The structure mirrors your reference, but the metrics are translated to the live call
                analytics model instead of static SMS placeholders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={buildUrlWithParams('/setup')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#2f7a45] px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-[#2f7a45]/20 transition hover:bg-[#28683b]"
              >
                <Plus className="h-4 w-4" />
                New campaign
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7 lg:px-10">
          {usingFallbackData ? (
            <div className="rounded-3xl border border-[#eadfb1] bg-[#fff9e8] px-4 py-3 text-sm text-[#7a6220]">
              {error
                ? `Live campaign data could not be loaded, so the console is showing local fallback data. ${error}`
                : 'Live authentication parameters were not present in the URL, so the console is showing local fallback data.'}
            </div>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-4">
            <StatCard
              label="Campaigns"
              value={formatNumber(stats.totalCampaigns)}
              sublabel={`${formatNumber(stats.activeCampaigns)} active`}
              accent="emerald"
            />
            <StatCard
              label="Calls Placed"
              value={formatNumber(stats.totalCalls)}
              sublabel="Across current campaign list"
              accent="sky"
            />
            <StatCard
              label="Average Answer Rate"
              value={formatPercent(stats.averageAnswerRate)}
              sublabel="Blended from campaign metrics"
              accent="amber"
            />
            <StatCard
              label="Appointments Set"
              value={formatNumber(stats.totalAppointments)}
              sublabel="Scheduled from all campaigns"
              accent="violet"
            />
          </section>

          <section className="rounded-[28px] border border-[#d9dfd4] bg-white p-4 shadow-sm shadow-[#cad3c1]/30 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788275]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search campaigns"
                  className="h-12 w-full rounded-2xl border border-[#d9dfd4] bg-[#f8faf5] pl-11 pr-4 text-sm text-[#17211b] outline-none transition focus:border-[#2f7a45] focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <FilterGroup
                  label="Status"
                  value={statusFilter}
                  options={[
                    ['all', 'All'],
                    ['active', 'Active'],
                    ['paused', 'Paused'],
                    ['completed', 'Completed'],
                  ]}
                  onChange={(value) => setStatusFilter(value as typeof statusFilter)}
                />
                <FilterGroup
                  label="Type"
                  value={kindFilter}
                  options={[
                    ['all', 'All'],
                    ['sales', 'Sales'],
                    ['service', 'Service'],
                  ]}
                  onChange={(value) => setKindFilter(value as typeof kindFilter)}
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[32px] border border-[#d9dfd4] bg-white shadow-sm shadow-[#cad3c1]/30">
            <div className="flex items-center justify-between border-b border-[#e5ebe0] px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#788275]">
                  Campaigns
                </div>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#17211b]">
                  All outbound campaigns
                </h2>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9dfd4] bg-[#f8faf5] px-3 py-1.5 text-xs font-medium text-[#5f6a60]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {formatNumber(filteredCampaigns.length)} visible
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#eef1ea] bg-[#f8faf5] text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a8578]">
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Calls</th>
                    <th className="px-5 py-3">Answer Rate</th>
                    <th className="px-5 py-3">Appointments</th>
                    <th className="px-5 py-3">Started</th>
                    <th className="px-5 py-3 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="border-b border-[#eef1ea]">
                        {Array.from({ length: 8 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-5 py-4">
                            <div className="h-4 animate-pulse rounded-full bg-[#eef1ea]" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map((campaign) => {
                      const status = getStatusMeta(campaign.campaignStatus || campaign.status)
                      const kind = getCampaignKind(campaign.campaignType)

                      return (
                        <tr
                          key={campaign.campaignId}
                          className="border-b border-[#eef1ea] text-sm text-[#28312c] transition hover:bg-[#fbfcf8]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#17211b]">{campaign.name}</div>
                            <div className="mt-1 text-xs text-[#788275]">
                              {campaign.campaignUseCase
                                ? campaign.campaignUseCase.replace(/[_-]/g, ' ')
                                : 'No use case label'}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-[#eff6ef] px-2.5 py-1 text-xs font-medium text-[#2f7a45]">
                              {kind}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${status.chip}`}
                            >
                              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium">{formatNumber(campaign.totalCallPlaced)}</td>
                          <td className="px-5 py-4 font-medium">{formatPercent(campaign.answerRate)}</td>
                          <td className="px-5 py-4 font-medium">
                            {formatNumber(campaign.appointmentScheduled)}
                          </td>
                          <td className="px-5 py-4 text-[#5f6a60]">
                            {formatDate(campaign.startDate || campaign.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={buildUrlWithParams(`/results/${campaign.campaignId}`)}
                              className="inline-flex items-center gap-2 rounded-full border border-[#d9dfd4] bg-[#f8faf5] px-3 py-1.5 text-xs font-medium text-[#17211b] transition hover:border-[#2f7a45] hover:text-[#2f7a45]"
                            >
                              Open
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="text-lg font-semibold tracking-[-0.03em] text-[#17211b]">
                            No campaigns match these filters
                          </div>
                          <p className="mt-2 text-sm text-[#667165]">
                            Try clearing the search or filter state. The page is already wired to the
                            campaign list API, so any live campaigns returned there will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </OutboundShell>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string
  value: string
  sublabel: string
  accent: 'emerald' | 'sky' | 'amber' | 'violet'
}) {
  const accentMap = {
    emerald: 'from-emerald-100 to-white text-emerald-700',
    sky: 'from-sky-100 to-white text-sky-700',
    amber: 'from-amber-100 to-white text-amber-700',
    violet: 'from-violet-100 to-white text-violet-700',
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#d9dfd4] bg-white shadow-sm shadow-[#cad3c1]/30">
      <div className={`h-1.5 bg-gradient-to-r ${accentMap[accent]}`} />
      <div className="space-y-2 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a8578]">
          {label}
        </div>
        <div className="text-3xl font-semibold tracking-[-0.05em] text-[#17211b]">{value}</div>
        <div className="text-sm text-[#667165]">{sublabel}</div>
      </div>
    </div>
  )
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[#d9dfd4] bg-white px-2 py-2">
      <span className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#788275]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map(([optionValue, optionLabel]) => {
          const active = optionValue === value
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'bg-[#2f7a45] text-white'
                  : 'bg-[#f8faf5] text-[#5f6a60] hover:bg-[#eef2e9]'
              }`}
            >
              {optionLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}
