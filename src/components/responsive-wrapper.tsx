"use client"

import { cn } from "@/lib/utils"

interface ResponsiveWrapperProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveWrapper({ children, className }: ResponsiveWrapperProps) {
  return (
    <div className={cn(
      "w-full",
      "px-4 sm:px-6 lg:px-8",
      "space-y-4 sm:space-y-6",
      className
    )}>
      {children}
    </div>
  )
}

export function ResponsiveGrid({ children, className }: ResponsiveWrapperProps) {
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}

export function ResponsiveTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-auto">
      <div className="min-w-full">
        {children}
      </div>
    </div>
  )
}