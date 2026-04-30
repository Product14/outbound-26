'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  Flame,
  LogOut,
  MessageCircleOff,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneOff,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  UserMinus,
  Users,
  Voicemail,
  Zap,
} from 'lucide-react'
import type {
  AnalyticsExtrasData,
  SmsOverviewData,
} from '@/lib/outbound-local-data'
import type { CampaignAnalyticsResponse } from '@/lib/metrics-utils'

// ─── Types ──────────────────────────────────────────────────────────────────

type DateRange = 'today' | 'week' | 'mtd' | 'total'
type ChannelFilter = 'all' | 'sms' | 'call'
type ViewMode = 'total' | 'daywise'

export type AnalyticsLevel = 'glance' | 'campaign' | 'deep'

export type MetricFilter = 'optedOut' | 'failedCalls' | 'exited' | null

const DATE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  week: 'This Week',
  mtd: 'MTD',
  total: 'All Time',
}
const DATE_MULT: Record<DateRange, number> = {
  today: 0.06,
  week: 0.32,
  mtd: 0.71,
  total: 1,
}
const CHANNEL_LABELS: Record<ChannelFilter, string> = {
  all: 'All',
  sms: 'SMS',
  call: 'Call',
}

// Color tokens — disciplined palette
const C = {
  ink: '#0B0F1A',
  muted: '#6B7280',
  hint: '#9CA3AF',
  line: '#E5E7EB',
  rule: '#F3F4F6',
  surface: '#FAFAFB',
  brand: '#4600F2',
  brandSoft: '#EFEBFF',
  good: '#10B981',
  warn: '#F59E0B',
  bad: '#EF4444',
  info: '#3B82F6',
}

