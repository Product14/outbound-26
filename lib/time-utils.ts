/**
 * Utility functions for calculating and formatting estimated campaign time
 */

/**
 * Calculates estimated campaign time based on total calls
 * Each call takes 60 seconds (1 minute)
 * @param totalCalls - Total number of calls in the campaign
 * @returns Estimated time in seconds
 */
export function calculateEstimatedTimeInSeconds(totalCalls: number): number {
  return totalCalls * 60; // 60 seconds per call
}

/**
 * Formats time in seconds to a human-readable format
 * @param seconds - Time in seconds
 * @returns Formatted string (e.g., "2 minutes 30 seconds", "1 hour 15 minutes")
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Calculates and formats estimated campaign time
 * @param totalCalls - Total number of calls in the campaign
 * @returns Formatted estimated time string
 */
export function calculateAndFormatEstimatedTime(totalCalls: number): string {
  const estimatedSeconds = calculateEstimatedTimeInSeconds(totalCalls);
  return formatEstimatedTime(estimatedSeconds);
}

/**
 * Gets a short format for estimated time (used in compact displays)
 * @param totalCalls - Total number of calls in the campaign
 * @returns Short formatted string (e.g., "2m 30s", "1h 15m")
 */
export function getShortEstimatedTime(totalCalls: number): string {
  const seconds = calculateEstimatedTimeInSeconds(totalCalls);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculates the end date based on start date and estimated duration
 * @param startDate - The campaign start date
 * @param totalCalls - Total number of calls in the campaign
 * @returns End date as a Date object
 */
export function calculateEndDate(startDate: Date, totalCalls: number): Date {
  const estimatedSeconds = calculateEstimatedTimeInSeconds(totalCalls);
  const endDate = new Date(startDate);
  endDate.setSeconds(endDate.getSeconds() + estimatedSeconds);
  return endDate;
}

/**
 * Formats a time range for display with improved US formatting
 * @param startDate - The campaign start date
 * @param endDate - The campaign end date
 * @returns Formatted time range string optimized for US users
 */
export function formatTimeRange(startDate: Date, endDate: Date): string {
  // If same date, show: "October 3, 2023 • 11:18 AM - 2:18 PM"
  if (startDate.toDateString() === endDate.toDateString()) {
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const endTime = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    const dateStr = startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${dateStr} • ${startTime} - ${endTime}`;
  }
  
  // Different dates - check if same year
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  
  if (sameYear) {
    // Same year: "October 3 - October 5, 2023"
    const startDateStr = startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
    const endDateStr = endDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${startDateStr} - ${endDateStr}`;
  } else {
    // Different years: "October 3, 2023 - January 5, 2024"
    const startDateStr = startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const endDateStr = endDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${startDateStr} - ${endDateStr}`;
  }
}

/**
 * Calculates and formats a time range for a campaign
 * @param startDate - The campaign start date
 * @param totalCalls - Total number of calls in the campaign
 * @returns Formatted time range string
 */
export function calculateAndFormatTimeRange(startDate: Date, totalCalls: number): string {
  const endDate = calculateEndDate(startDate, totalCalls);
  return formatTimeRange(startDate, endDate);
}

/**
 * Gets estimated time in minutes for display during campaign creation
 * @param totalCalls - Total number of calls in the campaign
 * @returns Estimated time in minutes as a string
 */
export function getEstimatedTimeInMinutes(totalCalls: number): string {
  const seconds = calculateEstimatedTimeInSeconds(totalCalls);
  const minutes = Math.round(seconds / 60);
  return `${minutes} minutes`;
}

/**
 * Converts daily time slots to the API format with proper HH:MM formatting
 * Time slots are sent as local time in HH:MM format (not UTC timestamps)
 * @param timeSlots - Array of time slots with startTime and endTime
 * @returns Array of formatted time slots for the API
 */
export function convertTimeSlotsToApiFormat(timeSlots: Array<{ startTime: string; endTime: string }>): Array<{ start: string; end: string }> {
  return timeSlots.map(slot => ({
    start: formatTimeToHHMM(slot.startTime),
    end: formatTimeToHHMM(slot.endTime)
  }));
}

/**
 * Ensures time is in HH:MM format
 * @param time - Time string (could be H:MM or HH:MM)
 * @returns Time in HH:MM format
 */
function formatTimeToHHMM(time: string): string {
  const parts = time.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time}`);
  }
  
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padStart(2, '0');
  
  return `${hours}:${minutes}`;
}
