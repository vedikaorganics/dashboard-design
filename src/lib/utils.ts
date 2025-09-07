import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDateTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  // Format time (12-hour format)
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase()
  
  // Determine relative date
  let relativeDate: string
  
  if (targetDate.getTime() === today.getTime()) {
    relativeDate = 'Today'
  } else if (targetDate.getTime() === yesterday.getTime()) {
    relativeDate = 'Yesterday'
  } else {
    const daysDiff = Math.floor((today.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000))
    
    if (daysDiff < 7 && daysDiff > 0) {
      // Within the past week - show day name
      relativeDate = date.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      // More than a week ago - show full date
      relativeDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
      
      // Add year if not current year
      if (date.getFullYear() !== now.getFullYear()) {
        relativeDate += `, ${date.getFullYear()}`
      }
    }
  }
  
  return { time, relativeDate }
}
