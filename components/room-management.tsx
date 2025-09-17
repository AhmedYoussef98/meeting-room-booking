"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, MapPin, Monitor, Phone, Utensils, Wifi, Presentation, Plus, Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Room {
  id: string
  name: string
  capacity: number
  location: string
  amenities: string[]
  is_active: boolean
  created_at: string
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

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: "",
    capacity: "",
    location: "",
    amenities: [] as string[]
  })
  const [addingRoom, setAddingRoom] = useState(false)

  const fetchRooms = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("meeting_rooms").select("*").order("name")

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.capacity || !newRoom.location) {
      alert("Please fill in all required fields")
      return
    }

    if (!Number.isInteger(Number(newRoom.capacity)) || Number(newRoom.capacity) <= 0) {
      alert("Capacity must be a positive number")
      return
    }

    setAddingRoom(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("meeting_rooms").insert([
        {
          name: newRoom.name,
          capacity: Number(newRoom.capacity),
          location: newRoom.location,
          amenities: newRoom.amenities,
        },
      ])

      if (error) throw error

      setNewRoom({ name: "", capacity: "", location: "", amenities: [] })
      setShowAddRoom(false)
      await fetchRooms()
      alert("Room added successfully!")
    } catch (error) {
      console.error("Error adding room:", error)
      alert("Error adding room. Please try again.")
    } finally {
      setAddingRoom(false)
    }
  }

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE the room "${roomName}"? This action cannot be undone and will also delete all associated bookings.`)) {
      return
    }

    const supabase = createClient()

    try {
      // Delete the room (this will cascade delete bookings due to foreign key constraint)
      const { error } = await supabase.from("meeting_rooms").delete().eq("id", roomId)

      if (error) throw error

      await fetchRooms()
      alert("Room deleted successfully!")
    } catch (error) {
      console.error("Error deleting room:", error)
      alert("Error deleting room. Please try again.")
    }
  }

  const toggleRoomStatus = async (roomId: string, currentStatus: boolean) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("meeting_rooms").update({ is_active: !currentStatus }).eq("id", roomId)

      if (error) throw error
      fetchRooms()
    } catch (error) {
      console.error("Error updating room status:", error)
    }
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Room Management</CardTitle>
          <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Meeting Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name *</Label>
                  <Input
                    id="roomName"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="e.g., Conference Room A"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                    placeholder="e.g., 8"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={newRoom.location}
                    onChange={(e) => setNewRoom({ ...newRoom, location: e.target.value })}
                    placeholder="e.g., Floor 1"
                  />
                </div>
                <div>
                  <Label>Amenities (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['projector', 'whiteboard', 'video_conference', 'phone', 'tv_screen', 'catering'].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newRoom.amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRoom({ ...newRoom, amenities: [...newRoom.amenities, amenity] })
                            } else {
                              setNewRoom({ ...newRoom, amenities: newRoom.amenities.filter(a => a !== amenity) })
                            }
                          }}
                        />
                        <span className="text-sm capitalize">{amenity.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddRoom(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRoom} disabled={addingRoom}>
                    {addingRoom ? "Adding..." : "Add Room"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Input placeholder="Search rooms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No rooms found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <Card key={room.id} className={`${!room.is_active ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{room.name}</CardTitle>
                    <Badge
                      variant={room.is_active ? "default" : "secondary"}
                      className={room.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {room.is_active ? "Active" : "Inactive"}
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

                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-1 text-xs text-muted-foreground">
                        {getAmenityIcon(amenity)}
                        <span className="capitalize">{amenity.replace("_", " ")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRoomStatus(room.id, room.is_active)}
                      className={
                        room.is_active ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"
                      }
                    >
                      {room.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      className="text-destructive hover:bg-destructive/10 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
