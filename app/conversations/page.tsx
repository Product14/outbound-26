'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Search, MessageSquare, PhoneCall, Zap, CheckCircle2, XCircle, Clock, CalendarCheck } from 'lucide-react'
import { getMockConversationsList, type ConversationListItem, type CampaignChannel } from '@/lib/outbound-local-data'
import { buildUrlWithParams } from '@/lib/url-utils'

function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  if (channel === 'SMS+Call') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE9FE] text-[#6D28D9]">
        <Zap className="h-3 w-3" /> SMS + Call
      </span>
    )
  }
  if (channel === 'SMS') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D1FAE5] text-[#065F46]">
        <MessageSquare className="h-3 w-3" /> SMS
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DBEAFE] text-[#1D4ED8]">
      <PhoneCall className="h-3 w-3" /> Call
    </span>
  )
}

function StatusBadge({ status }: { status: ConversationListItem['status'] }) {
  const cfg: Record<ConversationListItem['status'], { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    active:    { bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]', icon: <Clock className="h-3 w-3" />,        label: 'Active' },
    booked:    { bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]', icon: <CalendarCheck className="h-3 w-3" />, label: 'Booked' },
    completed: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completed' },
    opted_out: { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', icon: <XCircle className="h-3 w-3" />,      label: 'Opted Out' },
  }
  const c = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      {c.icon} {c.label}
    </span>
  )
}

export default function ConversationsPage() {
  const router = useRouter()
  const all = useMemo(() => getMockConversationsList(), [])

  const [search, setSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const campaigns = useMemo(() => {
    const map = new Map<string, string>()
    all.forEach((c) => map.set(c.campaignId, c.campaignName))
    return Array.from(map.entries())
  }, [all])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return all.filter((c) => {
      if (term && !c.leadName.toLowerCase().includes(term) && !c.vehicle.toLowerCase().includes(term)) return false
      if (campaignFilter !== 'all' && c.campaignId !== campaignFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      return true
    })
  }, [all, search, campaignFilter, statusFilter])

  const handleOpen = (conv: ConversationListItem) => {
    router.push(buildUrlWithParams(`/results/${conv.campaignId}`, { tab: 'leads' }))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={buildUrlWithParams('/results')}
            className="flex items-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-page-heading text-text-primary">Conversations</h1>
            <p className="text-subheading text-text-secondary">
              All SMS campaign conversations across every running and completed campaign
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-80 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
                <Input
                  placeholder="Search by lead name or vehicle…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 pl-12 text-sm shadow-sm transition-all duration-200 ease-out focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 ml-auto">
                <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                  <SelectTrigger className="w-56 h-10 text-[#666666] font-semibold border-border bg-surface">
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="all">All campaigns</SelectItem>
                    {campaigns.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-10 text-[#666666] font-semibold border-border bg-surface">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="opted_out">Opted Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-3 text-sm text-gray-700 font-semibold">
          {filtered.length} {filtered.length === 1 ? 'conversation' : 'conversations'}
        </div>

        {/* List */}
        <Card className="border-0 bg-white rounded-[16px]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Channel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Last Message</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Sessions</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Campaign</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[#6B7280]">
                        No conversations match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((conv) => (
                      <tr
                        key={conv.id}
                        onClick={() => handleOpen(conv)}
                        className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-[#F9F9FF]"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#1A1A1A]">{conv.leadName}</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            {conv.vehicle} · <span className="font-mono">{conv.leadPhone}</span>
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <ChannelBadge channel={conv.channel} />
                        </td>
                        <td className="px-4 py-4 max-w-[320px]">
                          <p className="text-[#374151] truncate">{conv.lastMessagePreview}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#1A1A1A] font-medium">{conv.sessionCount}</span>
                            {conv.escalated && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE9FE] text-[#6D28D9]">
                                <Zap className="h-2.5 w-2.5" /> Esc
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={conv.status} />
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F4F6] text-[#374151]">
                            via {conv.campaignName}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-[#6B7280] whitespace-nowrap">{conv.lastMessageAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
