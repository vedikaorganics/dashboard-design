"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Palette,
  User,
  LogOut,
  Shield,
  Calendar,
  Mail,
  UserCheck,
  Loader2
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { signOut } from "@/lib/auth-client"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, isAdmin, isMember, isLoading, clearSession } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      clearSession()
      toast.success("Signed out successfully")
      window.location.href = "/login"
    } catch (error) {
      toast.error("Error signing out")
    }
  }

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U"
  }

  const getRoleBadgeVariant = () => {
    return isAdmin ? "default" : "secondary"
  }

  const getRoleLabel = () => {
    return isAdmin ? "Admin" : "Member"
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Settings">
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and view your profile information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>
                Your account details and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Avatar and Role */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xl font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center space-y-2">
                  <h3 className="font-medium">{user?.fullName || user?.email || "User"}</h3>
                  <Badge variant={getRoleBadgeVariant()} className="text-xs">
                    <Shield className="mr-1 h-3 w-3" />
                    {getRoleLabel()}
                  </Badge>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-sm">{user?.email || "Not available"}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <p className="text-sm">{user?.isActive ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                </div>

                {user?.lastLogin && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Login</p>
                      <p className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {user?.createdAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Member Since</p>
                      <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Profile changes must be made by an administrator. Contact your admin for any updates.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Appearance</span>
                </CardTitle>
                <CardDescription>
                  Customize how the dashboard looks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Logout Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Sign Out</CardTitle>
                <CardDescription>
                  End your current session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}