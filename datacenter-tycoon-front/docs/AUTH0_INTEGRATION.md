# Auth0 Integration Documentation

This document explains the Auth0 integration implementation in the Datacenter Tycoon application.

## Architecture Overview

The application uses a hybrid authentication system that supports both traditional email/password authentication and OAuth providers through Auth0.

### Key Components

1. **Auth0 Provider** (`@auth0/nextjs-auth0`)
2. **Hybrid Authentication Hook** (`useHybridAuth`)
3. **Auth0 Integration Service** (`auth0Integration`)
4. **User Synchronization** (Frontend ↔ Backend)

## File Structure

```
lib/
├── auth0.ts                 # Auth0 configuration
├── auth0-integration.ts     # Integration service
└── auth-context.tsx         # Updated auth context

hooks/
└── use-hybrid-auth.ts       # Hybrid authentication hook

components/auth/
├── social-login-buttons.tsx # OAuth login buttons
└── user-profile.tsx         # User profile component

app/api/auth/
├── [...auth0]/route.ts      # Auth0 API routes
└── oauth/sync/route.ts      # User synchronization endpoint
```

## Configuration

### Environment Variables

```env
# Auth0 Configuration
AUTH0_SECRET='32-byte-random-string'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# API Configuration
API_URL='http://localhost:8000/api'
API_SECRET_KEY='backend-communication-key'
```

### Auth0 Tenant Setup

1. **Application Configuration**
   - Type: Regular Web Application
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000/welcome`
   - Allowed Web Origins: `http://localhost:3000`

2. **Social Connections**
   - Google OAuth 2.0
   - Configure with Google Cloud Console credentials

## Authentication Flow

### OAuth Login Flow

1. User clicks "Continue with Google" or "Continue with Auth0"
2. Redirected to Auth0 hosted login page
3. User authenticates with chosen provider
4. Auth0 redirects back to `/api/auth/callback`
5. Callback handler processes the authentication
6. User data is synchronized with backend
7. User is redirected to dashboard

### User Synchronization

```typescript
// Auth0 user data is mapped to application user format
const userData = {
  auth0Id: auth0User.sub,
  email: auth0User.email,
  username: auth0User.nickname || auth0User.name,
  name: auth0User.name,
  avatar: auth0User.picture,
  emailVerified: auth0User.email_verified,
  provider: 'auth0'
};

// Synchronized with backend via API call
POST /api/auth/oauth/sync
```

## Hybrid Authentication System

### useHybridAuth Hook

Provides unified interface for both Auth0 and traditional authentication:

```typescript
const {
  user,              // Unified user object
  isLoading,         // Loading state
  isAuthenticated,   // Authentication status
  isAuth0User,       // Auth0 user flag
  isTraditionalUser, // Traditional user flag
  login,             // Traditional login
  logout,            // Unified logout
  loginWithAuth0,    // Auth0 login
  loginWithGoogle    // Google OAuth login
} = useHybridAuth();
```

### User Object Structure

```typescript
interface HybridAuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  provider: 'auth0' | 'traditional';
  createdAt: string;
  updatedAt: string;
}
```

## Backend Integration

### Required Backend Endpoints

1. **OAuth User Sync**
   ```
   POST /auth/oauth/sync
   ```
   - Creates or updates user from OAuth data
   - Returns JWT token for API authentication
   - Links OAuth account with existing user if email matches

2. **User Profile**
   ```
   GET /auth/profile
   ```
   - Returns user profile data
   - Requires JWT authentication

### Database Schema Updates

Add OAuth-related fields to user table:

```sql
ALTER TABLE users ADD COLUMN auth0_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN provider VARCHAR(50) DEFAULT 'traditional';
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN avatar TEXT;
```

## Security Considerations

### Session Management

- Auth0 sessions are managed by the Auth0 SDK
- Traditional sessions use JWT tokens
- Both systems are integrated through the hybrid auth context

### Token Handling

- Auth0 tokens are handled automatically by the SDK
- Backend JWT tokens are stored in localStorage
- Tokens are included in API requests via axios interceptors

### CSRF Protection

- Auth0 SDK includes built-in CSRF protection
- Traditional forms use CSRF tokens
- API endpoints validate request origins

## Error Handling

### Common Error Scenarios

1. **OAuth Callback Errors**
   - Invalid state parameter
   - User cancellation
   - Provider errors

2. **User Sync Errors**
   - Backend API unavailable
   - Invalid user data
   - Database constraints

3. **Session Errors**
   - Expired tokens
   - Invalid sessions
   - Network connectivity

### Error Recovery

```typescript
try {
  await auth0Integration.handlePostLogin(auth0User);
} catch (error) {
  console.error('Post-login handling failed:', error);
  // Graceful degradation - user can still access basic features
}
```

## Testing

### Unit Tests

- Test hybrid auth hook functionality
- Mock Auth0 SDK responses
- Validate user data mapping

### Integration Tests

- Test complete OAuth flow
- Verify backend synchronization
- Test error scenarios

### Manual Testing Checklist

- [ ] Google OAuth login works
- [ ] Auth0 login works
- [ ] User profile displays correctly
- [ ] Logout works for both providers
- [ ] Backend synchronization works
- [ ] Error handling works
- [ ] Session persistence works

## Deployment

### Production Configuration

1. Update Auth0 tenant URLs
2. Configure production environment variables
3. Update CORS settings
4. Test with production domains

### Monitoring

- Monitor Auth0 dashboard for authentication metrics
- Track user sync API performance
- Monitor error rates and user feedback

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Check Auth0 application settings
   - Verify environment variables

2. **User Sync Failures**
   - Check backend API logs
   - Verify database connectivity
   - Check API authentication

3. **Session Issues**
   - Clear browser storage
   - Check Auth0 session configuration
   - Verify token expiration settings

### Debug Tools

- Auth0 Dashboard logs
- Browser developer tools
- Network request inspection
- Backend API logs