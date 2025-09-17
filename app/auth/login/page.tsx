"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    console.log("[v0] handleLogin called")
    e.preventDefault()
    console.log("[v0] preventDefault called")
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting login with:", { email, pin })

      // First, verify the user exists in our users table with the correct PIN
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, pin, full_name, role")
        .eq("email", email)
        .eq("pin", pin)
        .eq("is_active", true)
        .single()

      console.log("[v0] Database query result:", { userData, userError })

      if (userError || !userData) {
        console.log("[v0] Login failed - user not found or incorrect PIN")
        throw new Error("Invalid email or PIN")
      }

      console.log("[v0] Login successful for user:", userData.full_name)

      // For now, we'll create a simple session by storing user data in localStorage
      // In a production app, you'd want proper JWT tokens or Supabase auth
      const userDataToStore = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      }
      
      console.log("[v0] Storing user data:", userDataToStore)
      localStorage.setItem("user", JSON.stringify(userDataToStore))
      console.log("[v0] User data stored, redirecting to dashboard...")

      // Force page reload to dashboard
      window.location.href = "/dashboard"
      console.log("[v0] Redirect command sent")
    } catch (error: unknown) {
      console.log("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen squad-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex flex-col items-center space-y-4">
              <img 
                src="/Screenshot_2025-09-16_at_2.58.18_PM-removebg-preview.png" 
                alt="Squad Logo" 
                className="h-20 w-auto"
              />
              <div>
                <CardDescription className="text-lg text-squad-primary/70">Meeting Room Booking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-squad-primary">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@yallasquad.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base border-squad-purple-light focus:ring-squad-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium text-squad-primary">
                  PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your 4-digit PIN"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="h-12 text-base text-center tracking-widest border-squad-purple-light focus:ring-squad-secondary"
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-squad-secondary hover:bg-squad-secondary/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
