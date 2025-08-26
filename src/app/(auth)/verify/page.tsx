"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { getSession } from "@/lib/auth-client"

function VerifyContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // BetterAuth automatically handles token verification through the API routes
        // We just need to check if the session was created successfully
        const session = await getSession()
        
        if (session) {
          setStatus("success")
          setMessage("Successfully signed in!")
          toast.success("Welcome back!")
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          setStatus("error")
          setMessage("Invalid or expired magic link")
          toast.error("Magic link verification failed")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setMessage("Something went wrong during verification")
        toast.error("Verification failed")
      }
    }

    // Only verify if we have token parameters
    const token = searchParams.get("token")
    if (token) {
      verifyToken()
    } else {
      setStatus("error")
      setMessage("No verification token provided")
    }
  }, [searchParams, router])

  const handleRetryLogin = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center">
            {status === "loading" && (
              <div className="bg-blue-600 rounded-full p-3">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="bg-green-600 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            )}
            {status === "error" && (
              <div className="bg-red-600 rounded-full p-3">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Verifying..."}
            {status === "success" && "Welcome Back!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your magic link...
              </p>
            </div>
          )}
          
          {status === "success" && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                You will be redirected to the dashboard shortly.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Please try signing in again with a new magic link.
              </p>
              <Button onClick={handleRetryLogin} className="w-full">
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}