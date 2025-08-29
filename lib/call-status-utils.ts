/**
 * Utility functions for generating realistic call statuses and appointments
 */

export type CallStatus = 'Connected' | 'Voice Mail' | 'Failed';
export type CallOutcome = 'Success' | 'Callback Requested' | 'Not Interested' | 'Wrong Number' | 'No Answer' | 'Follow-up Requested';
export type AppointmentStatus = 'Yes' | 'No';

export interface CallStatusResult {
  status: CallStatus;
  outcome: CallOutcome;
  appointment: AppointmentStatus;
}

/**
 * Generates deterministic call status based on call index
 * 60% Connected, 20% Voice Mail, 20% Failed
 * Only Connected calls can have appointments
 * 
 * @param callIndex - Index of the call (0-based)
 * @param totalCalls - Total number of calls for better distribution
 * @returns CallStatusResult with status, outcome, and appointment
 */
export function generateCallStatus(callIndex: number, totalCalls: number): CallStatusResult {
  // Calculate the actual distribution based on totalCalls
  const connectedCount = Math.ceil(totalCalls * 0.6); // 60% Connected
  const voiceMailCount = Math.floor(totalCalls * 0.2); // 20% Voice Mail  
  const failedCount = totalCalls - connectedCount - voiceMailCount; // Remaining Failed
  
  let status: CallStatus;
  let outcome: CallOutcome;
  let appointment: AppointmentStatus = 'No';
  
  // Distribute statuses based on actual call position
  if (callIndex < connectedCount) {
    status = 'Connected';
    
    // For Connected calls, vary the outcomes
    const outcomeDistribution = callIndex % 5;
    switch (outcomeDistribution) {
      case 0:
      case 1:
        outcome = 'Success';
        // 70% of successful connected calls get appointments
        appointment = (callIndex % 10) < 7 ? 'Yes' : 'No';
        break;
      case 2:
        outcome = 'Callback Requested';
        // 30% of callback requests get appointments
        appointment = (callIndex % 10) < 3 ? 'Yes' : 'No';
        break;
      case 3:
        outcome = 'Follow-up Requested';
        // 40% of follow-up requests eventually get appointments
        appointment = (callIndex % 10) < 4 ? 'Yes' : 'No';
        break;
      case 4:
        outcome = 'Not Interested';
        appointment = 'No';
        break;
      default:
        outcome = 'Success';
        appointment = (callIndex % 10) < 7 ? 'Yes' : 'No';
    }
  } else if (callIndex < connectedCount + voiceMailCount) {
    status = 'Voice Mail';
    outcome = 'No Answer';
    appointment = 'No';
  } else {
    status = 'Failed';
    
    // For failed calls, vary the outcomes
    const failureType = callIndex % 3;
    switch (failureType) {
      case 0:
        outcome = 'Wrong Number';
        break;
      case 1:
        outcome = 'No Answer';
        break;
      case 2:
        outcome = 'Not Interested';
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
 * @returns Object with answer rate and appointment count
 */
export function calculateCampaignStats(totalCalls: number): {
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
    const result = generateCallStatus(i, totalCalls);
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
    
    if (result.outcome === 'Follow-up Requested') {
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
    const baseCalls = Math.round((20 + Math.random() * 15) * peakMultiplier);
    const appointments = Math.round(baseCalls * (0.15 + Math.random() * 0.1) * peakMultiplier);
    const successRate = baseCalls > 0 ? Math.round((appointments / baseCalls) * 100) : 0;
    
    return {
      hour,
      calls: baseCalls,
      appointments,
      successRate
    };
  });
}
