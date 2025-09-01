import { DatacenterDashboard } from '@/components/datacenter/DatacenterDashboard'
import { AuthNavigation } from '@/components/auth/AuthNavigation'
import { UserProfile } from '@/components/auth/user-profile'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Datacenter Tycoon</h1>
                <p className="text-muted-foreground mt-2">Manage your datacenter infrastructure</p>
              </div>
              <div className="flex items-center gap-4">
                <UserProfile />
                <AuthNavigation />
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6">
          <DatacenterDashboard />
        </main>
      </div>
    </ProtectedRoute>
  )
}
