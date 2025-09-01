'use client'

import { AuthNavigation } from '@/components/auth/AuthNavigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function WelcomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Datacenter Tycoon</h1>
              <p className="text-muted-foreground mt-2">Build and manage your datacenter empire</p>
            </div>
            <AuthNavigation />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Datacenter Tycoon
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Build, manage, and expand your datacenter infrastructure. 
            Monitor servers, optimize performance, and grow your technology empire.
          </p>
          <div className="space-y-6">
            <SocialLoginButtons />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/auth/login')}
              >
                Email Login
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/auth/register')}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">🖥️</span>
                </div>
                Server Management
              </CardTitle>
              <CardDescription>
                Monitor and manage your server infrastructure with real-time metrics and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track CPU, memory, storage, and network performance across all your servers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">📊</span>
                </div>
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Get insights into your datacenter performance with detailed analytics and reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize trends, identify bottlenecks, and optimize your infrastructure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">⚡</span>
                </div>
                Resource Optimization
              </CardTitle>
              <CardDescription>
                Automatically optimize resource allocation and reduce operational costs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Smart algorithms help you maximize efficiency and minimize waste.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}