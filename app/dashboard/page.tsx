import { DashboardHeader } from "@/components/dashboard-header"
import { RoomGrid } from "@/components/room-grid"
import { MyBookings } from "@/components/my-bookings"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Room booking */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Book a Meeting Room</h1>
              <p className="text-muted-foreground">Select an available room and time slot for your meeting</p>
            </div>
            <RoomGrid />
          </div>

          {/* Sidebar - My bookings */}
          <div className="lg:col-span-1">
            <MyBookings />
          </div>
        </div>
      </main>
    </div>
  )
}
