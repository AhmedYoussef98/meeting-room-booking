"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { createBooking, type Room, type TimeSlot, getRoomBookings, getAvailableDurations } from "@/lib/room-utils"
import { RoomAvailability } from "@/components/room-availability"
import { DurationSelector } from "@/components/duration-selector"
import { sendBookingNotifications } from "@/lib/notifications-utils" // Import sendBookingNotifications

interface BookingModalProps {
  room: Room | null
  isOpen: boolean
  onClose: () => void
  onBookingComplete: () => void
}

export function BookingModal({ room, isOpen, onClose, onBookingComplete }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [attendees, setAttendees] = useState("") // Added attendees field
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"datetime" | "duration" | "preview" | "details">("datetime")
  const [previewTimeSlot, setPreviewTimeSlot] = useState<TimeSlot | null>(null)
  const [showDurationSelector, setShowDurationSelector] = useState(false)
  const [roomBookings, setRoomBookings] = useState<any[]>([])
  const [availableDurations, setAvailableDurations] = useState<any[]>([])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date())
      setSelectedTimeSlot(null)
      setPreviewTimeSlot(null)
      setTitle("")
      setDescription("")
      setAttendees("") // Reset attendees field
      setSelectedDuration(60)
      setStep("datetime")
      setError(null)
      setShowDurationSelector(false)
      setRoomBookings([])
      setAvailableDurations([])
    }
  }, [isOpen])

  const handleTimeSlotSelect = async (selectedRoom: Room, timeSlot: TimeSlot) => {
    if (!room) return
    
    try {
      // Get room bookings for the selected date
      const bookings = await getRoomBookings(room.id, selectedDate)
      setRoomBookings(bookings)
      
      // Get available durations for this start time
      const durations = getAvailableDurations(timeSlot.start, bookings)
      setAvailableDurations(durations)
      
      setPreviewTimeSlot(timeSlot)
      setShowDurationSelector(true)
    } catch (error) {
      console.error("Error fetching availability:", error)
      setError("Failed to check availability")
    }
  }

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration)
    if (previewTimeSlot) {
      const endTime = new Date(previewTimeSlot.start)
      endTime.setMinutes(endTime.getMinutes() + duration)
      
      setSelectedTimeSlot({
        start: previewTimeSlot.start,
        end: endTime,
        available: true
      })
      setStep("preview")
    }
    setShowDurationSelector(false)
  }

  const handleConfirmTimeSlot = () => {
    setSelectedTimeSlot(previewTimeSlot)
    setStep("details")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room || !selectedTimeSlot) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Get user from localStorage
      const userData = localStorage.getItem("user")
      if (!userData) {
        throw new Error("User not authenticated")
      }

      const user = JSON.parse(userData)

      // Calculate end time based on selected duration
      const endTime = new Date(selectedTimeSlot.start)
      endTime.setMinutes(endTime.getMinutes() + selectedDuration)

      const attendeeEmails = attendees
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0)

      await createBooking({
        room_id: room.id,
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: selectedTimeSlot.start.toISOString(),
        end_time: endTime.toISOString(),
        attendees: attendeeEmails, // Pass attendees to booking creation
      })

      if (attendeeEmails.length > 0) {
        await sendBookingNotifications({
          attendees: attendeeEmails,
          meeting: {
            title: title.trim(),
            room: room.name,
            date: formatDate(selectedTimeSlot.start),
            time: `${formatTime(selectedTimeSlot.start)} - ${formatTime(endTime)}`,
            organizer: user.full_name,
            description: description.trim(),
            startDateTime: selectedTimeSlot.start.toISOString(),
            endDateTime: endTime.toISOString(),
          },
        })
      }

      onBookingComplete()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

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
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (!room) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:w-[80vw] lg:w-[70vw] max-w-none max-h-[95vh] overflow-y-auto p-4 sm:p-6 lg:p-8" style={{maxWidth: 'none'}}>
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold">Book {room.name}</span>
            {step === "preview" && (
              <Badge variant="outline" className="text-sm">
                Step 2 of 3
              </Badge>
            )}
            {step === "details" && (
              <Badge variant="outline" className="text-sm">
                Step 3 of 3
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === "datetime" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Room Info */}
              <div className="space-y-6">
                <div className="p-6 bg-muted rounded-lg">
                  <h3 className="font-semibold text-xl mb-4">{room.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>{room.capacity} people</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>{room.location}</span>
                    </div>
                  </div>
                  {room.amenities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {room.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="text-sm px-2 py-1">
                          {amenity.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div>
                  <Label className="text-lg font-medium mb-3 block">Select Date</Label>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-md border w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-4 min-w-0 flex-1">
                <Label className="text-lg font-medium block">
                  Available Times for {formatDate(selectedDate)}
                </Label>
                <div className="min-h-[400px] overflow-y-auto border rounded-lg p-6 min-w-[400px]">
                  <RoomAvailability room={room} selectedDate={selectedDate} onTimeSlotSelect={handleTimeSlotSelect} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "preview" && previewTimeSlot && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Confirm Your Time Slot</h2>
              <p className="text-muted-foreground">Please review your selected time slot before proceeding</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="p-6 lg:p-8 bg-primary/5 border-2 border-primary/20 rounded-lg text-center">
                <div className="space-y-4">
                  <div className="text-2xl sm:text-3xl font-bold text-primary break-words">
                    {formatTime(previewTimeSlot.start)} - {formatTime(previewTimeSlot.end)}
                  </div>
                  <div className="text-lg sm:text-xl text-muted-foreground">
                    {formatDate(previewTimeSlot.start)}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>{room.capacity} people</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>{room.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep("datetime")}
                className="h-14 px-8 text-base"
              >
                Back to Time Selection
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmTimeSlot}
                className="bg-primary hover:bg-primary/90 h-14 px-12 text-base font-semibold"
              >
                Confirm This Time Slot
              </Button>
            </div>
          </div>
        )}

        {step === "details" && selectedTimeSlot && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Booking Summary */}
            <div className="p-8 bg-primary/5 border border-primary/20 rounded-lg">
              <h3 className="font-semibold text-xl mb-6">Booking Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Room:</span>
                  <p className="font-semibold text-base">{room.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <p className="font-semibold text-base">{formatDate(selectedTimeSlot.start)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <p className="font-semibold text-sm sm:text-base break-words">
                    {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <p className="font-semibold text-base">
                    {availableDurations.find(d => d.duration === selectedDuration)?.label || `${selectedDuration} minutes`}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Details Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-base font-medium">Meeting Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Team Standup, Client Meeting"
                    required
                    className="mt-3 h-14 text-base px-4"
                  />
                </div>


                <div>
                  <Label htmlFor="attendees" className="text-base font-medium">Attendees (Email addresses)</Label>
                  <Input
                    id="attendees"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    placeholder="email1@yallasquad.com, email2@yallasquad.com"
                    className="mt-3 h-14 text-base px-4"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Separate multiple emails with commas. They will receive booking notifications.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add meeting agenda, attendees, or other details..."
                  rows={8}
                  className="mt-3 text-base resize-none p-4 leading-relaxed"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-base text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep("preview")}
                className="h-14 px-8 text-base"
              >
                Back to Time Preview
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !title.trim()} 
                className="bg-primary hover:bg-primary/90 h-14 px-12 text-base font-semibold"
              >
                {isSubmitting ? "Creating Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        )}

        {/* Duration Selector Modal */}
        <DurationSelector
          isOpen={showDurationSelector}
          onClose={() => setShowDurationSelector(false)}
          startTime={previewTimeSlot?.start || new Date()}
          availableDurations={availableDurations}
          onDurationSelect={handleDurationSelect}
        />
      </DialogContent>
    </Dialog>
  )
}