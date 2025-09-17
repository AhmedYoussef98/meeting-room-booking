"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Mail, Calendar, Plus, Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  full_name: string
  pin: string
  created_at: string
  role?: string
  is_active?: boolean
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", pin: "" })
  const [addingUser, setAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editUserData, setEditUserData] = useState({ name: "", email: "", pin: "" })

  const fetchUsers = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("users").select("*").order("full_name")

      console.log("[UserManagement] Fetched users:", data)
      console.log("[UserManagement] Error:", error)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.pin) {
      alert("Please fill in all fields")
      return
    }

    if (newUser.pin.length !== 4 || !/^\d+$/.test(newUser.pin)) {
      alert("PIN must be exactly 4 digits")
      return
    }

    setAddingUser(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("users").insert([
        {
          full_name: newUser.name,
          email: newUser.email,
          pin: newUser.pin,
        },
      ])

      if (error) throw error

      setNewUser({ name: "", email: "", pin: "" })
      setShowAddUser(false)

      await fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      alert("Error adding user. Please try again.")
    } finally {
      setAddingUser(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditUserData({
      name: user.full_name,
      email: user.email,
      pin: user.pin
    })
    setShowEditUser(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    if (!editUserData.name || !editUserData.email || !editUserData.pin) {
      alert("Please fill in all fields")
      return
    }

    if (editUserData.pin.length !== 4 || !/^\d+$/.test(editUserData.pin)) {
      alert("PIN must be exactly 4 digits")
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.from("users")
        .update({
          full_name: editUserData.name,
          email: editUserData.email,
          pin: editUserData.pin,
        })
        .eq("id", editingUser.id)

      if (error) throw error

      setShowEditUser(false)
      setEditingUser(null)
      setEditUserData({ name: "", email: "", pin: "" })
      await fetchUsers()
      alert("User updated successfully!")
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Error updating user. Please try again.")
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE user "${userName}"? This action cannot be undone and will also delete all their bookings.`)) {
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error

      await fetchUsers()
      alert("User deleted successfully!")
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error deleting user. Please try again.")
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="pin">4-Digit PIN</Label>
                  <Input
                    id="pin"
                    type="text"
                    maxLength={4}
                    value={newUser.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setNewUser({ ...newUser, pin: value })
                    }}
                    placeholder="Enter 4-digit PIN"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={addingUser}>
                    {addingUser ? "Adding..." : "Add User"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </CardHeader>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="editPin">4-Digit PIN</Label>
              <Input
                id="editPin"
                type="text"
                maxLength={4}
                value={editUserData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  setEditUserData({ ...editUserData, pin: value })
                }}
                placeholder="Enter 4-digit PIN"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No users found</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono">
                      PIN: {user.pin}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 bg-transparent"
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
