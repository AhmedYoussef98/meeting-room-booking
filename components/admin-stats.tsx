"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Building, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Stats {
  totalRooms: number
  totalUsers: number
  todayBookings: number
  activeBookings: number
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalRooms: 0,
    totalUsers: 0,
    todayBookings: 0,
    activeBookings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        // Get total rooms
        const { count: roomCount } = await supabase
          .from("meeting_rooms")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)

        // Get total users
        const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true })

        // Get today's bookings
        const today = new Date()
        const startOfDay = new Date(today.setHours(0, 0, 0, 0))
        const endOfDay = new Date(today.setHours(23, 59, 59, 999))

        const { count: todayCount } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "confirmed")
          .gte("start_time", startOfDay.toISOString())
          .lte("start_time", endOfDay.toISOString())

        // Get active bookings (happening right now)
        const now = new Date()
        const { count: activeCount } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "confirmed")
          .lte("start_time", now.toISOString())
          .gte("end_time", now.toISOString())

        setStats({
          totalRooms: roomCount || 0,
          totalUsers: userCount || 0,
          todayBookings: todayCount || 0,
          activeBookings: activeCount || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Rooms",
      value: stats.totalRooms,
      icon: Building,
      color: "text-blue-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "Active Now",
      value: stats.activeBookings,
      icon: Clock,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="h-8 w-12 bg-muted animate-pulse rounded"></div> : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
