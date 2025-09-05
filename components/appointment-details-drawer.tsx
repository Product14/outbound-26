"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
import { Calendar, Clock, Car, Phone, Mail, MessageSquare, User, FileText, X } from "lucide-react"
import { toProperCase } from "@/lib/utils"
import type { Appointment } from "@/types/appointment"

interface AppointmentDetailsDrawerProps {
  appointment: Appointment | null
  open: boolean
  onClose: () => void
}

export function AppointmentDetailsDrawer({ appointment, open, onClose }: AppointmentDetailsDrawerProps) {
  // Handle empty state when drawer is open but no appointment is selected
  if (!appointment && !open) return null

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "secondary"
      case "confirmed":
        return "default"
      case "completed":
        return "outline"
      case "cancelled":
        return "destructive"
      case "no_show":
        return "destructive"
      case "rescheduled":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTypeBadgeColor = (type: string) => {
    return type === "sales" ? "text-blue-600" : "text-green-600"
  }

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const getConfirmationIcon = (method?: string) => {
    switch (method) {
      case "phone":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      default:
        return null
    }
  }

  // Show empty state when drawer is open but no appointment is selected
  if (!appointment) {
    return (
      <div>
        {/* Modern Drawer Overlay */}
        {open && (
          <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
        )}
        
        {/* Modern Drawer */}
        <div 
          className={`fixed top-0 right-0 h-full w-full sm:max-w-xl bg-white shadow-2xl transform transition-all duration-300 ease-out z-50 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ maxWidth: '36rem' }}
        >
          <div className="h-full flex flex-col">
            {/* Header with close button */}
            <div className="flex-shrink-0 border-b border-gray-100 bg-white">
              <div className="px-6 py-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                      Appointment Details
                    </h1>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Empty State Content */}
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Calendar}
                title="No Appointment Selected"
                description="Select an appointment from the table to view its details, customer information, and manage scheduling."
                className="py-8"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { date, time } = formatDateTime(appointment.scheduled_datetime)

  return (
    <div>
      {/* Modern Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}
      
      {/* Modern Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:max-w-xl bg-white shadow-2xl transform transition-all duration-300 ease-out z-50 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ maxWidth: '36rem' }}
      >
        <div className="h-full flex flex-col">
          {/* Modern Header */}
          <div className="flex-shrink-0 border-b border-gray-100 bg-white">
            <div className="px-6 py-8">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      variant={getStatusBadgeVariant(appointment.status)}
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        appointment.status === 'confirmed' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : appointment.status === 'scheduled'
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {appointment.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeBadgeColor(appointment.appointment_type)} bg-gray-50 border-gray-200`}
                    >
                      {appointment.appointment_type}
                    </Badge>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-lg font-semibold text-gray-900 leading-tight mb-3">
                    Appointment Details
                  </h1>
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>•</span>
                      <span className="font-medium">ID: {appointment.id}</span>
                    </div>
                  </div>
                </div>
                
                {/* Close Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-8">
              {/* Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  Summary
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Only show Date & Time if appointment is scheduled */}
                  {appointment.scheduled_datetime && (
                    <>
                      <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date</div>
                            <div className="text-sm font-semibold text-gray-900 truncate">{date}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Time</div>
                            <div className="text-sm font-semibold text-gray-900 truncate">{time}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Only show confirmation method if it exists */}
                  {appointment.confirmation_method && (
                    <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Confirmation</div>
                          <div className="text-sm font-medium text-gray-900 truncate capitalize">{appointment.confirmation_method}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Only show reminder status if it was sent */}
                  {appointment.reminder_sent && (
                    <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reminder</div>
                          <div className="text-sm font-medium text-emerald-600">Sent</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  Customer Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{toProperCase(appointment.customer.name)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{appointment.customer.phone}</div>
                      </div>
                    </div>
                  </div>
                  
                  {appointment.customer.email && (
                    <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</div>
                          <div className="text-sm font-medium text-gray-900 truncate">{appointment.customer.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {appointment.vehicle && (appointment.vehicle.year || appointment.vehicle.make || appointment.vehicle.model || appointment.vehicle.vin) && (
                    <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Car className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Vehicle</div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {appointment.vehicle.year && appointment.vehicle.make && appointment.vehicle.model 
                                ? `${appointment.vehicle.year} ${appointment.vehicle.make} ${appointment.vehicle.model}`
                                : appointment.vehicle.vin 
                                ? `VIN: ${appointment.vehicle.vin}`
                                : "Vehicle info available"
                              }
                            </div>
                            {appointment.vehicle.vin && appointment.vehicle.year && appointment.vehicle.make && appointment.vehicle.model && (
                              <div className="group relative">
                                <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center cursor-help">
                                  <span className="text-gray-600 text-xs font-bold">i</span>
                                </div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  VIN: {appointment.vehicle.vin}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    Notes
                  </h3>
                  
                  <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                    <div className="text-sm text-gray-600 leading-relaxed">{appointment.notes}</div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Metadata</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{new Date(appointment.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Updated</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{new Date(appointment.updated_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100 sm:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Call ID</div>
                        <div className="text-sm font-medium text-gray-900 truncate font-mono">{appointment.call_id}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" size="sm" className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                  Reschedule
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                  Confirm
                </Button>
                <Button variant="destructive" size="sm" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
