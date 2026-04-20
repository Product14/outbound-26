'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Clock, Activity, Users, AlertCircle, Calendar, CheckCircle, X, Mail, MapPin, ChevronUp, Star, BarChart2, Car } from 'lucide-react'
import { LiveCallChip } from "@/components/ui/live-call-chip"

interface CallDetailsSidebarProps {
  isOpen: boolean
  selectedCall: any
  callDetailsTab: string
  isCallInProgress: (call: any) => boolean
  formatDate: (date: string) => string
  formatTimer: (time: number) => string
  callTimer: number
  onClose: () => void
  onTabChange: (tab: string) => void
}

export function CallDetailsSidebar({
  isOpen,
  selectedCall,
  callDetailsTab,
  isCallInProgress,
  formatDate,
  formatTimer,
  callTimer,
  onClose,
  onTabChange
}: CallDetailsSidebarProps) {
  if (!selectedCall) return null

  return (
    <div className={`fixed right-0 top-0 h-full w-[480px] bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="overflow-y-auto h-full p-6">
        <>
          {/* ── Contact header ── */}
          <div className="border-b pb-5 mb-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-[10px] bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-white">
                  {(typeof selectedCall.customer === 'string'
                    ? selectedCall.customer
                    : selectedCall.customer?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">
                  {typeof selectedCall.customer === 'string' ? selectedCall.customer : selectedCall.customer?.name || 'Customer'}
                </h2>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  Last Interacted at {formatDate(selectedCall.callTime)}
                </p>
              </div>
              {isCallInProgress(selectedCall) && (
                <div className="ml-auto">
                  <LiveCallChip size="sm" />
                </div>
              )}
            </div>

            {/* Customer Highlights */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Star className="w-4 h-4 text-gray-400" />
                <span className="text-[13px] font-semibold text-gray-700">Customer Highlights</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Upcoming Appointments */}
                <div className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 leading-tight">Upcoming Appointments</span>
                    <Calendar className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                  {selectedCall.appointment === 'Yes' || selectedCall.outcome === 'appointment set' || selectedCall.outcome?.toLowerCase().includes('appointment') ? (
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">Monday 8AM</p>
                      <button className="text-[11px] text-gray-400 underline underline-offset-2 mt-0.5 text-left">View Appointment</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">Not Available</p>
                      <button className="text-[11px] text-gray-400 underline underline-offset-2 mt-0.5 text-left">Schedule Appointment</button>
                    </div>
                  )}
                </div>

                {/* Lead Stage */}
                <div className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 leading-tight">Lead Stage</span>
                    <BarChart2 className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-base">😊</span>
                      <p className="text-[13px] font-bold text-gray-900 uppercase">
                        {selectedCall.leadStage || 'New Lead'}
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Updated: {formatDate(selectedCall.callTime)}
                    </p>
                  </div>
                </div>

                {/* Vehicle of Interest */}
                <div className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 leading-tight">Vehicle of Interest</span>
                    <Car className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                  <div>
                    {selectedCall.vehicleInfo ? (
                      <p className="text-[13px] font-bold text-gray-900">
                        {selectedCall.vehicleInfo.year} {selectedCall.vehicleInfo.make} {selectedCall.vehicleInfo.model}
                      </p>
                    ) : selectedCall.vehicle ? (
                      <p className="text-[13px] font-bold text-gray-900">{selectedCall.vehicle}</p>
                    ) : (
                      <p className="text-[13px] font-bold text-gray-900">Not Available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Details below the cards */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-[13px] text-gray-400 w-20">Phone:</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {typeof selectedCall.customer === 'string' ? selectedCall.phone : selectedCall.customer?.phone || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-[13px] text-gray-400 w-20">Email:</span>
                  <span className="text-[13px] font-semibold text-gray-900 truncate">
                    {selectedCall.customer?.email || selectedCall.email || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-[13px] text-gray-400 w-20">Created on:</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {selectedCall.createdAt ? formatDate(selectedCall.createdAt) : formatDate(selectedCall.callTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isCallInProgress(selectedCall) ? (
            // In Progress Call State
            <div className="space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-red-800">Call in Progress</h3>
                </div>
                <p className="text-red-700 mb-4">
                  This call is currently active. Detailed information will be available once the call is completed.
                </p>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-red-600" />
                    <span className="font-mono text-lg font-semibold text-red-800">
                      {formatTimer(callTimer)}
                    </span>
                  </div>
                  <p className="text-sm text-red-600">Call Duration</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Available Information:</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Customer: {selectedCall.customer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>Phone: {selectedCall.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Started: {formatDate(selectedCall.callTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <span>Status: Connected & Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Real-time Updates</span>
                </div>
                <p className="text-sm text-blue-700">
                  Call highlights, action items, and summary will be generated automatically once the call ends.
                </p>
              </div>
            </div>
          ) : (
            // Completed Call State
            <Tabs value={callDetailsTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="highlights" className="text-xs">Highlights</TabsTrigger>
                <TabsTrigger value="customer" className="text-xs">Customer</TabsTrigger>
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="appointment" className="text-xs">Appointment</TabsTrigger>
                <TabsTrigger value="transcript" className="text-xs">Transcript</TabsTrigger>
              </TabsList>

            <TabsContent value="highlights" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">💡</span>
                  </div>
                  Key Highlights
                  <span className="text-xs text-gray-500">4 total</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">1</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {selectedCall.outcome === 'info provided' ? 
                        'Customer inquired about a recall on his Chevy Tahoe.' :
                        selectedCall.outcome === 'appointment set' ?
                        'Customer inquired about a recall on his Chevy Tahoe.' :
                        'Customer inquired about BMW X3 availability and pricing.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">2</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {selectedCall.outcome === 'info provided' ? 
                        'Customer wants to take care of the recall and get an oil change during the same visit.' :
                        selectedCall.outcome === 'appointment set' ?
                        'Customer wants to take care of the recall and get an oil change during the same visit.' :
                        'Customer wants to schedule a test drive and get pricing information.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {selectedCall.outcome === 'info provided' ? 
                        'Customer asked about parts availability and loaner car availability for the appointment.' :
                        selectedCall.outcome === 'appointment set' ?
                        'Customer asked about parts availability and loaner car availability for the appointment.' :
                        'Customer asked about financing options and trade-in value.'}
                    </p>
                  </div>
                  <div className="text-center text-sm text-gray-500 py-2">
                    Showing 3 of 4 highlights
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customer" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Customer Name</p>
                      <p className="text-sm text-gray-600">{selectedCall.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone Number</p>
                      <p className="text-sm text-gray-600">{selectedCall.phone}</p>
                    </div>
                  </div>
                  {selectedCall.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">@</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Address</p>
                        <p className="text-sm text-gray-600">{selectedCall.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Summary & Action Items
                </h3>
                
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-900">Action Items:</h4>
                  </div>
                  <div className="space-y-2 ml-6">
                    {selectedCall.outcome === 'info provided' ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Agent to secure and confirm the oil change appointment for Monday at 8 AM for the customer</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Agent to send confirmation of the appointment by 9 AM the day before.</p>
                        </div>
                      </>
                    ) : selectedCall.outcome === 'appointment set' ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Agent will pass customer details to service team for recall and oil change scheduling</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Service team will call customer by 9 AM tomorrow to confirm recall part availability</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Service team will confirm the availability of a loaner car during the appointment.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Agent to pass customer's budget information to sales manager for pricing discussion</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">Customer to consider scheduling a visit or test drive and reach out when ready.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Customer Query Resolved</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appointment" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Appointment Details
                </h3>
                {selectedCall.appointment === 'Yes' || selectedCall.outcome === 'appointment set' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Appointment Scheduled</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium">Service:</span> Oil Change & Recall Service</p>
                      <p><span className="font-medium">Date:</span> Monday, 8:00 AM</p>
                      <p><span className="font-medium">Location:</span> Avis Motors Service Center</p>
                      <p><span className="font-medium">Estimated Duration:</span> 2-3 hours</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <X className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">No Appointment Scheduled</span>
                    </div>
                    <p className="text-sm text-gray-600">Customer requested information only. No appointment was made during this call.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Call Transcript
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 italic">
                    Call transcript is not available for this demo. In a real implementation, 
                    this would show the full conversation between the agent and customer.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          )}
        </>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
