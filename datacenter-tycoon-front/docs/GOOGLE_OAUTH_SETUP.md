# Google OAuth Setup Guide

This guide explains how to configure Google OAuth authentication for the Datacenter Tycoon application.

## Prerequisites

- Google Cloud Console account
- Auth0 tenant configured
- Application running on `http://localhost:3000`

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity API

## Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: `Datacenter Tycoon`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (for development)

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - Name: `Datacenter Tycoon Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://your-domain.auth0.com`
   - Authorized redirect URIs:
     - `https://your-domain.auth0.com/login/callback`

## Step 4: Configure Auth0 Google Social Connection

1. Go to your Auth0 Dashboard
2. Navigate to **Authentication** > **Social**
3. Click **Create Connection** and select **Google**
4. Enter your Google OAuth credentials:
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console
5. Configure scopes: `email`, `profile`
6. Enable the connection for your application

## Step 5: Update Environment Variables

The Google OAuth integration works through Auth0, so no additional environment variables are needed beyond the Auth0 configuration.

## Step 6: Test the Integration

1. Start your development server: `pnpm dev`
2. Navigate to `http://localhost:3000/welcome`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. Verify user profile information is displayed correctly

## Troubleshooting

### Common Issues

1. **Redirect URI mismatch**
   - Ensure the redirect URI in Google Cloud Console matches your Auth0 domain
   - Format: `https://your-domain.auth0.com/login/callback`

2. **Consent screen not configured**
   - Complete the OAuth consent screen configuration
   - Add your email as a test user during development

3. **Scopes not granted**
   - Ensure `email` and `profile` scopes are configured in both Google Cloud Console and Auth0

4. **CORS errors**
   - Add your domain to authorized JavaScript origins in Google Cloud Console

### Debug Steps

1. Check Auth0 logs in the dashboard
2. Verify Google Cloud Console configuration
3. Test the Auth0 connection in the dashboard
4. Check browser network tab for error responses

## Security Considerations

- Use HTTPS in production
- Regularly rotate client secrets
- Monitor Auth0 logs for suspicious activity
- Implement proper session management
- Validate user data on the backend

## Production Deployment

Before deploying to production:

1. Update authorized origins and redirect URIs with production domains
2. Configure production Auth0 tenant
3. Update environment variables
4. Test the complete flow in production environment