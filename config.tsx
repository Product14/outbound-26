/**
 * API Configuration
 * 
 * This file controls which API endpoints to use for the application.
 * Currently configured to use only production routes.
 */

export interface ApiConfig {
  /** 
   * Controls which API environment to use:
   * - true: Use production API (api.spyne.ai)
   * - false: Use staging API (beta-api.spyne.xyz)
   */
  useProduction: boolean
  
  /** 
   * API base URLs
   */
  apiUrls: {
    production: string
    staging: string
  }
  
  /** 
   * Application settings
   */
  app: {
    /** Whether to show staging options in UI */
    showStagingOptions: boolean
    /** Default page size for API calls */
    defaultPageSize: number
  }
}

/**
 * Main API configuration
 * 
 * Set useProduction to:
 * - true: Use production API only
 * - false: Use staging API only
 */
export const config: ApiConfig = {
  useProduction: true, // Set to true for production API, false for staging API
  
  apiUrls: {
    production: 'https://api.spyne.ai',
    staging: 'https://beta-api.spyne.xyz'
  },
  
  app: {
    showStagingOptions: false, // Hide staging options in UI
    defaultPageSize: 10
  }
}

/**
 * Get the API base URL based on configuration
 */
export function getApiBaseUrl(): string {
  return config.useProduction 
    ? config.apiUrls.production 
    : config.apiUrls.staging
}

/**
 * Get the fallback API base URL (opposite of primary)
 */
export function getFallbackApiBaseUrl(): string {
  return config.useProduction 
    ? config.apiUrls.staging 
    : config.apiUrls.production
}

/**
 * Check if we should use production API
 */
export function shouldUseProduction(): boolean {
  return config.useProduction
}

/**
 * Check if we should use staging API
 */
export function shouldUseStaging(): boolean {
  return !config.useProduction
}

/**
 * Get API endpoint URL for a specific path
 */
export function getApiEndpoint(path: string): string {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}${path}`
}

/**
 * Get fallback API endpoint URL for a specific path
 */
export function getFallbackApiEndpoint(path: string): string {
  const baseUrl = getFallbackApiBaseUrl()
  return `${baseUrl}${path}`
}

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  REPORTS: '/conversation/vapi/end-call-reports',
  REPORT_BY_ID: '/conversation/vapi/end-call-report-by-id',
  AGENTS: '/conversation/agents/fetch-agent-list'
} as const

/**
 * Get full API URLs for common endpoints
 */
export const API_URLS = {
  reports: () => getApiEndpoint(API_ENDPOINTS.REPORTS),
  reportById: () => getApiEndpoint(API_ENDPOINTS.REPORT_BY_ID),
  agents: () => getApiEndpoint(API_ENDPOINTS.AGENTS),
  
  // Fallback URLs
  reportsFallback: () => getFallbackApiEndpoint(API_ENDPOINTS.REPORTS),
  reportByIdFallback: () => getFallbackApiEndpoint(API_ENDPOINTS.REPORT_BY_ID),
  agentsFallback: () => getFallbackApiEndpoint(API_ENDPOINTS.AGENTS)
} as const

/**
 * Log current configuration
 */
export function logConfig(): void {
  console.log('🔧 API Configuration:')
  console.log(`   Primary API: ${getApiBaseUrl()}`)
  console.log(`   Fallback API: ${getFallbackApiBaseUrl()}`)
  console.log(`   Use Production: ${shouldUseProduction()}`)
  console.log(`   Show Staging Options: ${config.app.showStagingOptions}`)
}

/**
 * Switch to production API
 */
export function switchToProduction(): void {
  config.useProduction = true
  console.log('🔄 Switched to PRODUCTION API')
  logConfig()
}

/**
 * Switch to staging API
 */
export function switchToStaging(): void {
  config.useProduction = false
  console.log('🔄 Switched to STAGING API')
  logConfig()
}
