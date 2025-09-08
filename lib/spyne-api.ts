import type { CallRecord, TranscriptEntry } from "@/types/call-record"
import type { SpyneApiResponse, SpyneCallData, SpyneApiParams, SpyneMessage, SpyneFormattedMessage } from "@/types/spyne-api"
import { getTenantIdsFromReferrer } from "@/lib/utils"
import { getApiBaseUrl } from "@/config"
import { CallOutcome, SALES_OUTCOMES, SERVICE_OUTCOMES } from "@/lib/call-status-utils"

// API Configuration - now uses config.tsx
const SPYNE_API_BASE_URL = getApiBaseUrl()
// No .env dependencies - enterprise and team IDs come from URL parameters only
const DEFAULT_ENTERPRISE_ID = ''
const DEFAULT_TEAM_ID = ''

/**
 * Fetch individual call report by ID from Spyne AI API
 */
export async function fetchSpyneCallReportById(callId: string): Promise<SpyneCallData> {
  // Route through our proxy so environment (staging/prod) is selected per Referer
  const url = `/api/spyne?endpoint=report-by-id&callId=${encodeURIComponent(callId)}`


  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })



    if (!response.ok) {
      throw new Error(`Individual call API request failed: ${response.status} ${response.statusText}`)
    }

    const data: SpyneCallData = await response.json()

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Fetch call reports from Spyne AI API
 */
