'use client';

import { Button } from '@/components/ui/button';
import { useHybridAuth } from '@/hooks/use-hybrid-auth';
import { Loader2, Chrome } from 'lucide-react';
import { FaLock } from 'react-icons/fa';

interface SocialLoginButtonsProps {
  className?: string;
}

export function SocialLoginButtons({ className }: SocialLoginButtonsProps) {
  const { isAuthenticated, isLoading, loginWithAuth0, loginWithGoogle } = useHybridAuth();

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </Button>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        onClick={loginWithGoogle}
        variant="outline"
        className="w-full"
      >
        <Chrome className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
      
      <Button
        onClick={loginWithAuth0}
        variant="outline"
        className="w-full"
      >
        <FaLock className="mr-2 h-4 w-4" />
        Continue with Auth0
      </Button>
    </div>
  );
}