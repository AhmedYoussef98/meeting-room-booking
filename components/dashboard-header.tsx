"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Settings, User } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  role?: string
}

export function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/auth/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  const goToAdmin = () => {
    router.push("/admin")
  }

  const goToSettings = () => {
    router.push("/settings")
  }

  if (!user) return null

  const isAdmin = user.email === "admin@yallasquad.com"

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/Screenshot_2025-09-16_at_2.58.18_PM-removebg-preview.png" 
              alt="Squad Logo" 
              className="h-12 w-auto"
            />
            <div>
              <span className="text-sm text-muted-foreground">Meeting Rooms</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={goToAdmin}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                <User className="h-4 w-4 mr-2" />
                Admin
              </Button>
              <Button
                variant="outline"
                onClick={goToSettings}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </>
          )}

          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground bg-transparent"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