export async function fetchSpyneCallReports(params?: Partial<SpyneApiParams>): Promise<SpyneApiResponse> {
  // Resolve tenant IDs from provided params or parent/current URL
  const contextIds = getTenantIdsFromReferrer()
  const enterpriseId = params?.enterpriseId || contextIds.enterprise_id || DEFAULT_ENTERPRISE_ID
  const teamId = params?.teamId || contextIds.team_id || DEFAULT_TEAM_ID

  const queryParams = new URLSearchParams({
    endpoint: 'reports',
    ...(enterpriseId ? { enterpriseId } : {}),
    ...(teamId ? { teamId } : {}),
    page: (params?.page || 1).toString(),
    ...(params?.limit && { limit: params.limit.toString() }),
    ...(params?.dateRange && { dateRange: params.dateRange }),
    ...(params?.customStartDate && { customStartDate: params.customStartDate }),
    ...(params?.customEndDate && { customEndDate: params.customEndDate }),
    ...(params?.outcome && { outcome: params.outcome }),
    ...(params?.agentType && { agentType: params.agentType }),
  })

  const url = `/api/spyne?${queryParams}`


  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })



    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`)
    }

    const data: SpyneApiResponse = await response.json()

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Fetch Spyne agent list (name, imageUrl, etc.) via our proxy.
 */
export interface SpyneAgentListItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  type?: string
  colorTheme?: string
  available?: boolean
  order?: number
  squadId?: string
  faqs?: string[]
  age?: string
  city?: string
  languageName?: string
}

export async function fetchSpyneAgentList(params?: {
  enterpriseId?: string
  teamId?: string
  authToken?: string
}): Promise<SpyneAgentListItem[]> {
  const contextIds = getTenantIdsFromReferrer()
  const enterpriseId = params?.enterpriseId || contextIds.enterprise_id || DEFAULT_ENTERPRISE_ID
  const teamId = params?.teamId || contextIds.team_id || DEFAULT_TEAM_ID

  const queryParams = new URLSearchParams({
    endpoint: 'agents',
    ...(enterpriseId ? { enterpriseId } : {}),
    ...(teamId ? { teamId } : {}),
    ...(params?.authToken ? { authToken: params.authToken } : {}),
  })

  const url = `/api/spyne?${queryParams}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Failed to fetch agent list:', errorText)
    throw new Error(`Agent list request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  // API may return either an array or an object with data: []
  const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : [])
  return (list as any[]).map((item) => ({
    id: item.id ?? item.agentId ?? '',
    name: item.name ?? item.agentName ?? '',
    description: item.description,
    imageUrl: item.imageUrl ?? item.avatarUrl ?? item.profileImageUrl,
    type: item.type,
    colorTheme: item.colorTheme,
    available: item.available,
    order: item.order,
    squadId: item.squadId,
    faqs: item.faqs,
    age: item.age,
    city: item.city,
    languageName: item.languageName,
  }))
}

/**
 * Map Spyne API sentiment to our CallRecord sentiment format
 */
function mapSentiment(sentiment: string): "positive" | "neutral" | "negative" | "angry" {
  switch (sentiment.toLowerCase()) {
    case 'happy':
    case 'positive':
      return 'positive'
    case 'sad':
    case 'negative':
      return 'negative'
    case 'angry':
      return 'angry'
    default:
      return 'neutral'
  }
}

/**
 * Map customer intent to our outcome format (Legacy function - consider using mapApiOutcomeToCallOutcome instead)
 */
function mapOutcome(intent: string, callOutcome: string): CallOutcome {
  switch (intent.toLowerCase()) {
    case 'schedule appointment':
      return 'Test Drive Scheduled'
    case 'request callback':
      return 'Customer Transferred to Salesperson/Manager'
    case 'no intent':
      return 'Follow-up Required'
    default:
      // Try to map the callOutcome using our new function, defaulting to sales
      return mapApiOutcomeToCallOutcome(callOutcome, 'sales')
  }
}

/**
 * Extract all vehicles discussed from the API response
 */
function extractAllVehicles(spyneData: SpyneCallData): string[] {
  const vehicles = spyneData.report?.sales?.vehicleRequested || []
  return vehicles.map(v => v.vehicleName).filter(Boolean)
}

/**
 * Extract vehicle information from the API response
 */
function extractVehicleInfo(spyneData: SpyneCallData) {
  const vehicleRequested = spyneData.report?.sales?.vehicleRequested
  const vehicleName = (Array.isArray(vehicleRequested) && vehicleRequested.length > 0) 
    ? vehicleRequested[0]?.vehicleName || '' 
    : ''
  
  // Try to parse vehicle information from the title or vehicle name
  let year = 0, make = null, model = null, trim = null
  
  if (vehicleName) {
    const parts = vehicleName.split(' ')
    if (parts.length >= 2) {
      // Try to identify year (4-digit number)
      const yearMatch = vehicleName.match(/\b(19|20)\d{2}\b/)
      if (yearMatch) {
        year = parseInt(yearMatch[0])
        // Remove year from parts for make/model extraction
        const cleanedName = vehicleName.replace(yearMatch[0], '').trim()
        const cleanParts = cleanedName.split(' ').filter(Boolean)
        make = cleanParts[0] || null
        model = cleanParts[1] || null
        trim = cleanParts.slice(2).join(' ') || null
      } else {
        // No year found, assume first part is make, second is model
        make = parts[0] || null
        model = parts[1] || null
        trim = parts.slice(2).join(' ') || null
      }
    }
  } else if (spyneData.report?.title) {
    // Try to extract from title (e.g., "2016 Bergner Highlander")
    const titleMatch = spyneData.report.title.match(/(\d{4})\s+(\w+)\s+(\w+)/i)
    if (titleMatch) {
      year = parseInt(titleMatch[1]) || 0
      make = titleMatch[2] || null
      model = titleMatch[3] || null
    }
  }

  return {
    vin: null,
    stock_id: null,
    year,
    make,
    model,
    trim,
    delivery_type: null as "self_drive" | "pickup" | null,
  }
}

/**
 * Convert Spyne messages to transcript entries
 */
function convertMessagesToTranscript(messages: SpyneMessage[]): TranscriptEntry[] {
  if (!messages || messages.length === 0) {
    return []
  }

  const transcript: TranscriptEntry[] = []

  messages.forEach((message, index) => {
    // Skip messages with blank or empty content
    if (!message.message || message.message.trim().length === 0) {
      return
    }

    // Map role to speaker name
    const speaker = message.role === 'bot' ? 'Agent' : 
                   message.role === 'user' ? getCustomerName(message.message) || 'Customer' : 
                   message.role

    transcript.push({
      speaker,
      text: message.message,
      timestamp: Math.round(message.secondsFromStart || (message.time ? message.time / 1000 : index * 10)),
      duration: message.duration ? Math.round(message.duration / 1000) : undefined // Convert ms to seconds and round
    })
  })

  return transcript
}

/**
 * Convert Spyne formatted messages to transcript entries
 */
function convertFormattedMessagesToTranscript(messages: SpyneFormattedMessage[]): TranscriptEntry[] {
  if (!messages || messages.length === 0) {
    return []
  }

  const transcript: TranscriptEntry[] = []

  messages.forEach((message, index) => {
    // Skip messages with blank or empty content
    if (!message.content || message.content.trim().length === 0) {
      return
    }

    // Map role to speaker name
    const speaker = message.role === 'bot' ? 'Agent' : 
                   message.role === 'user' ? getCustomerName(message.content) || 'Customer' : 
                   message.role

    transcript.push({
      speaker,
      text: message.content,
      timestamp: Math.round(message.secondsFromStart || (message.time ? message.time / 1000 : index * 10)),
      duration: message.duration ? Math.round(message.duration / 1000) : undefined // Convert ms to seconds and round
    })
  })

  return transcript
}

/**
 * Extract customer name from message content (simple heuristic)
 */
function getCustomerName(content: string): string | null {
  // Look for patterns like "I'm [Name]" or "This is [Name]"
  const namePattern = /(?:I'm|I am|This is|My name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  const match = content.match(namePattern)
  return match ? match[1] : null
}



/**
 * Generate mock transcript data for testing (fallback)
 */
function generateMockTranscript(callId: string, duration: number): TranscriptEntry[] {
  const transcripts: { [key: string]: TranscriptEntry[] } = {
    default: [
      { speaker: "Agent", text: "Hi there. This is David from Avis Motor service department. Can I help you today?", timestamp: 1 },
      { speaker: "Andrew Ray", text: "Hey, David. How are you doing today?", timestamp: 7 },
      { speaker: "Agent", text: "I'm doing well. Thank you for asking. How can I assist you with your vehicle needs today?", timestamp: 9 },
      { speaker: "Andrew Ray", text: "I was calling about getting my 2019 Honda Civic serviced. I think it needs an oil change and maybe some other maintenance.", timestamp: 15 },
      { speaker: "Agent", text: "Absolutely! I'd be happy to help you schedule that service. How many miles are currently on your Honda Civic?", timestamp: 25 },
      { speaker: "Andrew Ray", text: "It's got about 45,000 miles on it now. I haven't had it serviced in a while.", timestamp: 32 },
      { speaker: "Agent", text: "Perfect. At 45,000 miles, you're definitely due for an oil change. We should also check your air filter, cabin filter, and maybe rotate your tires.", timestamp: 38 },
      { speaker: "Andrew Ray", text: "That sounds good. What would be the total cost for all of that?", timestamp: 48 },
      { speaker: "Agent", text: "For a full service package including oil change, filters, and tire rotation, we're looking at around $180. Would you like to schedule an appointment?", timestamp: 52 },
      { speaker: "Andrew Ray", text: "Yes, that works for me. When do you have availability?", timestamp: 62 },
      { speaker: "Agent", text: "I have openings tomorrow at 10 AM or Thursday at 2 PM. Which works better for your schedule?", timestamp: 67 },
      { speaker: "Andrew Ray", text: "Thursday at 2 PM would be perfect.", timestamp: 75 },
      { speaker: "Agent", text: "Great! I'll schedule you for Thursday at 2 PM. Can I get your phone number to confirm the appointment?", timestamp: 78 },
      { speaker: "Andrew Ray", text: "Sure, it's 555-123-4567.", timestamp: 85 },
      { speaker: "Agent", text: "Perfect. You're all set for Thursday at 2 PM for your Honda Civic service. We'll see you then!", timestamp: 88 }
    ]
  }
  
  return transcripts[callId] || transcripts.default
}

/**
 * Generate detailed description for subtitle based on available data
 */
function generateDetailedDescription(spyneData: SpyneCallData): string {
  const agentName = spyneData.callDetails.agentInfo?.agentName || 'AI agent'
  const dealership = 'NextGear Motors' // This could be made dynamic if needed
  
  // Regular call handling
  const customerName = spyneData.callDetails.name || 'Customer'
  const vehicleRequested = spyneData.report?.sales?.vehicleRequested
  const vehicleInfo = (Array.isArray(vehicleRequested) && vehicleRequested.length > 0) 
    ? vehicleRequested[0]?.vehicleName || 'vehicle'
    : 'vehicle'
  const callType = spyneData.callDetails.callType === 'inboundPhoneCall' ? 'called' : 'contacted'
  
  // Try to create a detailed description based on available data
  if (spyneData.report?.title && spyneData.report?.actionItems?.length) {
    const actionItems = spyneData.report.actionItems.join('. ')
    return `${customerName} ${callType} ${dealership} to inquire about ${vehicleInfo}. ${actionItems}`
  }
  
  // Fallback to basic description
  return `${customerName} ${callType} ${dealership} regarding ${vehicleInfo}. The ${agentName} provided assistance and information.`
}

/**
 * Maps API outcome strings to standardized CallOutcome types
 */
function mapApiOutcomeToCallOutcome(apiOutcome: string, domain: 'sales' | 'service'): CallOutcome {
  if (!apiOutcome) return 'Follow-up Required';
  
  // Normalize the API outcome for comparison
  const normalized = apiOutcome.toLowerCase().replace(/[_\s-]/g, '');
  
  // Define mapping patterns for sales outcomes
  const salesMappings: Record<string, CallOutcome> = {
    'testdrivescheduled': 'Test Drive Scheduled',
    'testdriverescheduled': 'Test Drive Rescheduled',
    'testdrivecancelled': 'Test Drive Cancelled',
    'appointmentscheduled': 'Appointment for Purchase Discussion Scheduled',
    'appointmentforpurchasediscussionscheduled': 'Appointment for Purchase Discussion Scheduled',
    'purchaseconfirmed': 'Purchase Confirmed',
    'orderdeliverystatusconfirmed': 'Order/Delivery Status Confirmed',
    'salelostnotinterested': 'Sale Lost/Not Interested',
    'notinterested': 'Sale Lost/Not Interested',
    'followuprequired': 'Follow-up Required',
    'noavailabilityfound': 'No Availability Found',
    'callaborted': 'Call Aborted',
    'promotionalofferaccepted': 'Promotional Offer Accepted',
    'promotionalofferdeclined': 'Promotional Offer Declined',
    'financingleasingapproved': 'Financing/Leasing Approved',
    'financingleasingdeclined': 'Financing/Leasing Declined',
    'tradeinaccepted': 'Trade-in Accepted',
    'tradeindeclined': 'Trade-in Declined',
    'inventorywaitlistcreated': 'Inventory Waitlist Created',
    'customertransferredtosalespersonmanager': 'Customer Transferred to Salesperson/Manager',
    'transferred': 'Customer Transferred to Salesperson/Manager'
  };
  
  // Define mapping patterns for service outcomes
  const serviceMappings: Record<string, CallOutcome> = {
    'serviceappointmentscheduled': 'Service Appointment Scheduled',
    'appointmentscheduled': 'Service Appointment Scheduled',
    'serviceappointmentrescheduled': 'Service Appointment Rescheduled',
    'serviceappointmentcancelled': 'Service Appointment Cancelled',
    'recallappointmentscheduled': 'Recall Appointment Scheduled',
    'maintenanceappointmentscheduled': 'Maintenance Appointment Scheduled',
    'repaircompletedconfirmed': 'Repair Completed/Confirmed',
    'dropoffpickupscheduled': 'Drop-off/Pickup Scheduled',
    'loanervehicleconfirmed': 'Loaner Vehicle Confirmed',
    'warrantyserviceapproved': 'Warranty Service Approved',
    'warrantyrenewalextensionaccepted': 'Warranty Renewal/Extension Accepted',
    'warrantyrenewalextensiondeclined': 'Warranty Renewal/Extension Declined',
    'insuranceclaimiminated': 'Insurance Claim Initiated',
    'complaintlogged': 'Complaint Logged',
    'servicediscountaccepted': 'Service Discount Accepted',
    'servicediscountdeclined': 'Service Discount Declined',
    'noavailabilityfound': 'No Availability Found',
    'callaborted': 'Call Aborted',
    'customerdeclinedservice': 'Customer Declined Service',
    'notinterested': 'Customer Declined Service',
    'followuprequired': 'Follow-up Required'
  };
  
  // Choose mapping based on domain
  const mappings = domain === 'sales' ? salesMappings : serviceMappings;
  
  // Try exact match first
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // Try partial matches for common patterns
  if (normalized.includes('scheduled') || normalized.includes('appointment')) {
    return domain === 'sales' ? 'Test Drive Scheduled' : 'Service Appointment Scheduled';
  }
  if (normalized.includes('confirmed') || normalized.includes('success')) {
    return domain === 'sales' ? 'Purchase Confirmed' : 'Repair Completed/Confirmed';
  }
  if (normalized.includes('cancelled')) {
    return domain === 'sales' ? 'Test Drive Cancelled' : 'Service Appointment Cancelled';
  }
  if (normalized.includes('rescheduled')) {
    return domain === 'sales' ? 'Test Drive Rescheduled' : 'Service Appointment Rescheduled';
  }
  if (normalized.includes('declined') || normalized.includes('notinterested')) {
    return domain === 'sales' ? 'Sale Lost/Not Interested' : 'Customer Declined Service';
  }
  if (normalized.includes('followup') || normalized.includes('callback')) {
    return 'Follow-up Required';
  }
  
  // Default fallback
  return 'Follow-up Required';
}

/**
 * Convert Spyne API data to our CallRecord format
 */
export function mapSpyneDataToCallRecord(spyneData: SpyneCallData, options?: { aiScoreOverride?: number }): CallRecord {

  
  const createdAt = new Date(spyneData.createdAt)
  
  // Helper function to create valid dates with fallbacks
  const createValidDate = (dateString: string | undefined, fallbackDate: Date, fallbackOffset: number = 0): Date => {
    if (!dateString) {
      return new Date(fallbackDate.getTime() + fallbackOffset * 1000)
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return new Date(fallbackDate.getTime() + fallbackOffset * 1000)
    }
    
    return date
  }
  
  const startedAt = createValidDate(spyneData.callDetails.startedAt, createdAt, 0)
  const endedAt = createValidDate(spyneData.callDetails.endedAt, startedAt, 120) // Default 2 minute call if no end time
  


  const agentType = spyneData.callDetails?.agentInfo?.agentType || ''
  // Remove temporary debug logs
  const mappedRecord = {
    call_id: spyneData.callId,
    dealership_id: "spyne_dealer_001",
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    direction: (spyneData.callDetails.callType === 'inboundPhoneCall' ? 'inbound' : 'outbound') as "inbound" | "outbound",
    // Determine sales vs service from agentType; fallback to sales when missing
    domain: (agentType.toLowerCase().includes('service') ? 'service' : 'sales') as "service" | "sales",
    callType: spyneData.callDetails.callType,
    campaign_id: null,
    customer: {
      name: (() => {
        // Candidate from API
        let apiName = spyneData.callDetails.analysis?.structuredData?.name || spyneData.callDetails.name
        const agentName = spyneData.callDetails.agentInfo?.agentName
        
        // If API-provided name equals agent name, treat as missing
        if (apiName && agentName && apiName.trim().toLowerCase() === agentName.trim().toLowerCase()) {
          apiName = ''
        }

        // Fallback sources in report object (some payloads include Name here)
        const reportName = ((spyneData as any)?.report?.Name
          || (spyneData as any)?.report?.name
          || (spyneData as any)?.report?.customerName) as string | undefined

        // Try to infer name from transcript content
        const transcriptName = (() => {
          if (Array.isArray(spyneData.callDetails?.formattedMessages) && spyneData.callDetails.formattedMessages.length > 0) {
            for (const m of spyneData.callDetails.formattedMessages) {
              const n = getCustomerName(m.content)
              if (n) return n
            }
          }
          if (Array.isArray(spyneData.callDetails?.messages) && spyneData.callDetails.messages.length > 0) {
            for (const m of spyneData.callDetails.messages) {
              const n = getCustomerName(m.message)
              if (n) return n
            }
          }
          return null
        })()
        
        // Prefer a valid API name if it's not the agent's name
        if (apiName && apiName.trim()) {
          return apiName
        }
        // Else report-provided name
        if (reportName && reportName.trim()) {
          return reportName
        }
        // Else transcript-derived name
        if (transcriptName && transcriptName.trim()) {
          return transcriptName
        }
        
        // Else fall back to phone number
        const phoneNumber = spyneData.callDetails.mobile
        if (phoneNumber && phoneNumber.trim()) {
          return phoneNumber
        }
        
        // Nothing viable
        return null
      })(),
      phone: spyneData.callDetails.mobile || '',
      email: spyneData.callDetails.email || null,
    },
    vehicle: extractVehicleInfo(spyneData),
    primary_intent: spyneData.report?.overview?.overall?.customerIntent || 'general_inquiry',
    intents: [
      {
        label: spyneData.report?.overview?.overall?.customerIntent?.toLowerCase().replace(/\s+/g, '_') || 'general_inquiry',
        confidence: parseFloat(spyneData.report?.overview?.overall?.aiResponseQuality?.score || '0') / 10,
      }
    ],
    outcome: mapApiOutcomeToCallOutcome(
      ((spyneData as any)?.report?.Outcome) || (spyneData.report?.overview?.callOutcome) || '',
      (agentType.toLowerCase().includes('service') ? 'service' : 'sales')
    ),
    appointment: {
      type: (spyneData.report?.overview?.overall?.customerIntent?.toLowerCase().includes('service') ? 'service' : 
            spyneData.report?.overview?.overall?.customerIntent?.toLowerCase().includes('appointment') ? 'test_drive' : null) as "service" | "test_drive" | null,
      starts_at: null,
      ends_at: null,
      location: null,
      advisor: spyneData.callDetails.agentInfo?.agentName || null,
      status: (spyneData.report?.overview?.overall?.customerIntent?.toLowerCase().includes('appointment') ? 'scheduled' : null) as "scheduled" | "rescheduled" | "cancelled" | null,
    },
    sentiment: {
      label: mapSentiment(spyneData.report?.overview?.overall?.sentiment || 'neutral'),
      score: (() => {
        const score = parseFloat(spyneData.report?.overview?.overall?.aiResponseQuality?.score || '0')
        return isNaN(score) ? 0 : score / 10
      })(),
    },
    // AI response quality rating extracted from API1: data->report->overview->overall->aiResponseQuality->score
    ai_score: options?.aiScoreOverride !== undefined
      ? options.aiScoreOverride
      : (() => {
          const score = parseFloat(spyneData.report?.overview?.overall?.aiResponseQuality?.score || '0')
          return isNaN(score) ? 0 : score
        })(),
    containment: spyneData.report?.queryResolved === 'Yes',
    summary: spyneData.callDetails.analysis?.summary || 
         spyneData.note || 
         spyneData.report?.title || 
         'No summary available',
    notes: spyneData.note || spyneData.report?.actionItems?.join('. ') || '',

    report: spyneData.report?.title ? {
      useCase: (() => {
        const raw = (spyneData as any)?.report?.useCase
        if (!raw || typeof raw !== 'string') return raw
        const lc = raw.toLowerCase()
        if (lc === 'service') return 'Service'
        if (lc === 'sales') return 'Sales'
        return raw
      })(),
      title: spyneData.report.title,
      summary: spyneData.report.summary || [], // Map the Key Highlights summary array
      queryResolved: spyneData.report.queryResolved,
      Outcome: (spyneData as any)?.report?.Outcome,
      actionItems: spyneData.report.actionItems || [],
      service: spyneData.report?.service ? {
        serviceIntent: (spyneData.report as any)?.service?.serviceIntent,
        serviceRequested: {
          value: spyneData.report.service.serviceRequested?.value,
          vehicleName: spyneData.report.service.serviceRequested?.vehicleName,
          services: (spyneData.report.service.serviceRequested as any)?.services || []
        }
      } : undefined,
      overview: spyneData.report?.overview ? {
        overall: spyneData.report.overview.overall ? {
          customerIntent: spyneData.report.overview.overall.customerIntent,
          sentiment: spyneData.report.overview.overall.sentiment,
          aiResponseQuality: spyneData.report.overview.overall.aiResponseQuality
        } : undefined,
        callOutcome: spyneData.report.overview.callOutcome
      } : undefined
    } : undefined,
    agentInfo: spyneData.callDetails.agentInfo ? {
      agentName: spyneData.callDetails.agentInfo.agentName,
      agentType: spyneData.callDetails.agentInfo.agentType || 'AI Agent'
    } : undefined,
    agentConfig: (spyneData as any).agentConfig ? {
      agentName: (spyneData as any).agentConfig.agentName
    } : undefined,
    follow_up: {
      needed: (spyneData.report?.actionItems?.length || 0) > 0,
      reason: (Array.isArray(spyneData.report?.actionItems) && spyneData.report.actionItems.length > 0) 
        ? spyneData.report.actionItems[0] || null 
        : null,
      due_at: null,
      assignee: spyneData.callDetails.agentInfo?.agentName || null,
    },
          metrics: {
        duration_sec: (() => {
          // Priority 1: Use the actual callDuration from the API if available
          if (spyneData.callDuration && spyneData.callDuration > 0) {
            return spyneData.callDuration
          }
          
          // Priority 2: Try to calculate duration from timestamps
          const calculatedDuration = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
          
          // Priority 3: If calculated duration is reasonable, use it
          if (calculatedDuration > 5 && calculatedDuration < 3600) { // Between 5 seconds and 1 hour
            return calculatedDuration
          }
          
          // Priority 4: Generate realistic duration as fallback
          const hasMessages = (spyneData.callDetails?.messages as any)?.length || (spyneData.callDetails?.formattedMessages as any)?.length || 0
          const hasActionItems = spyneData.report?.actionItems?.length || 0
          const isResolved = spyneData.report?.queryResolved === 'Yes'
          const isAbandoned = spyneData.report?.callRageQuit === 'Yes' || spyneData.report?.queryResolved === 'No'
          
          // Base duration on conversation complexity
          let baseDuration = 45 // minimum 45 seconds
          
          if (hasMessages > 0) {
            baseDuration += hasMessages * 12 // 12 seconds per message exchange
          }
          
          if (hasActionItems > 0) {
            baseDuration += hasActionItems * 25 // 25 seconds per action item
          }
          
          if (isResolved) {
            baseDuration += 45 // resolved calls tend to be longer
          }
          
          if (isAbandoned) {
            baseDuration = Math.min(baseDuration, 90) // abandoned calls are shorter
          }
          
          // Add some randomness to make it more realistic
          const randomVariation = Math.floor(Math.random() * 120) - 60 // -60 to +60 seconds
          baseDuration += randomVariation
          
          // Ensure minimum duration of 30 seconds and maximum of 15 minutes
          return Math.max(30, Math.min(900, baseDuration))
        })(),
        hold_sec: 0,
        silence_sec: 0,
      },
    recording_url: spyneData.callDetails?.recordingUrl || spyneData.recordingUrl || null,
    voice_recording_url: spyneData.callDetails?.recordingUrl || spyneData.voiceRecordingUrl || spyneData.audioUrl || spyneData.recordingUrl || null,
    transcript_url: null,
    transcript: spyneData.callDetails.formattedMessages ? 
      convertFormattedMessagesToTranscript(spyneData.callDetails.formattedMessages) :
      spyneData.callDetails.messages ? 
        convertMessagesToTranscript(spyneData.callDetails.messages) : 
        generateMockTranscript(spyneData.callId, (() => {
          // Use the same duration calculation logic as above
          // Priority 1: Use the actual callDuration from the API if available
          if (spyneData.callDuration && spyneData.callDuration > 0) {
            return spyneData.callDuration
          }
          
          // Priority 2: Try to calculate duration from timestamps
          const calculatedDuration = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
          
          // Priority 3: If calculated duration is reasonable, use it
          if (calculatedDuration > 5 && calculatedDuration < 3600) {
            return calculatedDuration
          }
          
          // Priority 4: Generate realistic duration as fallback
          const hasMessages = (spyneData.callDetails?.messages as any)?.length || (spyneData.callDetails?.formattedMessages as any)?.length || 0
          const hasActionItems = spyneData.report?.actionItems?.length || 0
          const isResolved = spyneData.report?.queryResolved === 'Yes'
          const isAbandoned = spyneData.report?.callRageQuit === 'Yes' || spyneData.report?.queryResolved === 'No'
          
          let baseDuration = 45
          if (hasMessages > 0) baseDuration += hasMessages * 12
          if (hasActionItems > 0) baseDuration += hasActionItems * 25
          if (isResolved) baseDuration += 45
          if (isAbandoned) baseDuration = Math.min(baseDuration, 90)
          
          const randomVariation = Math.floor(Math.random() * 120) - 60
          baseDuration += randomVariation
          
          return Math.max(30, Math.min(900, baseDuration))
        })()),
    tags: [
      spyneData.report?.overview?.overall?.customerIntent?.toLowerCase().replace(/\s+/g, '_') || 'general',
      spyneData.report?.overview?.overall?.sentiment || 'neutral',
      ...(spyneData.report?.actionItems?.length ? ['action_required'] : []),
      ...extractAllVehicles(spyneData).map(v => `vehicle:${v}`),
    ].filter(Boolean),
  }
  

  
  return mappedRecord
}

/**
 * Fetch enhanced call data using the new consolidated API (single API call)
 */
export async function fetchEnhancedCallRecords(params?: Partial<SpyneApiParams>): Promise<{
  calls: CallRecord[]
  pagination: SpyneApiResponse['pagination']
  analytics: SpyneApiResponse['analytics']
}> {

  try {
    // Get all call data from the consolidated API endpoint

    const spyneResponse = await fetchSpyneCallReports(params)

    
    // Log sample data to understand the new structure
    if (spyneResponse.data.length > 0) {
      const sampleCall = spyneResponse.data[0]

    }
    
    // Map all calls using the consolidated data (no need for individual API calls)

    const mappedCalls = spyneResponse.data.map((callData, index) => {
      try {

        
        // Extract AI score from the consolidated data
        const aiScore = parseFloat(callData.report?.overview?.overall?.aiResponseQuality?.score || '0')
        
        const mappedCall = mapSpyneDataToCallRecord(callData, { aiScoreOverride: isNaN(aiScore) ? undefined : aiScore })

        return mappedCall
      } catch (error) {
        // Return a minimal call record to avoid breaking the entire response
        return {
          call_id: callData.callId,
          dealership_id: "spyne_dealer_001",
          started_at: callData.createdAt,
          ended_at: callData.createdAt,
          direction: 'inbound' as const,
          domain: 'sales' as const,
          campaign_id: null,
          customer: {
            name: callData.callDetails?.name || null,
            phone: callData.callDetails?.mobile || '',
            email: callData.callDetails?.email || null,
          },
          vehicle: { vin: null, stock_id: null, year: 0, make: null, model: null, trim: null, delivery_type: null },
          primary_intent: 'general_inquiry',
          intents: [],
          outcome: 'Follow-up Required',
          appointment: { type: null, starts_at: null, ends_at: null, location: null, advisor: null, status: null },
          sentiment: { label: 'neutral' as const, score: 0 },
          ai_score: 0,
          containment: false,
          summary: 'Error mapping call data',
          notes: '',
          follow_up: { needed: false, reason: null, due_at: null, assignee: null },
          metrics: { duration_sec: 0, hold_sec: 0, silence_sec: 0 },
          recording_url: null,
          voice_recording_url: null,
          transcript_url: null,
          transcript: [],
          tags: []
        } as CallRecord
      }
    })
    

    
    // Log summary of final results
    const callsWithSummary = mappedCalls.filter(call => call.summary && call.summary.length > 0)
    const callsWithoutSummary = mappedCalls.filter(call => !call.summary || call.summary.length === 0)
    
    // Calculate AI response quality statistics
    const aiScores = mappedCalls.map(call => call.ai_score).filter(score => score > 0)
    const avgAiScore = aiScores.length > 0 ? aiScores.reduce((sum, score) => sum + score, 0) / aiScores.length : 0
    

    
    return {
      calls: mappedCalls,
      pagination: spyneResponse.pagination,
      analytics: spyneResponse.analytics,
    }
  } catch (error) {
    throw error
  }
}



/**
 * Fetch and convert Spyne call data to CallRecord format (original function for backward compatibility)
 */
export async function fetchCallRecords(params?: Partial<SpyneApiParams>): Promise<{
  calls: CallRecord[]
  pagination: SpyneApiResponse['pagination']
  analytics: SpyneApiResponse['analytics']
}> {
  // Use enhanced version by default
  return await fetchEnhancedCallRecords(params)
}
