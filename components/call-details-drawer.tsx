import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { CircularProgress } from "@/components/ui/circular-progress"
import { getCustomerDisplayName, getCustomerDisplayPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Phone, Car, User, FileText, Tag, Clock, X, Mail, Truck, MapPin, Flag, AlertCircle, CheckCircle, Play, Download } from "lucide-react"
import type { CallRecord } from "@/types/call-record"

interface CallDetailsDrawerProps {
  call: CallRecord | null
  open: boolean
  onClose: () => void
}

export function CallDetailsDrawer({ call, open, onClose }: CallDetailsDrawerProps) {
  if (!call) return null

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (seconds: number) => {
    // Round to avoid floating point precision issues
    const totalSeconds = Math.round(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeAgo = (call: CallRecord) => {
    const now = new Date()
    const callTime = new Date(call.started_at)
    const diffInMinutes = Math.floor((now.getTime() - callTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <div>
      {/* Modern Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}
      
      {/* Modern Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl transform transition-all duration-300 ease-out z-50 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ maxWidth: '38.4rem' }}
      >
        <div className="h-full flex flex-col">
          {/* Simple Header without Background */}
          <div className="flex-shrink-0 border-b border-gray-200">
            <div className="px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header Icon and Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Flag className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">Call Details</h1>
                      <p className="text-sm text-gray-500">Review call information and metrics</p>
                    </div>
                  </div>
                  
                  {/* Call Status Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      variant="outline" 
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-50 text-gray-700 border-gray-300"
                    >
                      {call.direction.charAt(0).toUpperCase() + call.direction.slice(1)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-50 text-gray-700 border-gray-300"
                    >
                      {formatDuration(call.metrics.duration_sec)}
                    </Badge>
                  </div>
                  
                  {/* Call Metadata */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{getTimeAgo(call)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>Agent: {call.agentInfo?.agentName || call.agentConfig?.agentName || 'AI Agent'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Close Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-8 py-6">
              {/* Tab Navigation */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
                  <TabsTrigger value="actions" className="text-sm">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Call Context Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Call Context</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Call Summary</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(call.started_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{call.summary}</p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-center">
                          <CircularProgress
                            value={call.ai_score * 10}
                            size={80}
                            strokeWidth={6}
                            showValue={true}
                            valueClassName="text-gray-900"
                            animationDuration={1200}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              call.containment ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}>
                              <span className="text-white text-xs font-bold">
                                {call.containment ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Contained</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {call.containment ? "Yes" : "No"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Customer Information</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</div>
                            <div className="text-sm font-medium text-gray-900">
                              {getCustomerDisplayName(call)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                            <div className={`text-sm font-medium ${getCustomerDisplayPhone(call) !== "Called from Web" ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                              {getCustomerDisplayPhone(call)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</div>
                            <div className="text-sm font-medium text-gray-900">
                              {call.customer.email || "Not provided"}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Car className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vehicle</div>
                            <div className="text-sm font-medium text-gray-900">
                              {call.vehicle.make && call.vehicle.year 
                                ? `${call.vehicle.year} ${call.vehicle.make} ${call.vehicle.model || ''} ${call.vehicle.trim || ''}`.trim()
                                : call.vehicle.vin 
                                ? `VIN: ${call.vehicle.vin}`
                                : "No vehicle information provided"
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Call Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Started</div>
                            <div className="text-sm font-medium text-gray-900">{formatDateTime(call.started_at)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Tag className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Intent</div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{call.primary_intent.replace(/_/g, " ")}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Tag className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outcome</div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{call.outcome.replace(/_/g, " ")}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</div>
                            <div className="text-sm font-medium text-gray-900">{call.metrics.duration_sec}s</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {call.tags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {call.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs bg-gray-100 text-gray-700 border-gray-200 px-2 py-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-6">
                  {/* Available Actions */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Available Actions</h3>
                    <div className="space-y-3">
                      {call.recording_url && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-12"
                        >
                          <Play className="h-4 w-4 mr-3" />
                          Play Recording
                        </Button>
                      )}
                      {call.transcript_url && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-12"
                        >
                          <FileText className="h-4 w-4 mr-3" />
                          View Transcript
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-12"
                      >
                        <Download className="h-4 w-4 mr-3" />
                        Download Call Data
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-10"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-10"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Back
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
