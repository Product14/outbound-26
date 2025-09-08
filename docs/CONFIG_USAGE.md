# Config.tsx Usage Guide

This document explains how to use the `config.tsx` file to control API routing.

## Overview

The `config.tsx` file is the central configuration for API endpoints. It's currently set to use **production routes only**.

## Current Configuration

```typescript
export const config: ApiConfig = {
  useProduction: true, // Currently using production API only
  apiUrls: {
    production: 'https://api.spyne.ai',
    staging: 'https://beta-api.spyne.xyz'
  },
  app: {
    showStagingOptions: false, // Hide staging options in UI
    defaultPageSize: 10
  }
}
```

## How to Change API Routes

### Switch to Production API (Current Setting)
```typescript
// In config.tsx
useProduction: true
```
- **Primary API**: `https://api.spyne.ai`
- **Fallback API**: `https://beta-api.spyne.xyz`
- **Authentication**: Required for production API

### Switch to Staging API
```typescript
// In config.tsx
useProduction: false
```
- **Primary API**: `https://beta-api.spyne.xyz`
- **Fallback API**: `https://api.spyne.ai`
- **Authentication**: Not required for staging API

## Available Functions

### Get API URLs
```typescript
import { getApiBaseUrl, getFallbackApiBaseUrl } from '@/config'

const primaryUrl = getApiBaseUrl()        // Current primary API
const fallbackUrl = getFallbackApiBaseUrl() // Fallback API
```

### Get Specific Endpoints
```typescript
import { API_URLS } from '@/config'

const reportsUrl = API_URLS.reports()           // Primary reports endpoint
const reportsFallback = API_URLS.reportsFallback() // Fallback reports endpoint
```

### Check Configuration
```typescript
import { shouldUseProduction, shouldUseStaging } from '@/config'

if (shouldUseProduction()) {
  console.log('Using production API')
} else {
  console.log('Using staging API')
}
```

### Switch APIs Programmatically
```typescript
import { switchToProduction, switchToStaging, logConfig } from '@/config'

// Switch to production
switchToProduction()

// Switch to staging
switchToStaging()

// Log current config
logConfig()
```

## API Endpoints

The config provides these endpoints:

- **Reports**: `/conversation/vapi/end-call-reports`
- **Report by ID**: `/conversation/vapi/end-call-report-by-id`
- **Agents**: `/conversation/agents/fetch-agent-list`

## Response Headers

API responses include these headers for debugging:

- `x-spyne-base-url`: The actual API URL used
- `x-use-production`: The useProduction setting

## Example Usage in Components

```typescript
import { config, getApiBaseUrl, API_URLS } from '@/config'

function MyComponent() {
  // Check current configuration
  const isProduction = config.useProduction
  const apiUrl = getApiBaseUrl()
  
  // Use specific endpoints
  const reportsUrl = API_URLS.reports()
  
  return (
    <div>
      <p>Using: {isProduction ? 'Production' : 'Staging'} API</p>
      <p>Base URL: {apiUrl}</p>
    </div>
  )
}
```

## Current Status

✅ **Production API Only**: `useProduction: true`  
✅ **No Staging UI Options**: `showStagingOptions: false`  
✅ **Authentication Required**: For production API calls  
✅ **Fallback Enabled**: If production fails, tries staging  

## To Switch to Staging

1. Change `useProduction: false` in `config.tsx`
2. Optionally set `showStagingOptions: true` to show staging options in UI
3. Deploy the changes
4. API calls will now use staging API first, production as fallback
