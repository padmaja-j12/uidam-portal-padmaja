# Token Refresh Implementation Summary

## Overview

Implemented automatic token refresh mechanism to prevent unwanted redirects to login page when tokens expire during page refresh or user activity.

## Implementation Details

### 1. Token Manager (`src/utils/tokenManager.ts`)

Created a centralized token manager with queue-based refresh prevention:

- **handleTokenRefresh()**: Manages token refresh queue to prevent simultaneous refresh calls
- **shouldRefreshToken()**: Checks if token is expired or about to expire (5 minutes before expiry)
- **getValidToken()**: Returns current token or refreshes if needed

### 2. Fetch Wrapper (`src/services/apiUtils.ts`)

Added `fetchWithTokenRefresh()` function that:

- Automatically checks token expiry before each API call
- Refreshes token proactively if expired/expiring
- Adds authentication headers automatically
- Retries failed requests (401) with refreshed token
- Maintains same interface as native fetch()

### 3. Updated Services

Migrated all service methods from `fetch()` to `fetchWithTokenRefresh()`:

#### User Service (`src/services/userService.ts`)

- ✅ All CRUD operations (V1 & V2)
- ✅ Filter operations (V1 & V2)
- ✅ External/Federated user operations
- ✅ Self user operations (getSelfUser, updateSelfUser)
- ✅ User attributes operations
- ✅ User events

#### Account Service (`src/services/accountService.ts`)

- ✅ CRUD operations (create, get, update, delete)
- ✅ User-account-role mappings
- ✅ Bulk user assignments

#### Role Service (`src/services/role.service.ts`)

- ✅ getRoles() with filtering

#### Scope Service (`src/services/scope.service.ts`)

- ✅ getScopes() with filtering

## How It Works

### Token Refresh Flow

```
User Action → API Call → fetchWithTokenRefresh()
                ↓
    Check Token Expiry (< 5 min left?)
                ↓
    YES: Refresh Token → Update localStorage → Retry Request
    NO: Proceed with Request
                ↓
    401 Response? → Refresh Token → Retry Once
                ↓
    Return Response
```

### Queue Management

- First request triggers token refresh
- Subsequent simultaneous requests wait for the refresh to complete
- All waiting requests receive the new token and proceed

## Benefits

1. **Prevents Login Redirects**: Token refreshed automatically before expiry
2. **Better UX**: Users don't lose work due to expired tokens
3. **No Code Duplication**: Centralized token refresh logic
4. **Automatic Retry**: Failed requests (401) automatically retried after refresh
5. **Race Condition Prevention**: Queue prevents multiple simultaneous refreshes

## Configuration

Token expiry buffer is set to 5 minutes (300,000 ms):

```typescript
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
```

## Testing

### Manual Testing Steps

1. Login to the application
2. Wait for token to approach expiry (~5 minutes before expiry)
3. Perform any action (navigate, refresh page, API call)
4. Verify: No redirect to login page
5. Check browser console: Should see "Token refresh successful" message

### Development Testing

1. Reduce token expiry time in OAuth server to 2-3 minutes
2. Login and wait for expiry
3. Refresh page or make API call
4. Verify automatic token refresh

## Files Modified

- ✅ `src/utils/tokenManager.ts` (NEW)
- ✅ `src/services/apiUtils.ts` (UPDATED)
- ✅ `src/services/userService.ts` (UPDATED)
- ✅ `src/services/accountService.ts` (UPDATED)
- ✅ `src/services/role.service.ts` (UPDATED)
- ✅ `src/services/scope.service.ts` (UPDATED)

## Next Steps (Optional Enhancements)

1. Add unit tests for tokenManager.ts
2. Add integration tests for fetchWithTokenRefresh()
3. Add metrics/logging for token refresh events
4. Consider adding token refresh countdown UI indicator
5. Handle refresh token expiry gracefully (redirect to login)

## Notes

- Auth service (auth.service.ts) already has refreshToken() method implemented
- OAuth2 endpoints (/oauth2/token, /oauth2/logout) use direct fetch (intentional)
- Token stored in localStorage with key 'uidam_admin_token'
- Refresh token stored with key 'uidam_admin_refresh_token'
