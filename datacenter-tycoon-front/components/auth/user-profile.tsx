'use client';

import { useHybridAuth } from '@/hooks/use-hybrid-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, User } from 'lucide-react';

interface UserProfileProps {
  className?: string;
}

export function UserProfile({ className }: UserProfileProps) {
  const { user, error, isLoading, logout, isAuth0User, isTraditionalUser } = useHybridAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 p-4 ${className}`}>
        Error loading user profile: {error.message}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.picture || ''} alt={user.name || 'User'} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{user.name || 'Unknown User'}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.email_verified && (
              <p className="text-xs text-green-600">✓ Email verified</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">User ID:</span>
            <span className="ml-2 text-muted-foreground">{user.id}</span>
          </div>
          <div>
            <span className="font-medium">Provider:</span>
            <span className="ml-2 text-muted-foreground">{user.provider}</span>
          </div>
          <div>
            <span className="font-medium">Username:</span>
            <span className="ml-2 text-muted-foreground">{user.username}</span>
          </div>
          {user.updated_at && (
            <div>
              <span className="font-medium">Last updated:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(user.updated_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <Button
          onClick={logout}
          variant="outline"
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}