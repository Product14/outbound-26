'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Settings, Clock, MessageSquare, PhoneOff, Upload, Save } from 'lucide-react'

interface SettingsTabProps {
  campaignId: string
  campaignName: string
}

export function SettingsTab({ campaignId, campaignName }: SettingsTabProps) {
  const [quietStart, setQuietStart] = useState('09:00')
  const [quietEnd, setQuietEnd] = useState('21:00')
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [smsOnly, setSmsOnly] = useState(false)
  const [day1, setDay1] = useState(
    `Hi {first_name}, this is Vini from {dealership}. I noticed you were looking at the {vehicle} a while back — are you still in the market? Reply here and I can help! Reply STOP to opt out.`
  )
  const [day2, setDay2] = useState(
    `Hey {first_name}, just following up on the {vehicle}. We have some new offers this week that might interest you. Want to hear more?`
  )
  const [day3, setDay3] = useState(
    `{first_name}, last check-in about the {vehicle}. If you'd like to chat, just reply here or I can give you a quick call. No pressure either way!`
  )

  const save = () => {
    // Mock save — in real app would persist via API
    // eslint-disable-next-line no-console
    console.log('Save settings for', campaignId, {
      quietStart, quietEnd, maxAttempts, smsOnly, day1, day2, day3,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardContent className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
              <Settings className="h-5 w-5 text-[#7C3AED]" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Campaign Settings</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">
                Edit the running campaign &ldquo;{campaignName}&rdquo; — changes apply to future messages. In-flight
                conversations continue as-is.
              </p>
            </div>
          </div>
          <Button onClick={save} className="bg-[#4600F2] hover:bg-[#3700C2] text-white flex-shrink-0">
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Message Schedule */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#10B981]" />
            Message Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-5">
          {[
            { day: 1, value: day1, set: setDay1, required: true  },
            { day: 2, value: day2, set: setDay2, required: false },
            { day: 3, value: day3, set: setDay3, required: false },
          ].map(({ day, value, set, required }) => {
            const chars = value.length
            const segments = Math.max(1, Math.ceil(chars / 160))
            const segColor =
              chars <= 160 ? 'text-[#10B981]' :
              chars <= 320 ? 'text-[#CA8A04]' :
              chars <= 480 ? 'text-[#F97316]' : 'text-[#EF4444]'
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-[#1A1A1A]">
                    Day {day}{required ? '' : ' (optional)'}
                  </Label>
                  <span className={`text-xs font-medium ${segColor}`}>
                    {chars} chars · {segments} segment{segments > 1 ? 's' : ''}
                  </span>
                </div>
                <Textarea
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* SMS Quiet Hours */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#F59E0B]" />
            SMS Quiet Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-[#6B7280] mb-4">
            No outbound SMS will be sent outside of these hours (lead&apos;s local timezone, derived from zip).
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">No SMS Before</Label>
              <Input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">No SMS After</Label>
              <Input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Rules */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <PhoneOff className="h-4 w-4 text-[#EF4444]" />
            Call Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-semibold text-[#1A1A1A]">SMS-only mode</Label>
              <p className="text-xs text-[#6B7280] mt-0.5">Disable all call-based follow-up for this campaign</p>
            </div>
            <Switch checked={smsOnly} onCheckedChange={setSmsOnly} />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Max Retry Attempts</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="mt-1 max-w-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add more leads */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#4600F2]" />
            Add More Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-[#6B7280] mb-4">
            Upload an additional CSV or pull more leads from your CRM to enroll them in this running campaign.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="text-sm">
              <Upload className="h-4 w-4 mr-2" /> Upload CSV
            </Button>
            <Button variant="outline" className="text-sm">
              Pull from CRM
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
