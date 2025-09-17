"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoomManagement } from "@/components/room-management"
import { BookingManagement } from "@/components/booking-management"
import { UserManagement } from "@/components/user-management"

export function AdminTabs() {
  return (
    <Tabs defaultValue="bookings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>

      <TabsContent value="bookings">
        <BookingManagement />
      </TabsContent>

      <TabsContent value="rooms">
        <RoomManagement />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
    </Tabs>
  )
}
