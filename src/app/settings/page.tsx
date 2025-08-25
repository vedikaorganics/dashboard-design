"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Save
} from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [userInfo, setUserInfo] = useState({
    name: "Admin User",
    email: "admin@vedikaorganics.com",
  })

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Settings saved', { userInfo, theme })
  }

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logging out...')
  }

  return (
    <DashboardLayout title="Settings">
      <div className="flex justify-center py-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences
            </p>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-xs uppercase tracking-wider text-muted-foreground">
                Theme
              </Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="h-9 border-0 bg-muted/50">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </div>
            
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xl font-medium">
                  {userInfo.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" className="text-xs">
                Change photo
              </Button>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="h-9 border-0 bg-muted/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="h-9 border-0 bg-muted/50"
                />
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button onClick={handleSave} className="w-full h-10">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}