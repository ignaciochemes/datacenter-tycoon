import { useAuth } from '@/lib/auth-context';
import { useMemo } from 'react';

export interface HybridAuthUser {
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

export function useHybridAuth() {
  const { user: traditionalUser, isLoading: traditionalLoading, login, logout } = useAuth();

  const hybridUser: HybridAuthUser | null = useMemo(() => {
    if (traditionalUser) {
      return {
        id: traditionalUser.id,
        email: traditionalUser.email,
        username: traditionalUser.username,
        name: traditionalUser.name || traditionalUser.username,
        avatar: traditionalUser.avatar,
        emailVerified: traditionalUser.emailVerified || false,
        provider: 'traditional',
        createdAt: traditionalUser.createdAt,
        updatedAt: traditionalUser.updatedAt
      };
    }

    return null;
  }, [traditionalUser]);

  const isLoading = traditionalLoading;
  const isAuthenticated = !!hybridUser;
  const isAuth0User = false;
  const isTraditionalUser = !!traditionalUser;

  return {
    user: hybridUser,
    isLoading,
    isAuthenticated,
    isAuth0User,
    isTraditionalUser,
    auth0Error: null,
    login,
    logout,
    loginWithAuth0: () => {},
    loginWithGoogle: () => {}
  };
}