export interface AnalyticsSummaryProps {
  extrasData?: AnalyticsExtrasData | null
  smsData?: SmsOverviewData
  analyticsData?: CampaignAnalyticsResponse | null
  level?: AnalyticsLevel
  title?: string
  subtitle?: string
  /** Currently active metric filter — highlights the matching tile. */
  activeMetricFilter?: MetricFilter
  /** Fired when the user clicks Opted Out / Failed Calls / Exited. Pass null to clear. */
  onMetricFilter?: (filter: MetricFilter) => void
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function AnalyticsSummary({
  extrasData,
  smsData,
  analyticsData: _analyticsData,
  level = 'deep',
  title,
  subtitle,
  activeMetricFilter = null,
  onMetricFilter,
}: AnalyticsSummaryProps) {
  const [dateRange, setDateRange] = useState<DateRange>('total')
  const [channel, setChannel] = useState<ChannelFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('total')

  const mult = DATE_MULT[dateRange]

  const m = useMemo(() => {
    if (!extrasData) return null
    const t = extrasData.topMetrics
    const cs = channel === 'sms' ? 0.62 : channel === 'call' ? 0.48 : 1
    const s = (n: number, c = cs) => Math.round(n * mult * c)
    return {
      totalEnrolled: s(t.totalEnrolled, 1),
      engaged: s(t.engaged),
      warmLeads: s(t.warmLeads),
      apptBooked: s(t.apptBooked),
      overallPct: t.overallPct,
      connectRate: channel === 'sms' ? Math.min(99, Math.round(t.connectRate * 1.6)) : t.connectRate,
      optedOut: s(t.optedOut),
      avgCallDuration: t.avgCallDuration,
      avgTurnRateMinutes: t.avgTurnRateMinutes,
      failedCalls: s(t.failedCalls),
      exited: s(t.exited),
    }
  }, [extrasData, mult, channel])

  if (!extrasData || !m) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
        Analytics data is not available yet.
      </div>
    )
  }

  // Sparkline data: per-day cumulative engaged from dayWise (gives a proper trend feel)
  const trendValues = useMemo(() => {
    let acc = 0
    return extrasData.dayWise.map((d) => {
      acc += d.engaged
      return acc
    })
  }, [extrasData.dayWise])

  const funnel = [
    { key: 'enrolled', label: 'Enrolled', value: m.totalEnrolled, icon: Users },
    { key: 'contacted', label: 'Contacted', value: Math.round(m.totalEnrolled * (m.connectRate / 100)), icon: Phone },
    { key: 'engaged', label: 'Engaged', value: m.engaged, icon: MessageSquare },
    { key: 'warm', label: 'Warm', value: m.warmLeads, icon: Flame },
    { key: 'booked', label: 'Booked', value: m.apptBooked, icon: CalendarCheck },
  ]
  const funnelMax = funnel[0].value || 1

  const showSecondary = level !== 'glance'
  const showInsights = level === 'deep'
  const showDeepSections = level === 'deep'

  return (
    <div className="space-y-6">
      {/* Title + Filter strip */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {(title || subtitle) ? (
          <div>
            {title && <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: C.ink }}>{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm" style={{ color: C.muted }}>{subtitle}</p>}
          </div>
        ) : <div />}
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={dateRange}
            onChange={setDateRange}
            options={(Object.keys(DATE_LABELS) as DateRange[]).map((k) => ({ value: k, label: DATE_LABELS[k] }))}
          />
          <Segmented
            value={channel}
            onChange={setChannel}
            options={(Object.keys(CHANNEL_LABELS) as ChannelFilter[]).map((k) => ({
              value: k,
              label: CHANNEL_LABELS[k],
              icon: k === 'sms' ? <MessageSquare className="h-3 w-3" /> : k === 'call' ? <PhoneCall className="h-3 w-3" /> : null,
            }))}
          />
          {level === 'deep' && (
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[{ value: 'total', label: 'Total' }, { value: 'daywise', label: 'By day' }]}
            />
          )}
        </div>
      </div>

      {/* HERO BAND — always rendered */}
      <HeroBand
        overallPct={m.overallPct}
        period={DATE_LABELS[dateRange]}
        enrolled={m.totalEnrolled}
        engaged={m.engaged}
        warm={m.warmLeads}
        booked={m.apptBooked}
        trend={trendValues}
      />

      {/* FUNNEL — deep view only */}
      {showDeepSections && <Funnel stages={funnel} max={funnelMax} />}

      {/* SECONDARY KPIs */}
      {showSecondary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiTile
            icon={Phone}
            tone={C.info}
            label="Connect rate"
            value={`${m.connectRate}%`}
            visual={<Ring percent={m.connectRate} color={C.info} />}
          />
          <KpiTile
            icon={UserMinus}
            tone={C.muted}
            label="Opted out"
            value={m.optedOut.toLocaleString()}
            visual={<MiniPercentBar percent={pct(m.optedOut, m.engaged)} color={C.muted} label={`${pct(m.optedOut, m.engaged)}% of engaged`} />}
            onClick={onMetricFilter ? () => onMetricFilter(activeMetricFilter === 'optedOut' ? null : 'optedOut') : undefined}
            active={activeMetricFilter === 'optedOut'}
          />
          <KpiTile
            icon={LogOut}
            tone={C.warn}
            label="Exited"
            value={m.exited.toLocaleString()}
            visual={<MiniPercentBar percent={pct(m.exited, m.engaged)} color={C.warn} label={`${pct(m.exited, m.engaged)}% of engaged`} />}
            onClick={onMetricFilter ? () => onMetricFilter(activeMetricFilter === 'exited' ? null : 'exited') : undefined}
            active={activeMetricFilter === 'exited'}
          />
          {channel !== 'sms' && (
            <KpiTile
              icon={Clock}
              tone={C.brand}
              label="Avg. call duration"
              value={m.avgCallDuration}
              hint="connected calls"
            />
          )}
          {channel !== 'call' && (
            <KpiTile
              icon={Timer}
              tone="#0EA5E9"
              label="Avg. msg turn rate"
              value={`${m.avgTurnRateMinutes}m`}
              hint="time-to-reply"
            />
          )}
          {channel !== 'sms' && (
            <KpiTile
              icon={AlertTriangle}
              tone={C.bad}
              label="Failed calls"
              value={m.failedCalls.toLocaleString()}
              visual={<MiniPercentBar percent={pct(m.failedCalls, m.totalEnrolled)} color={C.bad} label={`${pct(m.failedCalls, m.totalEnrolled)}% of enrolled`} />}
              onClick={onMetricFilter ? () => onMetricFilter(activeMetricFilter === 'failedCalls' ? null : 'failedCalls') : undefined}
              active={activeMetricFilter === 'failedCalls'}
            />
          )}
        </div>
      )}

      {/* INSIGHT ROW */}
      {showInsights && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BestTimeInsight bestReach={extrasData.bestReach} />
          <BestChannelInsight bestReach={extrasData.bestReach} channelComparison={extrasData.channelComparison} />
          <TopObjectionInsight objections={extrasData.objections} mult={mult} />
        </div>
      )}

      {/* DEEP-only sections */}
      {showDeepSections && viewMode === 'daywise' && (
        <DaywiseTable rows={extrasData.dayWise} mult={mult} />
      )}

      {showDeepSections && viewMode === 'total' && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <NoInteractionCard
              voicemail={Math.round(extrasData.noInteraction.voicemail * mult)}
              noReply={Math.round(extrasData.noInteraction.noReply * mult)}
              disconnected={Math.round(extrasData.noInteraction.disconnected * mult)}
              total={Math.round(extrasData.noInteraction.total * mult)}
            />
            <ObjectionsCard objections={extrasData.objections} mult={mult} />
          </div>
          {smsData?.dailyStats && smsData.dailyStats.length > 0 && (
            <MultiDayChart dailyStats={smsData.dailyStats} mult={mult} />
          )}
          <ReplyHeatmap
            heatmap={extrasData.heatmap}
            days={extrasData.heatmapDays}
            hours={extrasData.heatmapHours}
          />
          <ChannelTable rows={extrasData.channelComparison} footnote={extrasData.channelFootnote} />
        </>
      )}
    </div>
  )
}

