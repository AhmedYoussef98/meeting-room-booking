"use client"

import { AdminHeader } from "@/components/admin-header"
import { AdminTabs } from "@/components/admin-tabs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/auth/login")
      return
    }

    const user = JSON.parse(userData)
    if (user.email !== "admin@yallasquad.com") {
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage users and meeting rooms (Admin Only)</p>
        </div>

        <AdminTabs />
      </main>
    </div>
  )
}