import { User } from '@auth0/nextjs-auth0/types';
import { authService } from './auth';

export interface Auth0User {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
  nickname?: string;
  updated_at?: string;
}

export class Auth0IntegrationService {
  static async syncUserWithBackend(auth0User: User): Promise<void> {
    try {
      const userData = {
        auth0Id: auth0User.sub,
        email: auth0User.email || '',
        username: auth0User.nickname || auth0User.name || auth0User.email?.split('@')[0] || 'user',
        name: auth0User.name || '',
        avatar: auth0User.picture || '',
        emailVerified: auth0User.email_verified || false,
        provider: 'auth0',
        lastLogin: new Date().toISOString()
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user with backend');
      }

      const backendUser = await response.json();
      
      if (backendUser.token) {
        authService.setToken(backendUser.token);
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      throw error;
    }
  }

  static async handlePostLogin(auth0User: User): Promise<void> {
    try {
      await this.syncUserWithBackend(auth0User);
    } catch (error) {
      console.error('Post-login handling failed:', error);
    }
  }

  static async handlePostLogout(): Promise<void> {
    try {
      authService.logout();
    } catch (error) {
      console.error('Post-logout handling failed:', error);
    }
  }

  static mapAuth0UserToAppUser(auth0User: User) {
    return {
      id: auth0User.sub,
      email: auth0User.email || '',
      username: auth0User.nickname || auth0User.name || auth0User.email?.split('@')[0] || 'user',
      name: auth0User.name || '',
      avatar: auth0User.picture || '',
      emailVerified: auth0User.email_verified || false,
      provider: 'auth0',
      createdAt: auth0User.updated_at || new Date().toISOString(),
      updatedAt: auth0User.updated_at || new Date().toISOString()
    };
  }
}

export const auth0Integration = Auth0IntegrationService;