// ─── HERO BAND ──────────────────────────────────────────────────────────────

function HeroBand({
  overallPct,
  period,
  enrolled,
  engaged,
  warm,
  booked,
  trend,
}: {
  overallPct: number
  period: string
  enrolled: number
  engaged: number
  warm: number
  booked: number
  trend: number[]
}) {
  const stages = [
    { label: 'Enrolled', value: enrolled, ofPrev: null as number | null, icon: Users, color: C.brand },
    { label: 'Engaged', value: engaged, ofPrev: pct(engaged, enrolled), icon: MessageSquare, color: C.good },
    { label: 'Warm leads', value: warm, ofPrev: pct(warm, engaged), icon: Flame, color: '#F97316' },
    { label: 'Booked', value: booked, ofPrev: pct(booked, warm), icon: CalendarCheck, color: '#7C3AED' },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
        <div className="relative overflow-hidden border-b p-6 lg:border-b-0 lg:border-r" style={{ backgroundColor: C.surface, borderColor: C.line }}>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
            <Target className="h-3 w-3" />
            Overall conversion · {period}
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-[48px] font-bold leading-none tracking-tight tabular-nums" style={{ color: C.ink }}>
              {overallPct}
            </span>
            <span className="text-[22px] font-semibold leading-none" style={{ color: C.hint }}>%</span>
          </div>
          <div className="mt-3">
            <Sparkline values={trend} color={C.brand} height={36} />
          </div>
          <div className="mt-2 text-xs" style={{ color: C.muted }}>
            <span className="font-semibold" style={{ color: C.ink }}>{booked.toLocaleString()}</span> booked from {enrolled.toLocaleString()} enrolled
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {stages.map((s, i) => (
            <div
              key={s.label}
              className={`relative flex items-center gap-3 p-5 ${i < stages.length - 1 ? 'sm:border-r' : ''} ${i < 2 ? 'border-b sm:border-b-0' : ''}`}
              style={{ borderColor: C.rule }}
            >
              {s.ofPrev !== null ? (
                <RingWithIcon percent={s.ofPrev} color={s.color} icon={s.icon} />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: s.color + '14' }}>
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: C.muted }}>{s.label}</div>
                <div className="mt-0.5 text-[24px] font-bold leading-none tracking-tight tabular-nums" style={{ color: C.ink }}>
                  {s.value.toLocaleString()}
                </div>
                {s.ofPrev !== null && (
                  <div className="mt-1 text-[11px]" style={{ color: C.hint }}>
                    {s.ofPrev}% of previous
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── FUNNEL (deep view only) ────────────────────────────────────────────────

function Funnel({
  stages,
  max,
}: {
  stages: Array<{ key: string; label: string; value: number; icon: any }>
  max: number
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>Conversion funnel</h3>
          <p className="text-[11px]" style={{ color: C.muted }}>Customer journey from enrollment to booking</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: C.brandSoft, color: C.brand }}>
          <Zap className="h-3 w-3" />
          End-to-end {pct(stages[stages.length - 1].value, stages[0].value)}%
        </div>
      </div>
      {stages.map((s, i) => {
        const widthPct = (s.value / max) * 100
        const prev = i > 0 ? stages[i - 1].value : null
        const stepConv = prev ? Math.round((s.value / Math.max(prev, 1)) * 100) : null
        const dropped = prev ? prev - s.value : null
        const Icon = s.icon
        return (
          <div key={s.key}>
            {stepConv !== null && (
              <div className="ml-[140px] flex items-center gap-2 py-2">
                <span className="h-3 w-px" style={{ backgroundColor: C.line }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                  ↓ {stepConv}% pass
                </span>
                {dropped !== null && dropped > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: '#FEF2F2', color: C.bad }}>
                    −{dropped.toLocaleString()} dropped
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex w-[130px] flex-shrink-0 items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: C.brand + '14' }}>
                  <Icon className="h-4 w-4" style={{ color: C.brand }} />
                </div>
                <div className="text-right" style={{ width: '88px' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{s.label}</div>
                  <div className="text-[15px] font-bold leading-tight tabular-nums" style={{ color: C.ink }}>
                    {s.value.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="relative h-8 flex-1 overflow-hidden rounded-md" style={{ backgroundColor: C.surface }}>
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${C.brand} 0%, ${C.brand}dd 100%)`,
                    opacity: 1 - i * 0.12,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── KPI tile (with optional micro-visual) ──────────────────────────────────

function KpiTile({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  visual,
  onClick,
  active = false,
}: {
  icon: any
  tone: string
  label: string
  value: string
  hint?: string
  visual?: React.ReactNode
  onClick?: () => void
  active?: boolean
}) {
  const Tag: any = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative w-full rounded-xl border bg-white p-4 text-left transition-all ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      }`}
      style={{
        borderColor: active ? tone : C.line,
        boxShadow: active ? `0 0 0 1px ${tone}, 0 1px 2px rgba(16,24,40,0.04)` : undefined,
        backgroundColor: active ? tone + '08' : '#FFFFFF',
      }}
    >
      {active && (
        <span
          className="absolute right-2.5 top-2.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: tone, color: '#FFFFFF' }}
        >
          ✕ Clear
        </span>
      )}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: tone + '14' }}>
          <Icon className="h-3 w-3" style={{ color: tone }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{label}</span>
      </div>
      <div className="mt-2.5 text-[22px] font-bold leading-none tabular-nums" style={{ color: C.ink }}>{value}</div>
      {visual ? (
        <div className="mt-2.5">{visual}</div>
      ) : hint ? (
        <div className="mt-1.5 text-[11px]" style={{ color: C.hint }}>{hint}</div>
      ) : null}
    </Tag>
  )
}

// ─── INSIGHT CARDS (each visually distinct) ─────────────────────────────────

function BestTimeInsight({ bestReach }: { bestReach: AnalyticsExtrasData['bestReach'] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayMap: Record<string, number> = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }
  const peakIdx = dayMap[bestReach.bestDay] ?? 2
  // synthesize a smooth bell around the peak so the visualization tells the same story
  const heights = days.map((_, i) => {
    const dist = Math.abs(i - peakIdx)
    return Math.max(0.25, 1 - dist * 0.18)
  })
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <CardHeader icon={Clock} tone={C.brand} eyebrow="Best time to reach" />
      <div className="mt-3">
        <div className="flex items-baseline gap-2 text-[20px] font-bold tracking-tight" style={{ color: C.ink }}>
          {bestReach.bestDay}
          <span className="text-[14px] font-semibold" style={{ color: C.muted }}>· {bestReach.bestHour}</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: C.brandSoft, color: C.brand }}>
          {bestReach.bestReachRate}% reply rate at peak
        </div>
        {/* day-of-week mini bars */}
        <div className="mt-4 flex items-end gap-1.5">
          {days.map((d, i) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${heights[i] * 44}px`,
                  backgroundColor: i === peakIdx ? C.brand : C.line,
                }}
              />
              <span
                className="text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: i === peakIdx ? C.brand : C.hint }}
              >
                {d.slice(0, 1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BestChannelInsight({
  bestReach,
  channelComparison,
}: {
  bestReach: AnalyticsExtrasData['bestReach']
  channelComparison: AnalyticsExtrasData['channelComparison']
}) {
  // Pull engagement-rate row for the head-to-head viz
  const engRow = channelComparison.find((r) => r.metric.toLowerCase().includes('engagement')) || channelComparison[0]
  const smsNum = parseInt(engRow.sms.match(/\d+/)?.[0] || '0', 10)
  const callNum = parseInt(engRow.call.match(/\d+/)?.[0] || '0', 10)
  const max = Math.max(smsNum, callNum, 1)
  const winner = bestReach.bestChannel
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <CardHeader icon={Sparkles} tone={C.good} eyebrow="Best channel" />
      <div className="mt-3 flex items-baseline gap-2 text-[20px] font-bold tracking-tight" style={{ color: C.ink }}>
        {winner === 'SMS' ? <MessageSquare className="h-5 w-5" style={{ color: C.good }} /> : <PhoneCall className="h-5 w-5" style={{ color: C.info }} />}
        {winner}
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: '#ECFDF5', color: C.good }}>
          {bestReach.bestChannelEngagement}% engagement
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        <ChannelBar
          label="SMS"
          value={smsNum}
          max={max}
          icon={MessageSquare}
          color={C.good}
          isWinner={winner === 'SMS'}
        />
        <ChannelBar
          label="Call"
          value={callNum}
          max={max}
          icon={PhoneCall}
          color={C.info}
          isWinner={winner === 'Call'}
        />
      </div>
      <div className="mt-3 text-[11px]" style={{ color: C.muted }}>
        {bestReach.bestChannelReason}
      </div>
    </div>
  )
}

function ChannelBar({
  label,
  value,
  max,
  icon: Icon,
  color,
  isWinner,
}: {
  label: string
  value: number
  max: number
  icon: any
  color: string
  isWinner: boolean
}) {
  const w = (value / max) * 100
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: C.ink }}>
          <Icon className="h-3 w-3" style={{ color }} />
          {label}
        </div>
        <span className="text-[12px] font-semibold tabular-nums" style={{ color: isWinner ? color : C.muted }}>
          {value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: C.rule }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${w}%`, backgroundColor: color, opacity: isWinner ? 1 : 0.45 }}
        />
      </div>
    </div>
  )
}

function TopObjectionInsight({
  objections,
  mult,
}: {
  objections: AnalyticsExtrasData['objections']
  mult: number
}) {
  const top = objections[0]
  if (!top) return null
  const count = Math.round(top.count * mult)
  const r = 26
  const c = 2 * Math.PI * r
  const filled = (top.resolutionRate / 100) * c
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <CardHeader icon={AlertTriangle} tone={top.color} eyebrow="Top objection" />
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[80px] w-[80px] flex-shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke={C.rule} strokeWidth="9" />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke={top.color}
              strokeWidth="9"
              strokeDasharray={`${filled} ${c - filled}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[16px] font-bold leading-none tabular-nums" style={{ color: C.ink }}>
              {top.resolutionRate}%
            </div>
            <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>resolved</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-bold leading-tight" style={{ color: C.ink }}>{top.label}</div>
          <div className="mt-1 text-[12px]" style={{ color: C.muted }}>
            <span className="font-semibold tabular-nums" style={{ color: C.ink }}>{count}</span> mentions
          </div>
          <div className="mt-2 text-[11px]" style={{ color: C.hint }}>
            #2 next: {objections[1]?.label || '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

function CardHeader({
  icon: Icon,
  tone,
  eyebrow,
}: {
  icon: any
  tone: string
  eyebrow: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: tone + '14' }}>
        <Icon className="h-3 w-3" style={{ color: tone }} />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: C.muted }}>
        {eyebrow}
      </span>
    </div>
  )
}

// ─── Segmented control ──────────────────────────────────────────────────────

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>
}) {
  return (
    <div className="inline-flex rounded-lg border bg-white p-0.5" style={{ borderColor: C.line }}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Sparkline (reusable) ───────────────────────────────────────────────────

function Sparkline({ values, color, height = 32 }: { values: number[]; color: string; height?: number }) {
  if (values.length === 0) return null
  const W = 240
  const H = height
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const xStep = W / Math.max(values.length - 1, 1)
  const yFor = (v: number) => H - ((v - min) / range) * H
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * xStep} ${yFor(v)}`).join(' ')
  const area = `${line} L ${(values.length - 1) * xStep} ${H} L 0 ${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={line} stroke={color} strokeWidth="1.6" fill="none" />
      <circle cx={(values.length - 1) * xStep} cy={yFor(values[values.length - 1])} r="2.5" fill={color} />
    </svg>
  )
}

// ─── Ring with icon (used in headline strip stage cells) ────────────────────

function RingWithIcon({ percent, color, icon: Icon }: { percent: number; color: string; icon: any }) {
  const r = 20
  const c = 2 * Math.PI * r
  const filled = (Math.min(percent, 100) / 100) * c
  return (
    <div className="relative h-12 w-12 flex-shrink-0">
      <svg viewBox="0 0 50 50" className="h-full w-full -rotate-90">
        <circle cx="25" cy="25" r={r} fill="none" stroke={C.rule} strokeWidth="4" />
        <circle
          cx="25"
          cy="25"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${filled} ${c - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
    </div>
  )
}

function Ring({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-7 w-7">
        <svg viewBox="0 0 30 30" className="h-full w-full -rotate-90">
          <circle cx="15" cy="15" r="12" fill="none" stroke={C.rule} strokeWidth="3" />
          <circle
            cx="15"
            cy="15"
            r="12"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(Math.min(percent, 100) / 100) * (2 * Math.PI * 12)} ${2 * Math.PI * 12}`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-[11px]" style={{ color: C.hint }}>{percent}%</span>
    </div>
  )
}

function MiniPercentBar({ percent, color, label }: { percent: number; color: string; label: string }) {
  return (
    <div>
      <div className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: C.rule }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }} />
      </div>
      <div className="mt-1.5 text-[11px]" style={{ color: C.hint }}>{label}</div>
    </div>
  )
}

