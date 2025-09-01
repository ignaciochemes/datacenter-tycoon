import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userData = await request.json();
    
    const response = await fetch(`${process.env.API_URL}/auth/oauth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
      },
      body: JSON.stringify({
        ...userData,
        auth0Id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.picture,
        emailVerified: session.user.email_verified
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to sync user with backend', details: errorData },
        { status: response.status }
      );
    }

    const backendUser = await response.json();
    
    return NextResponse.json({
      success: true,
      user: backendUser,
      token: backendUser.token
    });
  } catch (error) {
    console.error('OAuth sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}