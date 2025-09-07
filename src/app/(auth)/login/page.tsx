"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { signIn } from "@/lib/auth-client"
import { Loader2, Mail } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Image from "next/image"
import { useTheme } from "next-themes"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { session } = useAuth()
  const { theme } = useTheme()
  
  // Determine which logo to use based on theme
  const logoSrc = theme === "dark" ? "/vedika-logo-dark.png" : "/vedika-logo-light.png"

  // Redirect if already authenticated
  useEffect(() => {
    if (session && !isLoading) {
      router.push("/")
    }
  }, [session, isLoading, router])

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 relative">
            <Image
              src={logoSrc}
              alt="Vedika Organics"
              width={48}
              height={48}
              className="mx-auto"
            />
            <Loader2 className="h-4 w-4 animate-spin absolute -bottom-2 right-1/2 translate-x-1/2" />
          </div>
          <h1 className="text-2xl font-bold">Redirecting...</h1>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await signIn.magicLink({
        email,
        callbackURL: "/",
      })
      
      if (error) {
        // Show user-friendly error for non-existent accounts
        if (error.message?.includes('No account found')) {
          toast.error("No account found with this email address. Please contact your administrator.")
        } else {
          toast.error(error.message || "Failed to send magic link")
        }
      } else {
        toast.success("Check your email for the magic link!")
        setEmail("")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Magic link error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6">
            <Image
              src={logoSrc}
              alt="Vedika Organics"
              width={48}
              height={48}
              className="mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Magic Link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Magic Link
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}