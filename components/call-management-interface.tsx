"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircularProgress } from "@/components/ui/circular-progress"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, UserPlus, Clock, Users, AlertCircle, Pause, Play } from "lucide-react"
import { toProperCase } from "@/lib/utils"

interface ActiveCall {
  id: string
  customerName: string
  customerPhone: string
  duration: number
  status: "ringing" | "active" | "hold" | "transferring"
  intent: string
  sentiment: "positive" | "neutral" | "negative"
  aiScore: number
  agent: string
  vehicle?: {
    year?: number
    make?: string
    model?: string
    trim?: string
    vin?: string
  }
}

interface QueuedCall {
  id: string
  customerName: string
  customerPhone: string
  waitTime: number
  priority: "high" | "medium" | "low"
  intent: string
  vehicle?: {
    year?: number
    make?: string
    model?: string
    trim?: string
    vin?: string
  }
}

interface Agent {
  id: string
  name: string
  status: "available" | "busy" | "break" | "offline"
  currentCall?: string
  callsToday: number
}

export function CallManagementInterface() {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>({
    id: "call_001",
    customerName: "Manan Chawla",
    customerPhone: "+1 (555) 123-4567",
    duration: 127,
    status: "active",
    intent: "schedule_appointment",
    sentiment: "positive",
    aiScore: 8.5,
    agent: "Kylie",
    vehicle: {
      year: 2022,
      make: "Honda",
      model: "Civic",
      trim: "EX",
      vin: "1HGBH41JXMN109186"
    }
  })

  const [callQueue] = useState<QueuedCall[]>([
    {
      id: "queue_001",
      customerName: "Mike Davis",
      customerPhone: "+1 (555) 987-6543",
      waitTime: 45,
      priority: "high",
      intent: "service_inquiry",
      vehicle: {
        year: 2020,
        make: "Toyota",
        model: "Camry",
        trim: "LE"
      }
    },
    {
      id: "queue_002",
      customerName: "",
      customerPhone: "+1 (555) 456-7890",
      waitTime: 23,
      priority: "medium",
      intent: "unknown",
    },
    {
      id: "queue_003", 
      customerName: "",
      customerPhone: "",
      waitTime: 45,
      priority: "low",
      intent: "general_inquiry",
    },
  ])

  const [agents] = useState<Agent[]>([
    { id: "agent_001", name: "Kylie", status: "busy", currentCall: "call_001", callsToday: 12 },
    { id: "agent_002", name: "Sophia", status: "available", callsToday: 8 },
    { id: "agent_003", name: "Marcus", status: "break", callsToday: 15 },
    { id: "agent_004", name: "Emma", status: "available", callsToday: 6 },
  ])

  const [isMuted, setIsMuted] = useState(false)
  const [isOnHold, setIsOnHold] = useState(false)
  const [callNotes, setCallNotes] = useState("")
  const [selectedOutcome, setSelectedOutcome] = useState("")

  useEffect(() => {
    if (activeCall && activeCall.status === "active") {
      const timer = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [activeCall])

  const formatDuration = (seconds: number) => {
    // Round to avoid floating point precision issues
    const totalSeconds = Math.round(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleEndCall = () => {
    setActiveCall(null)
    setCallNotes("")
    setSelectedOutcome("")
  }

  const handleTransferCall = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, status: "transferring" })
    }
  }

  const handleAnswerNext = () => {
    if (callQueue.length > 0) {
      const nextCall = callQueue[0]
      setActiveCall({
        id: nextCall.id,
        customerName: nextCall.customerName,
        customerPhone: nextCall.customerPhone,
        duration: 0,
        status: "active",
        intent: nextCall.intent,
        sentiment: "neutral",
        aiScore: 0,
        agent: "Kylie",
        vehicle: nextCall.vehicle,
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-red-100 text-red-800"
      case "break":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 page-container min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Active Call Panel */}
      <div className="lg:col-span-2 space-y-6">
        {activeCall ? (
          <Card className="card-surface" style={{ backgroundColor: 'rgba(70, 0, 242, 0.05)', border: '1px solid rgba(70, 0, 242, 0.2)' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-subheading font-medium" style={{ color: 'var(--primary)' }}>
                  <PhoneCall className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  Active Call
                </CardTitle>
                <Badge variant="outline" className="px-3 py-1 text-small rounded-xl-custom" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderColor: 'var(--success)' }}>
                  {activeCall.status === "active" ? "Connected" : activeCall.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-page-heading" style={{ color: 'var(--text-primary)' }}>
                    {toProperCase(activeCall.customerName) || activeCall.customerPhone || "Web Call"}
                  </h3>
                  {activeCall.vehicle && (activeCall.vehicle.year || activeCall.vehicle.make || activeCall.vehicle.model) && (
                    <p className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                      {activeCall.vehicle.year} {activeCall.vehicle.make} {activeCall.vehicle.model} {activeCall.vehicle.trim}
                    </p>
                  )}
                  <p className="text-body" style={{ color: 'var(--text-secondary)' }}>{activeCall.customerPhone}</p>
                  <p className="text-small" style={{ color: 'var(--text-secondary)' }}>Intent: {activeCall.intent.replace(/_/g, " ")}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Call Duration</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{formatDuration(activeCall.duration)}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <CircularProgress
                      value={activeCall.aiScore * 10}
                      size={60}
                      strokeWidth={5}
                      showValue={true}
                      valueClassName="text-gray-900"
                      animationDuration={1000}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="btn-small"
                  style={{ 
                    backgroundColor: isMuted ? 'var(--error)' : 'transparent',
                    borderColor: isMuted ? 'var(--error)' : 'var(--border-color)',
                    color: isMuted ? 'white' : 'var(--text-primary)'
                  }}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-small"
                  style={{ 
                    backgroundColor: isOnHold ? 'var(--secondary)' : 'transparent',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => setIsOnHold(!isOnHold)}
                >
                  {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isOnHold ? "Resume" : "Hold"}
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-small"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  onClick={handleTransferCall}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Transfer
                </Button>
                <Button 
                  className="btn-small text-white"
                  style={{ backgroundColor: 'var(--error)' }}
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-4 w-4 mr-1" />
                  End Call
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <label className="text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>Call Notes</label>
                  <Textarea
                    placeholder="Add notes about this call..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="mt-2 input-field text-body"
                  />
                </div>
                <div>
                  <label className="text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>Call Outcome</label>
                  <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
                    <SelectTrigger className="mt-2 input-field">
                      <SelectValue placeholder="Select outcome..." />
                    </SelectTrigger>
                    <SelectContent className="card-surface">
                      <SelectItem value="appointment_scheduled">Appointment Scheduled</SelectItem>
                      <SelectItem value="info_provided">Information Provided</SelectItem>
                      <SelectItem value="callback_requested">Callback Requested</SelectItem>
                      <SelectItem value="transferred_to_human">Transferred to Human</SelectItem>
                      <SelectItem value="no_resolution">No Resolution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-surface">
            <CardContent className="p-0">
              <EmptyState
                icon={Phone}
                title="No Active Call"
                description="Ready to take the next call"
                action={callQueue.length > 0 ? {
                  label: "Answer Next Call",
                  variant: "default",
                  onClick: handleAnswerNext
                } : undefined}
                className="py-8"
              />
            </CardContent>
          </Card>
        )}

        {/* Call Queue */}
        <Card className="card-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>
              <Clock className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              Call Queue ({callQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {callQueue.length > 0 ? (
              <div className="space-y-3">
                {callQueue.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-4 rounded-lg-custom" style={{ border: '1px solid var(--border-color)' }}>
                    <div>
                      <div className="text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>
                        {toProperCase(call.customerName) || call.customerPhone || "Web Call"}
                      </div>
                      {call.vehicle && (call.vehicle.year || call.vehicle.make || call.vehicle.model) && (
                        <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                          {call.vehicle.year} {call.vehicle.make} {call.vehicle.model} {call.vehicle.trim}
                        </div>
                      )}
                      <div className="text-body" style={{ color: 'var(--text-secondary)' }}>{call.customerPhone}</div>
                      <div className="text-small" style={{ color: 'var(--text-secondary)' }}>Intent: {call.intent.replace(/_/g, " ")}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`px-3 py-1 text-small rounded-xl-custom ${getPriorityColor(call.priority)}`}>{call.priority}</Badge>
                      <div className="text-body" style={{ color: 'var(--text-secondary)' }}>Wait: {call.waitTime}s</div>
                      <Button size="sm" variant="outline" className="btn-small" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                        <PhoneCall className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-body" style={{ color: 'var(--text-secondary)' }}>No calls in queue</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Panel */}
      <div className="space-y-6">
        <Card className="card-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>
              <Users className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 rounded-lg-custom" style={{ border: '1px solid var(--border-color)' }}>
                  <div>
                    <div className="text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div className="text-body" style={{ color: 'var(--text-secondary)' }}>{agent.callsToday} calls today</div>
                  </div>
                  <Badge className={`px-3 py-1 text-small rounded-xl-custom ${getStatusColor(agent.status)}`}>{agent.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-surface">
          <CardHeader>
            <CardTitle className="text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Calls Today</span>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Total Handled</div>
                <span className="text-body font-semibold" style={{ color: 'var(--text-primary)' }}>41</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Avg Wait Time</span>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Customer Wait</div>
                <span className="text-body font-semibold" style={{ color: 'var(--text-primary)' }}>34s</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Appointments Set</span>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Successfully Booked</div>
                <span className="text-body font-semibold" style={{ color: 'var(--success)' }}>12</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Conversion Rate</span>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Calls to Appointments</div>
                <span className="text-body font-semibold" style={{ color: 'var(--success)' }}>29%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-subheading font-medium" style={{ color: 'var(--text-primary)' }}>
              <AlertCircle className="h-5 w-5" style={{ color: 'var(--warning)' }} />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg-custom" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}>
                <AlertCircle className="h-4 w-4 mt-0.5" style={{ color: 'var(--warning)' }} />
                <div className="text-body">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>High wait time</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Queue wait time exceeds 60s</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg-custom" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle className="h-4 w-4 mt-0.5" style={{ color: 'var(--error)' }} />
                <div className="text-body">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Negative sentiment call</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Call #call_003 needs attention</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
