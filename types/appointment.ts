export interface Appointment {
  id: string
  call_id: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  appointment_type: "sales" | "service"
  service_type?: "maintenance" | "repair" | "inspection" | "warranty"
  scheduled_datetime: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled"
  notes?: string
  vehicle?: {
    year?: number
    make?: string
    model?: string
    vin?: string
  }
  created_at: string
  updated_at: string
  reminder_sent?: boolean
  confirmation_method?: "phone" | "email" | "sms"
}
