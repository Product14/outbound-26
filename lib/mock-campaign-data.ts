import type { CallRecord } from '@/types/call-record'
import { CallOutcome } from '@/lib/call-status-utils'

const customerNames = [
  "Andrew Ray", "Sarah Johnson", "Michael Chen", "Emily Davis", "David Wilson",
  "Jessica Martinez", "Robert Taylor", "Amanda Brown", "Christopher Lee", "Michelle Garcia",
  "Daniel Rodriguez", "Lisa Anderson", "James Thompson", "Jennifer White", "Matthew Clark",
  "Ashley Lewis", "John Walker", "Stephanie Hall", "Ryan Young", "Nicole King",
  "Kevin Wright", "Rachel Green", "Steven Adams", "Lauren Baker", "Brian Nelson",
  "Megan Carter", "Anthony Mitchell", "Samantha Perez", "Joshua Roberts", "Kimberly Turner"
]

const phoneNumbers = [
  "+1-(919)-369-0815", "+1-(555)-123-4567", "+1-(404)-555-0123", "+1-(212)-555-0198",
  "+1-(310)-555-0156", "+1-(713)-555-0134", "+1-(602)-555-0187", "+1-(305)-555-0145",
  "+1-(206)-555-0167", "+1-(617)-555-0189", "+1-(312)-555-0176", "+1-(214)-555-0143",
  "+1-(702)-555-0198", "+1-(503)-555-0132", "+1-(415)-555-0165"
]

const vehicles = [
  { year: 2023, make: "Toyota", model: "Camry" },
  { year: 2022, make: "Honda", model: "Civic" },
  { year: 2024, make: "Ford", model: "F-150" },
  { year: 2021, make: "Chevrolet", model: "Malibu" },
  { year: 2023, make: "Nissan", model: "Altima" },
  { year: 2022, make: "Hyundai", model: "Elantra" },
  { year: 2024, make: "Kia", model: "Optima" },
  { year: 2021, make: "Subaru", model: "Outback" },
  { year: 2023, make: "Mazda", model: "CX-5" },
  { year: 2022, make: "Volkswagen", model: "Jetta" }
]

const agentNames = ["Kylie", "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery"]

/**
 * Generates comprehensive mock call data for testing metrics
 */
export function generateMockCampaignCalls(
  totalCalls: number = 100,
  campaignType: 'sales' | 'service' = 'sales'
): CallRecord[] {
  const calls: CallRecord[] = []
  
  // Define outcome distribution based on campaign type
  const outcomeDistribution: Record<string, number> = campaignType === 'sales' 
    ? {
        'Test Drive Scheduled': 0.15,
        'Follow-up Required': 0.18,
        'Not Interested': 0.20,
        'No Answer': 0.25,
        'Call Aborted': 0.10,
        'Sale Lost/Not Interested': 0.12
      }
    : {
        'Service Appointment Scheduled': 0.25,
        'Maintenance Appointment Scheduled': 0.20,
        'Follow-up Required': 0.15,
        'No Answer': 0.18,
        'Call Aborted': 0.07,
        'Repair Completed/Confirmed': 0.15
      }

  for (let i = 0; i < totalCalls; i++) {
    const randomOutcome = getWeightedRandomOutcome(outcomeDistribution)
    const customer = customerNames[Math.floor(Math.random() * customerNames.length)]
    const phone = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)]
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]
    const agent = agentNames[Math.floor(Math.random() * agentNames.length)]
    
    // Generate call time (spread over last 24 hours)
    const callTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    const endTime = new Date(callTime.getTime() + (Math.random() * 300 + 30) * 1000) // 30-330 seconds
    
    // Determine sentiment and AI score based on outcome
    let sentiment: { label: "positive" | "neutral" | "negative" | "angry", score: number }
    let aiScore: number
    let followUpNeeded = false
    
    switch (randomOutcome) {
      case 'Service Appointment Scheduled':
      case 'Test Drive Scheduled':
      case 'Maintenance Appointment Scheduled':
        sentiment = { label: "positive", score: 0.7 + Math.random() * 0.3 }
        aiScore = 7.5 + Math.random() * 2.5
        break
      case 'Follow-up Required':
        sentiment = { label: Math.random() > 0.3 ? "positive" : "neutral", score: 0.4 + Math.random() * 0.4 }
        aiScore = 6.5 + Math.random() * 2.0
        followUpNeeded = true
        break
      case 'Repair Completed/Confirmed':
        sentiment = { label: "neutral", score: 0.5 + Math.random() * 0.3 }
        aiScore = 7.0 + Math.random() * 2.0
        break
      case 'Not Interested':
      case 'Sale Lost/Not Interested':
        sentiment = { label: Math.random() > 0.7 ? "negative" : "neutral", score: 0.2 + Math.random() * 0.4 }
        aiScore = 6.0 + Math.random() * 2.0
        break
      case 'No Answer':
        sentiment = { label: "neutral", score: 0.5 }
        aiScore = 0 // No AI interaction
        break
      case 'Call Aborted':
        sentiment = { label: "neutral", score: 0.5 }
        aiScore = 0 // No AI interaction
        break
      default:
        sentiment = { label: "neutral", score: 0.5 }
        aiScore = 7.0
    }

    const call: CallRecord = {
      call_id: `call-${i + 1}`,
      dealership_id: "dealership-001",
      started_at: callTime.toISOString(),
      ended_at: endTime.toISOString(),
      direction: "outbound",
      domain: campaignType as "sales" | "service",
      campaign_id: "campaign-001",
      customer: { 
        name: customer, 
        phone: phone, 
        email: Math.random() > 0.7 ? `${customer.toLowerCase().replace(' ', '.')}@email.com` : null 
      },
      vehicle: { 
        vin: null, 
        stock_id: `STK-${Math.floor(Math.random() * 10000)}`, 
        year: vehicle.year, 
        make: vehicle.make, 
        model: vehicle.model, 
        trim: null, 
        delivery_type: null 
      },
      primary_intent: campaignType === 'sales' ? "sales_inquiry" : "service_appointment",
      intents: [],
      outcome: randomOutcome as CallOutcome,
      sentiment: sentiment,
      appointment: randomOutcome.includes('Scheduled') ? { 
        type: campaignType === 'sales' ? "test_drive" : "service", 
        starts_at: null, 
        ends_at: null, 
        location: null, 
        advisor: null, 
        status: "scheduled" 
      } : null,
      follow_up: { 
        needed: followUpNeeded, 
        reason: followUpNeeded ? "Customer requested callback" : null, 
        assignee: followUpNeeded ? agent : null, 
        due_at: followUpNeeded ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null 
      },
      ai_score: Math.round(aiScore * 10) / 10,
      containment: randomOutcome !== 'Follow-up Required',
      summary: generateCallSummary(randomOutcome, customer, campaignType),
      notes: `Call handled by ${agent}`,
      metrics: { 
        duration_sec: Math.floor((endTime.getTime() - callTime.getTime()) / 1000), 
        hold_sec: Math.floor(Math.random() * 30), 
        silence_sec: Math.floor(Math.random() * 15) 
      },
      recording_url: null,
      voice_recording_url: null,
      transcript_url: null,
      transcript: [],
      tags: [],
      agentInfo: { agentName: agent, agentType: "AI Agent" }
    }

    calls.push(call)
  }

  return calls
}

