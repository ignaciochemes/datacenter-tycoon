import { handleAuth, handleLogin, handleLogout, handleCallback, handleProfile } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';
import { auth0Integration } from '@/lib/auth0-integration';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  }),
  logout: handleLogout({
    returnTo: '/welcome'
  }),
  callback: handleCallback({
    afterCallback: async (req: NextRequest, session: any) => {
      try {
        if (session?.user) {
          await auth0Integration.handlePostLogin(session.user);
        }
        return session;
      } catch (error) {
        console.error('Callback error:', error);
        return session;
      }
    }
  }),
  profile: handleProfile()
});