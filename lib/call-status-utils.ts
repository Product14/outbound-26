/**
 * Utility functions for generating realistic call statuses and appointments
 */

export type CallStatus = 'Connected' | 'Voice Mail' | 'Failed';

// Sales Call Outcomes
export type SalesCallOutcome =
  | 'Test Drive Scheduled'
  | 'Test Drive Rescheduled'
  | 'Test Drive Cancelled'
  | 'Appointment for Purchase Discussion Scheduled'
  | 'Purchase Confirmed'
  | 'Order/Delivery Status Confirmed'
  | 'Sale Lost/Not Interested'
  | 'Follow-up Required'
  | 'No Availability Found'
  | 'Call Aborted'
  | 'Promotional Offer Accepted'
  | 'Promotional Offer Declined'
  | 'Financing/Leasing Approved'
  | 'Financing/Leasing Declined'
  | 'Trade-in Accepted'
  | 'Trade-in Declined'
  | 'Inventory Waitlist Created'
  | 'Customer Transferred to Salesperson/Manager';

// Service Call Outcomes
export type ServiceCallOutcome =
  | 'Service Appointment Scheduled'
  | 'Service Appointment Booked'
  | 'Service Appointment Rescheduled'
  | 'Connect with Service Team'
  | 'Engaged – Needs Reconnect'
  | 'Follow-Up Required'
  | 'Drop Off/Pickup Info Shared'
  | 'Loaner Info Shared'
  | 'General Information Shared'
  | 'Transferred to Human'
  | 'No Empty Slots'
  | 'Call Disconnected'
  | 'Service Appointment Cancelled'
  | 'Recall Appointment Scheduled'
  | 'Maintenance Appointment Scheduled'
  | 'Repair Completed/Confirmed'
  | 'Drop-off/Pickup Scheduled'
  | 'Loaner Vehicle Confirmed'
  | 'Warranty Service Approved'
  | 'Warranty Renewal/Extension Accepted'
  | 'Warranty Renewal/Extension Declined'
  | 'Insurance Claim Initiated'
  | 'Complaint Logged'
  | 'Service Discount Accepted'
  | 'Service Discount Declined'
  | 'No Availability Found'
  | 'Call Aborted'
  | 'Customer Declined Service';

// SMS Outcomes
export type SmsOutcome =
  | 'SMS Replied'
  | 'SMS Opted Out'
  | 'SMS No Reply'
  | 'SMS Delivered'
  | 'SMS Appointment Confirmed via SMS'
  | 'SMS Callback Requested via SMS'
  | 'SMS Interested – Follow-up Needed'
  | 'SMS Not Interested';

// Combined call outcome type
export type CallOutcome = SalesCallOutcome | ServiceCallOutcome | SmsOutcome | 'Success' | 'Callback Requested' | 'Not Interested' | 'Wrong Number' | 'No Answer' | 'Follow-up Requested';

export const SMS_OUTCOMES: SmsOutcome[] = [
  'SMS Replied',
  'SMS Delivered',
  'SMS No Reply',
  'SMS Opted Out',
  'SMS Appointment Confirmed via SMS',
  'SMS Callback Requested via SMS',
  'SMS Interested – Follow-up Needed',
  'SMS Not Interested',
];

export type AppointmentStatus = 'Yes' | 'No';

export interface CallStatusResult {
  status: CallStatus;
  outcome: CallOutcome;
  appointment: AppointmentStatus;
}

// Utility functions for call outcomes
export const SALES_OUTCOMES: SalesCallOutcome[] = [
  'Test Drive Scheduled',
  'Test Drive Rescheduled',
  'Test Drive Cancelled',
  'Appointment for Purchase Discussion Scheduled',
  'Purchase Confirmed',
  'Order/Delivery Status Confirmed',
  'Sale Lost/Not Interested',
  'Follow-up Required',
  'No Availability Found',
  'Call Aborted',
  'Promotional Offer Accepted',
  'Promotional Offer Declined',
  'Financing/Leasing Approved',
  'Financing/Leasing Declined',
  'Trade-in Accepted',
  'Trade-in Declined',
  'Inventory Waitlist Created',
  'Customer Transferred to Salesperson/Manager'
];

