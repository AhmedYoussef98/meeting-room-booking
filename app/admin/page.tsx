import { AdminHeader } from "@/components/admin-header"
import { AdminStats } from "@/components/admin-stats"
import { AdminTabs } from "@/components/admin-tabs"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage meeting rooms, bookings, and users</p>
        </div>

        <AdminStats />
        <AdminTabs />
      </main>
    </div>
  )
}
