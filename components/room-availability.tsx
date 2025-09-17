"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { getRoomBookings, generateTimeSlots, checkSlotAvailability, type Room, type TimeSlot } from "@/lib/room-utils"

interface RoomAvailabilityProps {
  room: Room
  selectedDate: Date
  onTimeSlotSelect: (room: Room, timeSlot: TimeSlot) => void
}

export function RoomAvailability({ room, selectedDate, onTimeSlotSelect }: RoomAvailabilityProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const bookings = await getRoomBookings(room.id, selectedDate)
        const slots = generateTimeSlots(selectedDate)

        // Update slot availability based on existing bookings
        const updatedSlots = slots.map((slot) => ({
          ...slot,
          available: checkSlotAvailability(slot, bookings),
        }))

        setTimeSlots(updatedSlots)
      } catch (error) {
        console.error("Error fetching room availability:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [room.id, selectedDate])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Loading availability...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg">{room.name}</h3>
        <p className="text-sm text-muted-foreground">{formatDate(selectedDate)}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto px-2">
        {timeSlots.map((slot, index) => (
          <Button
            key={index}
            variant={slot.available ? "outline" : "secondary"}
            className={`justify-between h-16 px-6 text-left ${
              slot.available
                ? "hover:bg-primary hover:text-primary-foreground border-primary/20 hover:border-primary"
                : "opacity-50 cursor-not-allowed"
            }`}
            disabled={!slot.available}
            onClick={() => slot.available && onTimeSlotSelect(room, slot)}
          >
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-base whitespace-nowrap">
                  {formatTime(slot.start)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Available start time
                </span>
              </div>
            </div>
            {!slot.available && (
              <Badge variant="secondary" className="text-xs px-2 py-1 flex-shrink-0">
                Booked
              </Badge>
            )}
          </Button>
        ))}
      </div>
      
      {timeSlots.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          No time slots available for this date
        </div>
      )}
    </div>
  )
}
