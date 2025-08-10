/**
 * Utility functions for generating realistic call statuses and appointments
 */

export type CallStatus = 'Connected' | 'Voice Mail' | 'Failed';
export type CallOutcome = 'Success' | 'Callback Requested' | 'Not Interested' | 'Wrong Number' | 'No Answer';
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
    const outcomeDistribution = callIndex % 4;
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
} {
  let connectedCalls = 0;
  let appointmentCount = 0;
  let totalDurationSeconds = 0;
  
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
    }
  }
  
  const answerRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;
  
  // Calculate average duration
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;
  const avgMinutes = Math.floor(avgDurationSeconds / 60);
  const avgSeconds = avgDurationSeconds % 60;
  const avgCallDuration = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
  
  return { answerRate, appointmentCount, avgCallDuration };
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
  const callTimeOffset = callIndex * 10 * 1000; // 10 seconds in milliseconds
  
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
