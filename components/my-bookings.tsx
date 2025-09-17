"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cancelBooking } from "@/lib/room-utils"

interface BookingWithRoom {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: string
  room: {
    name: string
    location: string
    capacity: number
  }
}

export function MyBookings() {
  const [bookings, setBookings] = useState<BookingWithRoom[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllBookings = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          meeting_rooms (
            name,
            location,
            capacity
          )
        `)
        .eq("status", "confirmed")
        .gte("end_time", new Date().toISOString())
        .order("start_time")

      if (error) throw error

      const formattedBookings =
        data?.map((booking) => ({
          ...booking,
          room: booking.meeting_rooms,
        })) || []

      setBookings(formattedBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllBookings()
  }, [])

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId)
      fetchAllBookings() // Refresh the list
    } catch (error) {
      console.error("Error cancelling booking:", error)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No upcoming meetings</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Upcoming Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => {
            const startDateTime = formatDateTime(booking.start_time)
            const endDateTime = formatDateTime(booking.end_time)

            return (
              <div key={booking.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{booking.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {booking.room.name}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{startDateTime.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {startDateTime.time} - {endDateTime.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.room.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{booking.room.capacity}</span>
                      </div>
                    </div>

                    {booking.description && <p className="text-sm text-muted-foreground">{booking.description}</p>}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
