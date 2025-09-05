"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import { Calendar, Clock, Car, Phone, Mail, MessageSquare, Hash, User, CalendarDays, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { Appointment } from "@/types/appointment"
import { mockAppointments } from "@/lib/mock-appointments"
import { AppointmentDetailsDrawer } from "@/components/appointment-details-drawer"
import { toProperCase } from "@/lib/utils"

export function AppointmentsView() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Notify parent container (iframe host) about drawer open/close state
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({ type: 'TOGGLE_MAINBAR', payload: { isOpen: isDrawerOpen } }, '*')
      }
    } catch {}
  }, [isDrawerOpen])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1 text-gray-500" /> : <ArrowDown className="h-4 w-4 ml-1 text-gray-500" />
  }

  const filteredAppointments = mockAppointments.filter((appointment) => {
    const matchesSearch =
      toProperCase(appointment.customer.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.customer.phone.includes(searchTerm) ||
      appointment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    const matchesType = typeFilter === "all" || appointment.appointment_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (!sortField) return 0
    
    let aValue: any, bValue: any
    
    switch (sortField) {
      case "id":
        aValue = a.id.toLowerCase()
        bValue = b.id.toLowerCase()
        break
      case "customer":
        aValue = toProperCase(a.customer.name || "").toLowerCase()
        bValue = toProperCase(b.customer.name || "").toLowerCase()
        break
      case "date":
        aValue = new Date(a.scheduled_datetime).getTime()
        bValue = new Date(b.scheduled_datetime).getTime()
        break
      case "status":
        aValue = a.status.toLowerCase()
        bValue = b.status.toLowerCase()
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Pagination logic
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAppointments = sortedAppointments.slice(startIndex, endIndex)

  const stats = {
    totalAppointments: mockAppointments.length,
    scheduled: mockAppointments.filter((a) => a.status === "scheduled").length,
    confirmed: mockAppointments.filter((a) => a.status === "confirmed").length,
    completed: mockAppointments.filter((a) => a.status === "completed").length,
  }

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
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const getConfirmationIcon = (method?: string) => {
    switch (method) {
      case "phone":
        return <Phone className="h-3 w-3" />
      case "email":
        return <Mail className="h-3 w-3" />
      case "sms":
        return <MessageSquare className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Appointment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">All Time</div>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Pending Confirmation</div>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Customer Confirmed</div>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Successfully Finished</div>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Management</CardTitle>
          <CardDescription>View and manage customer appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by name, phone, or appointment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-gray-100 cursor-pointer hover:bg-gray-150" onClick={() => handleSort("id")}>
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 mr-2 text-black/40" />
                      ID
                      {getSortIcon("id")}
                    </div>
                  </TableHead>
                  <TableHead className="bg-gray-100 cursor-pointer hover:bg-gray-150" onClick={() => handleSort("customer")}>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-black/40" />
                      Customer
                      {getSortIcon("customer")}
                    </div>
                  </TableHead>
                  <TableHead className="bg-gray-100">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-black/40" />
                      Type
                    </div>
                  </TableHead>
                  <TableHead className="bg-gray-100 cursor-pointer hover:bg-gray-150" onClick={() => handleSort("date")}>
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-black/40" />
                      Date & Time
                      {getSortIcon("date")}
                    </div>
                  </TableHead>
                  <TableHead className="bg-gray-100 cursor-pointer hover:bg-gray-150" onClick={() => handleSort("status")}>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-black/40" />
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead className="bg-gray-100">
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-2 text-black/40" />
                      Vehicle
                    </div>
                  </TableHead>
                  <TableHead className="bg-gray-100">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-black/40" />
                      Confirmation
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAppointments.map((appointment) => {
                  const { date, time } = formatDateTime(appointment.scheduled_datetime)
                  return (
                    <TableRow 
                      key={appointment.id} 
                      className="border-b border-black/10 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        setIsDrawerOpen(true)
                      }}
                    >
                      <TableCell className="text-sm">{appointment.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {toProperCase(appointment.customer.name) || appointment.customer.phone}
                          </div>
                          {!appointment.customer.name && (
                            <>
                              <div className="text-sm text-gray-600 ">{appointment.customer.phone}</div>
                            </>
                          )}
                          {appointment.customer.name && (
                            <>
                              <div className="text-sm text-gray-500">{appointment.customer.phone}</div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeBadgeColor(appointment.appointment_type)}>
                          {appointment.appointment_type}
                        </Badge>
                        {appointment.service_type && (
                          <div className="text-xs text-gray-500 mt-1 capitalize">{appointment.service_type}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{date}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{time}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {appointment.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {appointment.vehicle && (
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {appointment.vehicle.year} {appointment.vehicle.make} {appointment.vehicle.model}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getConfirmationIcon(appointment.confirmation_method)}
                          <span className="text-xs text-gray-500">{appointment.confirmation_method || "None"}</span>
                        </div>
                        {appointment.reminder_sent && <div className="text-xs text-green-600 mt-1">Reminder sent</div>}
                      </TableCell>
                      
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {paginatedAppointments.length > 0 && totalPages > 1 && (
            <div className="flex justify-center py-4 border-t border-gray-200">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedAppointment(null)
        }}
      />
    </div>
  )
}
