import { createClient } from "@/lib/supabase/client"

export interface Room {
  id: string
  name: string
  capacity: number
  location: string
  amenities: string[]
  is_active: boolean
  created_at: string
}

export interface Booking {
  id: string
  room_id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: "confirmed" | "cancelled"
  attendees?: string[] // Added attendees field to booking interface
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

export async function getRooms(): Promise<Room[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("meeting_rooms").select("*").eq("is_active", true).order("name")

  if (error) throw error
  return data || []
}

export async function getRoomBookings(roomId: string, date: Date): Promise<Booking[]> {
  const supabase = createClient()

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("room_id", roomId)
    .eq("status", "confirmed")
    .gte("start_time", startOfDay.toISOString())
    .lte("start_time", endOfDay.toISOString())
    .order("start_time")

  if (error) throw error
  return data || []
}

export function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startHour = 8 // 8 AM
  const endHour = 18 // 6 PM
  const slotInterval = 30 // 30-minute intervals

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotInterval) {
      const start = new Date(date)
      start.setHours(hour, minute, 0, 0)

      const end = new Date(start)
      end.setMinutes(end.getMinutes() + slotInterval)

      // Only add slot if it doesn't go past end hour
      if (start.getHours() < endHour) {
        slots.push({
          start,
          end,
          available: true, // Will be updated based on existing bookings
        })
      }
    }
  }

  return slots
}

export function checkSlotAvailability(slot: TimeSlot, existingBookings: Booking[]): boolean {
  return !existingBookings.some((booking) => {
    const bookingStart = new Date(booking.start_time)
    const bookingEnd = new Date(booking.end_time)

    // Check for overlap
    return (
      (slot.start >= bookingStart && slot.start < bookingEnd) ||
      (slot.end > bookingStart && slot.end <= bookingEnd) ||
      (slot.start <= bookingStart && slot.end >= bookingEnd)
    )
  })
}

// New function to check if a duration is available from a specific start time
export function checkDurationAvailability(
  startTime: Date,
  durationMinutes: number,
  existingBookings: Booking[]
): boolean {
  const endTime = new Date(startTime)
  endTime.setMinutes(endTime.getMinutes() + durationMinutes)

  // Check if the proposed booking conflicts with any existing booking
  return !existingBookings.some((booking) => {
    const bookingStart = new Date(booking.start_time)
    const bookingEnd = new Date(booking.end_time)

    // Check for overlap
    return (
      (startTime >= bookingStart && startTime < bookingEnd) ||
      (endTime > bookingStart && endTime <= bookingEnd) ||
      (startTime <= bookingStart && endTime >= bookingEnd)
    )
  })
}

// Get available durations from a specific start time
export function getAvailableDurations(
  startTime: Date,
  existingBookings: Booking[],
  maxDurationHours = 8
): { duration: number; label: string; available: boolean }[] {
  const durations = [
    { duration: 30, label: "30 minutes" },
    { duration: 45, label: "45 minutes" },
    { duration: 60, label: "1 hour" },
    { duration: 90, label: "1.5 hours" },
    { duration: 120, label: "2 hours" },
    { duration: 150, label: "2.5 hours" },
    { duration: 180, label: "3 hours" },
    { duration: 240, label: "4 hours" },
    { duration: 300, label: "5 hours" },
    { duration: 360, label: "6 hours" },
    { duration: 420, label: "7 hours" },
    { duration: 480, label: "8 hours" },
  ]

  return durations
    .filter(({ duration }) => duration <= maxDurationHours * 60)
    .map(({ duration, label }) => ({
      duration,
      label,
      available: checkDurationAvailability(startTime, duration, existingBookings)
    }))
}

export async function createBooking(booking: {
  room_id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  attendees?: string[] // Added attendees parameter to booking creation
}): Promise<Booking> {
  const supabase = createClient()

  const { data, error } = await supabase.from("bookings").insert([booking]).select().single()

  if (error) throw error
  return data
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)

  if (error) throw error
}