export const SERVICE_OUTCOMES: ServiceCallOutcome[] = [
  'Service Appointment Scheduled',
  'Service Appointment Booked',
  'Service Appointment Rescheduled',
  'Connect with Service Team',
  'Engaged – Needs Reconnect',
  'Follow-Up Required',
  'Drop Off/Pickup Info Shared',
  'Loaner Info Shared',
  'General Information Shared',
  'Transferred to Human', 
  'No Empty Slots',
  'Call Disconnected',
  'Service Appointment Cancelled',
  'Recall Appointment Scheduled',
  'Maintenance Appointment Scheduled',
  'Repair Completed/Confirmed',
  'Drop-off/Pickup Scheduled',
  'Loaner Vehicle Confirmed',
  'Warranty Service Approved',
  'Warranty Renewal/Extension Accepted',
  'Warranty Renewal/Extension Declined',
  'Insurance Claim Initiated',
  'Complaint Logged',
  'Service Discount Accepted',
  'Service Discount Declined',
  'No Availability Found',
  'Call Aborted',
  'Customer Declined Service',
];

/**
 * Determines if an outcome is a sales-related outcome
 */
export function isSalesOutcome(outcome: CallOutcome): outcome is SalesCallOutcome {
  return SALES_OUTCOMES.includes(outcome as SalesCallOutcome);
}

/**
 * Determines if an outcome is a service-related outcome
 */
export function isServiceOutcome(outcome: CallOutcome): outcome is ServiceCallOutcome {
  return SERVICE_OUTCOMES.includes(outcome as ServiceCallOutcome);
}

/**
 * Gets all outcomes for a specific call type (sales or service)
 */
export function getOutcomesByType(type: 'sales' | 'service'): CallOutcome[] {
  return type === 'sales' ? SALES_OUTCOMES : SERVICE_OUTCOMES;
}

/**
 * Determines if an outcome represents a successful appointment or action
 */
export function isPositiveOutcome(outcome: CallOutcome): boolean {
  const positiveOutcomes: CallOutcome[] = [
    'Test Drive Scheduled',
    'Appointment for Purchase Discussion Scheduled',
    'Purchase Confirmed',
    'Order/Delivery Status Confirmed',
    'Promotional Offer Accepted',
    'Financing/Leasing Approved',
    'Trade-in Accepted',
    'Inventory Waitlist Created',
    'Service Appointment Scheduled',
    'Recall Appointment Scheduled',
    'Maintenance Appointment Scheduled',
    'Repair Completed/Confirmed',
    'Drop-off/Pickup Scheduled',
    'Loaner Vehicle Confirmed',
    'Warranty Service Approved',
    'Warranty Renewal/Extension Accepted',
    'Insurance Claim Initiated',
    'Service Discount Accepted',
    'Success'
  ];

  return positiveOutcomes.includes(outcome);
}

/**
 * Determines if an outcome requires follow-up action
 */
export function requiresFollowUp(outcome: CallOutcome): boolean {
  const followUpOutcomes: CallOutcome[] = [
    'Follow-up Required',
    'Test Drive Rescheduled',
    'Service Appointment Rescheduled',
    'Callback Requested',
    'Customer Transferred to Salesperson/Manager',
    'Complaint Logged',
    'No Availability Found'
  ];

  return followUpOutcomes.includes(outcome);
}

/**
 * Gets the category of an outcome (sales, service, or general)
 */
export function getOutcomeCategory(outcome: CallOutcome): 'sales' | 'service' | 'general' {
  if (isSalesOutcome(outcome)) return 'sales';
  if (isServiceOutcome(outcome)) return 'service';
  return 'general';
}

/**
 * Generates deterministic call status based on call index
 * 60% Connected, 20% Voice Mail, 20% Failed
 * Only Connected calls can have appointments
 * 
 * @param callIndex - Index of the call (0-based)
 * @param totalCalls - Total number of calls for better distribution
 * @param campaignType - Type of campaign ('sales' or 'service') to determine appropriate outcomes
 * @returns CallStatusResult with status, outcome, and appointment
 */
