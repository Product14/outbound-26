# Authentication Configuration

This document explains how to configure API endpoints using the `auth_config.ts` file.

## Overview

The `auth_config.ts` file controls which Spyne API environment your application uses:
- **Production**: `https://api.spyne.ai`
- **Staging/Beta**: `https://beta-api.spyne.xyz`

## Configuration

### Setting `auth_manage_prod`

In `lib/auth_config.ts`, set the `auth_manage_prod` value:

```typescript
export const authConfig: AuthConfig = {
  auth_manage_prod: false, // Set to true for production API, false for beta API
  // ... other config
}
```

### Behavior

| `auth_manage_prod` | Primary API | Fallback API | Auth Required | Use Case |
|-------------------|-------------|--------------|---------------|----------|
| `false` | `beta-api.spyne.xyz` | `api.spyne.ai` | ❌ No | Development, Testing, Staging |
| `true` | `api.spyne.ai` | `beta-api.spyne.xyz` | ✅ Yes | Production |

## How It Works

1. **Primary API Call**: The system first tries the API determined by `auth_manage_prod`
2. **Authentication**: 
   - **Production API** (`api.spyne.ai`): Requires authentication via `auth_key` in referer or Authorization header
   - **Staging API** (`beta-api.spyne.xyz`): No authentication required
3. **Fallback**: If the primary API fails or returns empty data, it automatically tries the fallback API
4. **Logging**: All API calls are logged to help with debugging

## Usage Examples

### For Development/Testing
```typescript
// In lib/auth_config.ts
auth_manage_prod: false
```
- Primary: `beta-api.spyne.xyz`
- Fallback: `api.spyne.ai`

### For Production
```typescript
// In lib/auth_config.ts
auth_manage_prod: true
```
- Primary: `api.spyne.ai`
- Fallback: `beta-api.spyne.xyz`

## Debugging

### Check Which API is Being Used

1. **Browser Console**: Look for logs like:
   ```
   [API Route] Using STAGING API: https://beta-api.spyne.xyz
   [API Route] Successfully fetched data from: https://beta-api.spyne.xyz
   ```

2. **Network Tab**: Check the `x-spyne-base-url` response header

3. **Response Headers**: Look for:
   - `x-spyne-base-url`: The actual API URL used
   - `x-auth-manage-prod`: The auth_manage_prod setting

### Testing Configuration

You can test the configuration using the test utility:

```typescript
import { testAuthConfig } from '@/lib/test_auth_config'

// Test current configuration
const config = testAuthConfig()
console.log(config)
```

## No Environment Variables Required

The system is designed to work without any `.env` file dependencies. All configuration is controlled through:

1. **`lib/auth_config.ts`** - API endpoint selection
2. **URL parameters** - Enterprise and team IDs
3. **Request headers** - Authentication tokens

## API Endpoints

The following endpoints are affected by this configuration:

- `/conversation/vapi/end-call-reports` - Get call reports list
- `/conversation/vapi/end-call-report-by-id` - Get individual call details
- `/conversation/agents/fetch-agent-list` - Get agents list

## Switching Environments

To switch between environments, simply change the `auth_manage_prod` value in `lib/auth_config.ts` and restart your development server.

```typescript
// Switch to production
authConfig.auth_manage_prod = true

// Switch to staging
authConfig.auth_manage_prod = false
```
