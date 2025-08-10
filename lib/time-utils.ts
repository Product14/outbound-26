/**
 * Utility functions for calculating and formatting estimated campaign time
 */

/**
 * Calculates estimated campaign time based on total calls
 * Each call takes 10 seconds
 * @param totalCalls - Total number of calls in the campaign
 * @returns Estimated time in seconds
 */
export function calculateEstimatedTimeInSeconds(totalCalls: number): number {
  return totalCalls * 10; // 10 seconds per call
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