function getWeightedRandomOutcome(distribution: Record<string, number>): string {
  const random = Math.random()
  let cumulative = 0
  
  for (const [outcome, weight] of Object.entries(distribution)) {
    cumulative += weight
    if (random <= cumulative) {
      return outcome
    }
  }
  
  return Object.keys(distribution)[0] // Fallback
}

function generateCallSummary(outcome: string, customerName: string, campaignType: string): string {
  const summaries: Record<string, string[]> = {
    'Service Appointment Scheduled': [
      `${customerName} scheduled a service appointment for routine maintenance.`,
      `Successfully booked ${customerName} for an upcoming service visit.`,
      `${customerName} confirmed availability for service appointment next week.`
    ],
    'Test Drive Scheduled': [
      `${customerName} expressed interest and scheduled a test drive.`,
      `Successfully scheduled test drive appointment with ${customerName}.`,
      `${customerName} is interested in the vehicle and booked a test drive.`
    ],
    'Maintenance Appointment Scheduled': [
      `${customerName} booked a maintenance appointment as recommended.`,
      `Successfully scheduled maintenance service for ${customerName}.`,
      `${customerName} confirmed maintenance appointment for next available slot.`
    ],
    'Follow-up Required': [
      `${customerName} needs more time to consider. Follow-up scheduled.`,
      `Customer requested callback to discuss options further.`,
      `${customerName} interested but needs to consult with family first.`
    ],
    'Repair Completed/Confirmed': [
      `Confirmed repair completion with ${customerName}.`,
      `${customerName} satisfied with completed service work.`,
      `Successfully updated ${customerName} on repair status.`
    ],
    'Not Interested': [
      `${customerName} is not interested at this time.`,
      `Customer declined services and requested no further contact.`,
      `${customerName} not currently in the market for our services.`
    ],
    'Sale Lost/Not Interested': [
      `${customerName} decided not to proceed with purchase.`,
      `Customer declined sales offer and is not interested.`,
      `${customerName} not moving forward with vehicle purchase.`
    ],
    'No Answer': [
      `No answer from ${customerName}, left voicemail.`,
      `Unable to reach ${customerName} - voicemail left.`,
      `${customerName} did not answer, message left.`
    ],
    'Call Aborted': [
      `Call to ${customerName} was disconnected.`,
      `Technical issue caused call termination.`,
      `Call dropped before connecting with ${customerName}.`
    ]
  }

  const options = summaries[outcome] || [`Call completed with ${customerName}.`]
  return options[Math.floor(Math.random() * options.length)]
}