export function generateCallStatus(callIndex: number, totalCalls: number, campaignType: 'sales' | 'service' = 'sales'): CallStatusResult {
  // Calculate the actual distribution based on totalCalls
  const connectedCount = Math.ceil(totalCalls * 0.6); // 60% Connected
  const voiceMailCount = Math.floor(totalCalls * 0.2); // 20% Voice Mail  
  const failedCount = totalCalls - connectedCount - voiceMailCount; // Remaining Failed

  let status: CallStatus;
  let outcome: CallOutcome;
  let appointment: AppointmentStatus = 'No';

  // Get appropriate outcomes based on campaign type
  const availableOutcomes = getOutcomesByType(campaignType);
  const positiveOutcomes = availableOutcomes.filter(isPositiveOutcome);
  const followUpOutcomes = availableOutcomes.filter(requiresFollowUp);
  const negativeOutcomes = availableOutcomes.filter(o => !isPositiveOutcome(o) && !requiresFollowUp(o));

  // Distribute statuses based on actual call position
  if (callIndex < connectedCount) {
    status = 'Connected';

    // For Connected calls, vary the outcomes based on campaign type
    const outcomeDistribution = callIndex % 10;
    if (outcomeDistribution < 4) {
      // 40% positive outcomes
      outcome = positiveOutcomes[callIndex % positiveOutcomes.length];
      // 70% of positive outcomes get appointments
      appointment = (callIndex % 10) < 7 ? 'Yes' : 'No';
    } else if (outcomeDistribution < 6) {
      // 20% follow-up required outcomes
      outcome = followUpOutcomes.length > 0 ? followUpOutcomes[callIndex % followUpOutcomes.length] : 'Follow-up Required';
      // 30% of follow-up outcomes get appointments
      appointment = (callIndex % 10) < 3 ? 'Yes' : 'No';
    } else if (outcomeDistribution < 8) {
      // 20% callback/general outcomes
      outcome = 'Callback Requested';
      appointment = (callIndex % 10) < 3 ? 'Yes' : 'No';
    } else {
      // 20% negative outcomes
      if (negativeOutcomes.length > 0) {
        outcome = negativeOutcomes[callIndex % negativeOutcomes.length];
      } else {
        outcome = campaignType === 'sales' ? 'Sale Lost/Not Interested' : 'Customer Declined Service';
      }
      appointment = 'No';
    }
  } else if (callIndex < connectedCount + voiceMailCount) {
    status = 'Voice Mail';
    outcome = 'No Answer';
    appointment = 'No';
  } else {
    status = 'Failed';

    // For failed calls, vary the outcomes
    const failureType = callIndex % 4;
    switch (failureType) {
      case 0:
        outcome = 'Wrong Number';
        break;
      case 1:
        outcome = 'No Answer';
        break;
      case 2:
        outcome = 'Call Aborted';
        break;
      case 3:
        outcome = campaignType === 'sales' ? 'Sale Lost/Not Interested' : 'Customer Declined Service';
        break;
      default:
        outcome = 'No Answer';
    }
    appointment = 'No';
  }

  return { status, outcome, appointment };
}

/**
 * Calculates overall campaign statistics based on call statuses
 * @param totalCalls - Total number of calls
 * @param campaignType - Type of campaign ('sales' or 'service')
 * @returns Object with answer rate and appointment count
 */
export function calculatecampaignStatus(totalCalls: number, campaignType: 'sales' | 'service' = 'sales'): {
  answerRate: number;
  appointmentCount: number;
  avgCallDuration: string;
  successRate: number;
  failedCalls: number;
  noAnswerCalls: number;
  followUpRequested: number;
  followUpSuccessRate: number;
  salesConversionRate: number;
  callsMade: number;
  callsAnswered: number;
} {
  let connectedCalls = 0;
  let appointmentCount = 0;
  let totalDurationSeconds = 0;
  let successfulCalls = 0;
  let failedCalls = 0;
  let noAnswerCalls = 0;
  let followUpRequested = 0;
  let followUpAppointments = 0;

  for (let i = 0; i < totalCalls; i++) {
    const result = generateCallStatus(i, totalCalls, campaignType);
    const duration = generateCallDuration(i, result.status);

    // Convert duration string (MM:SS) to seconds
    const [minutes, seconds] = duration.split(':').map(Number);
    totalDurationSeconds += (minutes * 60) + seconds;

    if (result.status === 'Connected') {
      connectedCalls++;
    }

    if (result.appointment === 'Yes') {
      appointmentCount++;
      successfulCalls++;
    }

    if (result.status === 'Failed') {
      failedCalls++;
    }

    if (result.outcome === 'No Answer') {
      noAnswerCalls++;
    }

    if (requiresFollowUp(result.outcome)) {
      followUpRequested++;
      if (result.appointment === 'Yes') {
        followUpAppointments++;
      }
    }
  }

  const answerRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;
  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;
  const followUpSuccessRate = followUpRequested > 0 ? Math.round((followUpAppointments / followUpRequested) * 100) : 0;
  const salesConversionRate = totalCalls > 0 ? Math.round((appointmentCount / totalCalls) * 100) : 0;

  // Calculate average duration
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;
  const avgMinutes = Math.floor(avgDurationSeconds / 60);
  const avgSeconds = avgDurationSeconds % 60;
  const avgCallDuration = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;

  return {
    answerRate,
    appointmentCount,
    avgCallDuration,
    successRate,
    failedCalls,
    noAnswerCalls,
    followUpRequested,
    followUpSuccessRate,
    salesConversionRate,
    callsMade: totalCalls,
    callsAnswered: connectedCalls
  };
}

