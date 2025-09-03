# Centralized Authentication Configuration

This project now uses a centralized authentication configuration system that allows you to easily switch between staging and production environments without modifying code throughout the entire codebase.

## How It Works

All authentication logic is controlled by a single configuration file: `/lib/auth-config.ts`

### Key Configuration

```typescript
// 🔧 CONFIGURATION: Toggle this for different environments
export const AUTH_ENABLED = false; // Set to true for production, false for staging
```

## Usage Instructions

### For Staging Branch (APIs work without authentication)
1. Open `/lib/auth-config.ts`
2. Set `AUTH_ENABLED = false`
3. Commit and push

### For Production/Main Branch (APIs require authentication)
1. Open `/lib/auth-config.ts`
2. Set `AUTH_ENABLED = true`
3. Commit and push

## What This System Controls

When `AUTH_ENABLED = false` (Staging):
- ❌ No `auth_key` validation in API routes
- ❌ No `Authorization` headers sent to external APIs
- ❌ No `auth_key` parameters added to API calls
- ✅ All API calls work without authentication

When `AUTH_ENABLED = true` (Production):
- ✅ `auth_key` validation in all API routes
- ✅ `Authorization: Bearer {auth_key}` headers sent to external APIs
- ✅ `auth_key` parameters added to all API calls
- ✅ Full authentication flow enabled

## Files Affected by This Configuration

### API Routes (6 files)
- `/app/api/launch-campaign/route.ts`
- `/app/api/keys-mapping/route.ts`
- `/app/api/fetch-agent-list/route.ts`
- `/app/api/fetch-campaign-types/route.ts`
- `/app/api/fetch-campaign-list/route.ts`
- `/app/api/fetch-campaign-details/route.ts`

### Library Functions (3 files)
- `/lib/campaign-api.ts`
- `/lib/agent-api.ts`
- `/lib/csv-api-integration.ts`

### Components (3 files)
- `/components/csv-mapping/CSVMappingStep.tsx`
- `/components/csv-mapping/CSVMappingFlow.tsx`
- `/components/campaign-setup/Step2FileUpload.tsx`

### App Pages (3 files)
- `/app/setup/page.tsx`
- `/app/results/page.tsx`
- `/app/results/[id]/page.tsx`

## Helper Functions

The auth-config module provides these helper functions:

- `addAuthToUrl(baseUrl, authKey)` - Conditionally adds auth_key to URLs
- `addAuthToParams(params, authKey)` - Conditionally adds auth_key to URLSearchParams
- `getAuthHeaders(authKey)` - Conditionally adds Authorization header
- `validateAuthKey(authKey)` - Validates auth_key requirement
- `extractAuthKey(request)` - Extracts auth_key from request URLs

## Benefits

✅ **Single Point of Control**: Change one line to switch environments
✅ **No Code Duplication**: No need to comment/uncomment code across multiple files
✅ **Easy Branch Management**: Simply toggle the config when switching branches
✅ **Type Safe**: Full TypeScript support with proper error handling
✅ **Clean Code**: No commented-out code blocks cluttering the codebase

## Migration from Previous System

The previous system used commented-out code blocks throughout the codebase. This new system:
1. Removes all commented-out auth code
2. Uses clean, conditional logic based on the central config
3. Maintains the same functionality with better maintainability

## Testing

To verify the system works:
1. Set `AUTH_ENABLED = false` and test staging APIs
2. Set `AUTH_ENABLED = true` and test with valid auth_key
3. Set `AUTH_ENABLED = true` and test without auth_key (should fail with 401)
