/**
 * Centralized Authentication Configuration
 * 
 * This file controls whether authentication is enabled or disabled across the entire application.
 * 
 * USAGE:
 * - Set AUTH_ENABLED to false for staging branch (APIs work without auth)
 * - Set AUTH_ENABLED to true for production branch (APIs require auth_key)
 * 
 * When switching branches:
 * - Staging: Change AUTH_ENABLED to false
 * - Production: Change AUTH_ENABLED to true
 */

// 🔧 CONFIGURATION: Toggle this for different environments
export const AUTH_ENABLED = false; // Set to true for production, false for staging

/**
 * Conditionally adds auth_key to URL parameters if auth is enabled
 */
export function addAuthToUrl(baseUrl: string, authKey?: string | null): string {
  if (!AUTH_ENABLED || !authKey) {
    return baseUrl;
  }
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}auth_key=${encodeURIComponent(authKey)}`;
}

/**
 * Conditionally adds auth_key to URLSearchParams if auth is enabled
 */
export function addAuthToParams(params: URLSearchParams, authKey?: string | null): void {
  if (AUTH_ENABLED && authKey) {
    params.append('auth_key', authKey);
  }
}

/**
 * Conditionally adds Authorization header if auth is enabled
 */
export function getAuthHeaders(authKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (AUTH_ENABLED && authKey) {
    headers['Authorization'] = `Bearer ${authKey}`;
  }
  
  return headers;
}

/**
 * Validates auth_key requirement based on configuration
 * Returns error response if auth is required but missing
 */
export function validateAuthKey(authKey: string | null): { isValid: boolean; error?: any } {
  if (AUTH_ENABLED && !authKey) {
    return {
      isValid: false,
      error: {
        error: 'Missing required parameter: auth_key is required for authentication',
        status: 401
      }
    };
  }
  
  return { isValid: true };
}

/**
 * Extracts auth_key from request URL parameters
 * Returns null if auth is disabled
 */
export function extractAuthKey(request: Request): string | null {
  if (!AUTH_ENABLED) {
    return null;
  }
  
  const { searchParams } = new URL(request.url);
  return searchParams.get('auth_key');
}
