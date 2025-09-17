"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Monitor, Phone, Utensils, Wifi, Presentation } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookingModal } from "@/components/booking-modal"

interface Room {
  id: string
  name: string
  capacity: number
  location: string
  amenities: string[]
  is_active: boolean
}

interface Booking {
  id: string
  room_id: string
  start_time: string
  end_time: string
  status: string
}

const getAmenityIcon = (amenity: string) => {
  switch (amenity) {
    case "projector":
      return <Presentation className="h-4 w-4" />
    case "tv_screen":
      return <Monitor className="h-4 w-4" />
    case "phone":
      return <Phone className="h-4 w-4" />
    case "video_conference":
      return <Phone className="h-4 w-4" />
    case "catering":
      return <Utensils className="h-4 w-4" />
    case "whiteboard":
      return <Presentation className="h-4 w-4" />
    default:
      return <Wifi className="h-4 w-4" />
  }
}

const getRoomStatus = (roomId: string, bookings: Booking[]): { available: boolean, nextBooking?: Booking } => {
  const now = new Date()

  // Check if there's an active booking for this room right now
  const activeBooking = bookings.find((booking) => {
    if (booking.room_id !== roomId || booking.status !== "confirmed") return false

    const startTime = new Date(booking.start_time)
    const endTime = new Date(booking.end_time)

    return now >= startTime && now <= endTime
  })

  // Find next booking for this room
  const nextBooking = bookings
    .filter(booking => booking.room_id === roomId && booking.status === "confirmed")
    .find(booking => new Date(booking.start_time) > now)

  return {
    available: !activeBooking,
    nextBooking
  }
}

export function RoomGrid() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const fetchRoomsAndBookings = async () => {
    const supabase = createClient()

    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from("meeting_rooms")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (roomsError) throw roomsError

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "confirmed")
        .gte("end_time", today.toISOString())
        .lte("start_time", tomorrow.toISOString())

      if (bookingsError) throw bookingsError

      setRooms(roomsData || [])
      setBookings(bookingsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoomsAndBookings()

    const supabase = createClient()
    const channel = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchRoomsAndBookings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room)
    setIsBookingModalOpen(true)
  }

  const handleBookingComplete = () => {
    fetchRoomsAndBookings() // Refresh data after booking
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const roomStatus = getRoomStatus(room.id, bookings)

          return (
            <Card
              key={room.id}
              className="transition-all hover:shadow-lg hover:border-primary/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">{room.name}</CardTitle>
                  <Badge
                    variant={roomStatus.available ? "default" : "secondary"}
                    className={roomStatus.available ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-yellow-100 text-yellow-800"}
                  >
                    {roomStatus.available ? "Available Now" : "In Use"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{room.capacity} people</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{room.location}</span>
                  </div>
                </div>

                {roomStatus.nextBooking && (
                  <div className="text-xs text-muted-foreground">
                    Next booking: {new Date(roomStatus.nextBooking.start_time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                )}

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => handleBookRoom(room)}
                >
                  Book Room
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <BookingModal
        room={selectedRoom}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setSelectedRoom(null)
        }}
        onBookingComplete={handleBookingComplete}
      />
    </>
  )
}
