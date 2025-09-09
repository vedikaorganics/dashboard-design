"use client"

import { Home, Settings, ShoppingCart, Users, Star, Target, Package, Gift, UserCheck, FileText, Image as ImageIcon, Layout, BookOpen } from "lucide-react"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "next-themes"

const navigationItems = [
  {
    title: "Overview",
    url: "/",
    icon: Home,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    url: "/users",
    icon: Users,
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: Star,
  },
]

const managementItems = [
  {
    title: "Products",
    url: "/products",
    icon: Package,
    roles: ["admin", "member"], // Both roles can access
  },
  {
    title: "Offers",
    url: "/offers",
    icon: Gift,
    roles: ["admin", "member"], // Both roles can access
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Target,
    roles: ["admin", "member"], // Both roles can access
  },
  {
    title: "Staff",
    url: "/staff",
    icon: UserCheck,
    roles: ["admin"], // Only admins can access
  },
]

const cmsItems = [
  {
    title: "Pages",
    url: "/cms/pages",
    icon: FileText,
    roles: ["admin", "member"], // Both roles can access
  },
  {
    title: "Products",
    url: "/cms/products",
    icon: Package,
    roles: ["admin", "member"], // Both roles can access
  },
  {
    title: "Blog",
    url: "/cms/blog",
    icon: BookOpen,
    roles: ["admin", "member"], // Both roles can access
  },
  {
    title: "Media Library",
    url: "/cms/media",
    icon: ImageIcon,
    roles: ["admin", "member"], // Both roles can access
  },
]

const systemItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const userRole = user?.role || "member"
  const { state } = useSidebar()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper function to determine if a navigation item is active
  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(url)
  }

  // Filter management items based on user role
  const filteredManagementItems = managementItems.filter(item => 
    item.roles.includes(userRole)
  )

  // Filter CMS items based on user role
  const filteredCMSItems = cmsItems.filter(item => 
    item.roles.includes(userRole)
  )

  // Use theme-aware logo only after component is mounted to avoid hydration mismatch
  const logoSrc = mounted 
    ? (theme === "dark" ? "/vedika-logo-dark.png" : "/vedika-logo-light.png")
    : "/vedika-logo-light.png" // Default during SSR

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={`border-b border-sidebar-border transition-all duration-200 ${
        state === "collapsed" ? "opacity-0 h-0 py-0" : "opacity-100 h-14"
      }`}>
        <div className="flex items-center gap-2 px-4 h-full">
          <Image
            src={logoSrc}
            alt="Vedika Organics"
            width={20}
            height={20}
            className="shrink-0"
          />
          <span className="font-semibold text-sidebar-foreground">
            Vedika Organics
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredCMSItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}