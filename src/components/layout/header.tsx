"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Sun, Moon, User, LogOut, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { signOut } from "@/lib/auth-client"
import { SearchDropdown } from "@/components/search/search-dropdown"
import { useGlobalSearch } from "@/hooks/use-data"
import { 
  SearchResult, 
  SearchResponse,
  getSearchResultUrl 
} from "@/lib/search-utils"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { user, isAdmin, isMember, clearSession } = useAuth()
  const router = useRouter()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const { data: searchResults, isLoading: searchLoading } = useGlobalSearch(searchQuery)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
      // Clear session state immediately
      clearSession()
      toast.success("Signed out successfully")
      // Use window.location for a hard redirect to ensure auth state is cleared
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

  const getRoleLabel = () => {
    return isAdmin ? "Admin" : "Member"
  }

  // Search handlers
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    setShowDropdown(value.length > 0)
  }

  const handleSearchFocus = () => {
    setSearchFocused(true)
    setShowDropdown(true)
  }

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow clicking on results
    setTimeout(() => {
      setSearchFocused(false)
      setShowDropdown(false)
    }, 200)
  }

  const handleResultClick = (result: SearchResult) => {
    const url = getSearchResultUrl(result)
    router.push(url)
    setSearchQuery("")
    setShowDropdown(false)
  }

  const handleViewAll = (category: keyof SearchResponse['categories']) => {
    const routes = {
      users: '/users',
      orders: '/orders', 
      reviews: '/reviews'
    }
    
    router.push(`${routes[category]}?search=${encodeURIComponent(searchQuery)}`)
    setSearchQuery("")
    setShowDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <SidebarTrigger />
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-4">
          <div className="flex items-center">
            {title && (
              <h1 className="text-xl font-semibold">{title}</h1>
            )}
          </div>
          
          <div className="hidden w-full flex-1 md:flex md:justify-center md:max-w-md">
            <div className="relative w-full" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="pl-9 w-full"
              />
              
              <SearchDropdown
                results={searchResults}
                isLoading={searchLoading}
                isOpen={showDropdown && (searchFocused || searchQuery.length >= 2)}
                onResultClick={handleResultClick}
                onViewAll={handleViewAll}
              />
            </div>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName || user?.email || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <div className="mt-2">
                      <Badge 
                        variant={isAdmin ? "default" : "secondary"} 
                        className={`text-xs ${
                          isAdmin 
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                            : ""
                        }`}
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {getRoleLabel()}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}