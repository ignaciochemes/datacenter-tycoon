import { initAuth0 } from '@auth0/nextjs-auth0';

export default initAuth0({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:3001',
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  routes: {
    callback: '/api/auth/callback',
    postLogoutRedirect: '/welcome'
  },
  session: {
    rollingDuration: 60 * 60 * 24,
    absoluteDuration: 60 * 60 * 24 * 7
  }
});