/**
 * Generates call time for a specific call index
 * @param callIndex - Index of the call
 * @param campaignStartDate - When the campaign started
 * @returns ISO string of call time
 */
export function generateCallTime(callIndex: number, campaignStartDate: string): string {
  const startDate = new Date(campaignStartDate);

  // Spread calls over time (roughly 1 call every 10 seconds as per estimation)
  const callTimeOffset = callIndex * 60 * 1000; // 10 seconds in milliseconds

  const callTime = new Date(startDate.getTime() + callTimeOffset);
  return callTime.toISOString();
}

/**
 * Generates call duration in MM:SS format
 * @param callIndex - Index of the call
 * @param status - Call status affects duration
 * @returns Duration string in MM:SS format
 */
export function generateCallDuration(callIndex: number, status: CallStatus): string {
  let baseDurationSeconds: number;

  switch (status) {
    case 'Connected':
      // Connected calls: 2-8 minutes (120-480 seconds)
      baseDurationSeconds = 120 + (callIndex % 361); // 361 gives range 120-480
      break;
    case 'Voice Mail':
      // Voice mail: 30-90 seconds
      baseDurationSeconds = 30 + (callIndex % 61); // 61 gives range 30-90
      break;
    case 'Failed':
      // Failed calls: 5-30 seconds
      baseDurationSeconds = 5 + (callIndex % 26); // 26 gives range 5-30
      break;
    default:
      baseDurationSeconds = 60;
  }

  const minutes = Math.floor(baseDurationSeconds / 60);
  const seconds = baseDurationSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Generates mock vehicle performance data for sales campaigns
 * @param totalAppointments - Total appointments scheduled
 * @returns Array of vehicles with appointment counts
 */
export function generateTopPerformingVehicles(totalAppointments: number): Array<{
  vehicle: string;
  appointments: number;
  percentage: number;
}> {
  const vehicles = [
    'Toyota Camry',
    'Honda Civic',
    'Ford F-150',
    'Chevrolet Silverado',
    'Honda Accord',
    'Toyota Corolla',
    'Nissan Altima',
    'Ford Escape',
    'Chevrolet Equinox',
    'Toyota RAV4'
  ];

  // Distribute appointments among vehicles with realistic distribution
  const distribution = [0.22, 0.18, 0.15, 0.12, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02];

  return vehicles.slice(0, Math.min(6, vehicles.length)).map((vehicle, index) => {
    const appointments = Math.max(1, Math.round(totalAppointments * distribution[index]));
    const percentage = totalAppointments > 0 ? Math.round((appointments / totalAppointments) * 100) : 0;

    return {
      vehicle,
      appointments,
      percentage
    };
  }).filter(v => v.appointments > 0).sort((a, b) => b.appointments - a.appointments);
}

/**
 * Generates mock time-based performance data for charts
 * @returns Array of hourly performance data
 */
export function generatePerformanceTimeData(): Array<{
  hour: string;
  calls: number;
  appointments: number;
  successRate: number;
}> {
  const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

  return hours.map((hour, index) => {
    // Peak performance around 10-11 AM and 2-3 PM
    const peakMultiplier = (index === 1 || index === 2 || index === 5 || index === 6) ? 1.5 : 1.0;
    const baseCalls = Math.round(27 * peakMultiplier); // Fixed base of 27 instead of random 20-35
    const appointments = Math.round(baseCalls * 0.2 * peakMultiplier); // Fixed 20% conversion rate
    const successRate = baseCalls > 0 ? Math.round((appointments / baseCalls) * 100) : 0;

    return {
      hour,
      calls: baseCalls,
      appointments,
      successRate
    };
  });
}

export function generateTopPerformingServices(totalAppointments: number): Array<{
  service: string;
  appointments: number;
  percentage: number;
}> {
  const services = [
    'Oil Change',
    'Tire Rotation',
    'Brake Inspection',
    'Battery Check',
    'Transmission Service',
    'AC Service',
    'Engine Tune-up',
    'Wheel Alignment'
  ];

  let remainingAppointments = totalAppointments;
  const result = services.map((service, index) => {
    // Generate decreasing percentages for top services (fixed values)
    const basePercentage = Math.max(5, 35 - (index * 4));
    const percentage = basePercentage; // Remove variance for consistency

    const appointments = Math.round((totalAppointments * percentage) / 100);
    remainingAppointments -= appointments;

    return {
      service,
      appointments,
      percentage: Math.round(percentage)
    };
  });

  // Sort by appointments descending
  result.sort((a, b) => b.appointments - a.appointments);

  return result.slice(0, 5);
}