// ─── No interaction (donut) ─────────────────────────────────────────────────

function NoInteractionCard({
  voicemail,
  noReply,
  disconnected,
  total,
}: {
  voicemail: number
  noReply: number
  disconnected: number
  total: number
}) {
  const items = [
    { label: 'Voicemail', value: voicemail, color: C.warn, icon: Voicemail },
    { label: 'No reply', value: noReply, color: C.muted, icon: MessageCircleOff },
    { label: 'Disconnected', value: disconnected, color: C.bad, icon: PhoneOff },
  ]
  const safe = Math.max(total, 1)
  const r = 38
  const c = 2 * Math.PI * r
  let off = 0
  const segs = items.map((it) => {
    const len = (it.value / safe) * c
    const seg = { ...it, dash: `${len} ${c - len}`, off: -off }
    off += len
    return seg
  })

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="mb-4 flex items-center justify-between">
        <CardHeader icon={MessageCircleOff} tone={C.muted} eyebrow="No interaction" />
        <span className="text-[11px]" style={{ color: C.muted }}>Why we couldn&apos;t reach</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative h-[124px] w-[124px] flex-shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke={C.rule} strokeWidth="11" />
            {segs.map((s) => (
              <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="11"
                strokeDasharray={s.dash} strokeDashoffset={s.off} />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[20px] font-bold leading-none tabular-nums" style={{ color: C.ink }}>{total.toLocaleString()}</div>
            <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Total</div>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {items.map((it) => {
            const p = Math.round((it.value / safe) * 100)
            const ItemIcon = it.icon
            return (
              <div key={it.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-3.5 w-3.5" style={{ color: it.color }} />
                  <span className="text-[12px] font-medium" style={{ color: C.ink }}>{it.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] tabular-nums">
                  <span className="font-semibold" style={{ color: C.ink }}>{it.value.toLocaleString()}</span>
                  <span className="w-8 text-right" style={{ color: C.hint }}>{p}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Top objections — split bar (resolved / unresolved) ─────────────────────

function ObjectionsCard({
  objections,
  mult,
}: {
  objections: AnalyticsExtrasData['objections']
  mult: number
}) {
  const scaled = objections.map((o) => ({ ...o, count: Math.round(o.count * mult) }))
  const max = Math.max(...scaled.map((o) => o.count), 1)
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="mb-4 flex items-center justify-between">
        <CardHeader icon={AlertTriangle} tone={C.bad} eyebrow="Top objections" />
        <span className="text-[11px]" style={{ color: C.muted }}>filled = resolved</span>
      </div>
      <div className="space-y-3.5">
        {scaled.map((o, i) => {
          const totalW = (o.count / max) * 100
          const resolvedW = (o.resolutionRate / 100) * totalW
          return (
            <div key={o.label}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold" style={{ backgroundColor: C.rule, color: C.muted }}>
                    {i + 1}
                  </span>
                  <span className="font-medium" style={{ color: C.ink }}>{o.label}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-semibold" style={{ color: C.ink }}>{o.count}</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: o.color + '14', color: o.color }}>
                    {o.resolutionRate}% resolved
                  </span>
                </div>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full" style={{ backgroundColor: C.rule }}>
                <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${totalW}%`, backgroundColor: o.color, opacity: 0.25 }} />
                <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${resolvedW}%`, backgroundColor: o.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day-wise table ─────────────────────────────────────────────────────────

function DaywiseTable({ rows, mult }: { rows: AnalyticsExtrasData['dayWise']; mult: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="border-b px-6 py-4" style={{ borderColor: C.rule }}>
        <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>By day</h3>
        <p className="text-[11px]" style={{ color: C.muted }}>Per-day funnel movement</p>
      </div>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: C.surface }}>
            <Th>Day</Th>
            <Th align="right">Enrolled</Th>
            <Th align="right">Contacted</Th>
            <Th align="right">Engaged</Th>
            <Th align="right">Booked</Th>
            <Th align="right">Reply rate</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.day} className="border-t" style={{ borderColor: C.rule }}>
              <td className="px-6 py-3 text-[13px] font-semibold" style={{ color: C.ink }}>{r.label}</td>
              <Td>{Math.round(r.enrolled * mult).toLocaleString()}</Td>
              <Td>{Math.round(r.contacted * mult).toLocaleString()}</Td>
              <Td>{Math.round(r.engaged * mult).toLocaleString()}</Td>
              <Td bold accent={C.brand}>{Math.round(r.booked * mult).toLocaleString()}</Td>
              <td className="px-6 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <div className="h-1 w-16 overflow-hidden rounded-full" style={{ backgroundColor: C.rule }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(r.replyRate * 2, 100)}%`, backgroundColor: C.good }} />
                  </div>
                  <span className="w-10 text-[13px] font-semibold tabular-nums" style={{ color: C.ink }}>{r.replyRate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-6 py-2.5 text-${align} text-[10px] font-semibold uppercase tracking-wider`} style={{ color: C.muted }}>
      {children}
    </th>
  )
}
function Td({
  children,
  bold = false,
  accent,
}: {
  children: React.ReactNode
  bold?: boolean
  accent?: string
}) {
  return (
    <td
      className={`px-6 py-3 text-right text-[13px] tabular-nums ${bold ? 'font-semibold' : ''}`}
      style={{ color: accent || C.ink }}
    >
      {children}
    </td>
  )
}

// ─── Multi-day reply effectiveness (line + dots + per-day chips) ────────────

function MultiDayChart({
  dailyStats,
  mult,
}: {
  dailyStats: SmsOverviewData['dailyStats']
  mult: number
}) {
  const data = dailyStats.map((d) => ({
    day: d.day,
    sent: Math.round(d.sent * mult),
    replies: Math.round(d.replies * mult),
    rate: Math.abs(d.replyRate),
  }))
  const W = 720
  const H = 200
  const PADX = 40
  const PADY = 28
  const innerW = W - PADX * 2
  const innerH = H - PADY * 2
  const maxRate = Math.max(...data.map((d) => d.rate), 10) * 1.2
  const xStep = innerW / Math.max(data.length - 1, 1)
  const yFor = (v: number) => PADY + innerH - (v / maxRate) * innerH

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${PADX + i * xStep} ${yFor(d.rate)}`).join(' ')
  const area = `${line} L ${PADX + (data.length - 1) * xStep} ${PADY + innerH} L ${PADX} ${PADY + innerH} Z`

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CardHeader icon={TrendingUp} tone={C.brand} eyebrow="Multi-day reply effectiveness" />
        </div>
        <span className="text-[11px]" style={{ color: C.muted }}>Reply rate by outreach day</span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full min-w-[520px]">
          <defs>
            <linearGradient id="md-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={C.brand} stopOpacity="0.18" />
              <stop offset="100%" stopColor={C.brand} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = PADY + innerH * (1 - t)
            return (
              <g key={t}>
                <line x1={PADX} x2={W - PADX} y1={y} y2={y} stroke={C.rule} />
                <text x={PADX - 8} y={y + 3} textAnchor="end" style={{ fontSize: 9, fill: C.hint, fontWeight: 600 }}>
                  {Math.round(maxRate * t)}%
                </text>
              </g>
            )
          })}
          <path d={area} fill="url(#md-grad)" />
          <path d={line} stroke={C.brand} strokeWidth="2" fill="none" />
          {data.map((d, i) => {
            const x = PADX + i * xStep
            const y = yFor(d.rate)
            return (
              <g key={d.day}>
                <circle cx={x} cy={y} r="4" fill={C.brand} stroke="white" strokeWidth="2" />
                <text x={x} y={y - 12} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: C.ink }}>
                  {d.rate.toFixed(1)}%
                </text>
                <text x={x} y={H - 8} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: C.muted }}>
                  Day {d.day}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ─── Reply heatmap ──────────────────────────────────────────────────────────

function ReplyHeatmap({
  heatmap,
  days,
  hours,
}: {
  heatmap: number[][]
  days: string[]
  hours: string[]
}) {
  const max = Math.max(...heatmap.flat(), 1)
  const color = (val: number) => {
    if (val === 0) return C.rule
    const t = val / max
    if (t < 0.25) return '#E0E7FF'
    if (t < 0.5) return '#A5B4FC'
    if (t < 0.75) return '#6366F1'
    return '#4338CA'
  }
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="mb-4 flex items-center justify-between">
        <CardHeader icon={Clock} tone="#4338CA" eyebrow="When customers reply" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium" style={{ color: C.hint }}>Less</span>
          {[C.rule, '#E0E7FF', '#A5B4FC', '#6366F1', '#4338CA'].map((c, i) => (
            <div key={i} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] font-medium" style={{ color: C.hint }}>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-[5px]">
          <div className="flex flex-col gap-[5px] pr-2">
            {days.map((d, i) => (
              <div key={i} className="flex h-[20px] items-center justify-end">
                <span className="text-[10px] font-semibold leading-none" style={{ color: C.muted }}>{d}</span>
              </div>
            ))}
          </div>
          {hours.map((hour, hi) => (
            <div key={hi} className="flex flex-col gap-[5px]">
              {heatmap.map((row, di) => {
                const val = row[hi]
                return (
                  <div
                    key={di}
                    className="group relative h-[20px] w-[20px] cursor-default rounded-[4px] transition-transform hover:scale-110"
                    style={{ backgroundColor: color(val) }}
                  >
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {val}% — {days[di]} {hour}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex" style={{ paddingLeft: 30 }}>
          {hours.map((h, i) => (
            <span key={i} className="text-[9px] font-semibold" style={{ width: 25, textAlign: 'center', color: C.hint }}>
              {i % 2 === 0 ? h : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Channel comparison ─────────────────────────────────────────────────────

function ChannelTable({
  rows,
  footnote,
}: {
  rows: AnalyticsExtrasData['channelComparison']
  footnote: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ borderColor: C.line }}>
      <div className="mb-4">
        <CardHeader icon={Sparkles} tone={C.good} eyebrow="SMS vs Call" />
        <p className="mt-1 text-[11px]" style={{ color: C.muted }}>Head-to-head channel comparison</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: C.rule }}>
            <th className="py-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Metric</th>
            <th className="py-2 px-4 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
              <span className="inline-flex items-center justify-end gap-1.5">
                <MessageSquare className="h-3 w-3" style={{ color: C.good }} />
                SMS
              </span>
            </th>
            <th className="py-2 px-4 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
              <span className="inline-flex items-center justify-end gap-1.5">
                <PhoneCall className="h-3 w-3" style={{ color: C.info }} />
                Call
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metric} className="border-b last:border-0" style={{ borderColor: C.rule }}>
              <td className="py-3 pr-4 text-[13px] font-medium" style={{ color: C.ink }}>{r.metric}</td>
              <td className={`py-3 px-4 text-right text-[13px] tabular-nums ${r.smsHighlight ? 'font-semibold' : ''}`}
                  style={{ color: r.smsHighlight ? '#065F46' : '#475569' }}>
                {r.sms}
              </td>
              <td className={`py-3 px-4 text-right text-[13px] tabular-nums ${r.callHighlight ? 'font-semibold' : ''}`}
                  style={{ color: r.callHighlight ? '#1E40AF' : '#475569' }}>
                {r.call}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {footnote && <p className="mt-3 text-[11px]" style={{ color: C.hint }}>{footnote}</p>}
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / Math.max(total, 1)) * 100)
}
