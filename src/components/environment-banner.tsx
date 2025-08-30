"use client"

import { AlertTriangle, TestTube, Zap } from "lucide-react"

export function EnvironmentBanner() {
  // Only show in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const getEnvironmentInfo = () => {
    const env = process.env.NODE_ENV || 'development'
    
    switch (env) {
      case 'development':
        return {
          label: 'DEV',
          description: 'Development Mode',
          icon: Zap,
          className: 'bg-info text-info-foreground border-info'
        }
      case 'test':
        return {
          label: 'TEST',
          description: 'Test Environment',
          icon: TestTube,
          className: 'bg-warning text-warning-foreground border-warning'
        }
      default:
        return {
          label: 'NON-PROD',
          description: `${env.toUpperCase()} Environment`,
          icon: AlertTriangle,
          className: 'bg-destructive text-destructive-foreground border-destructive'
        }
    }
  }

  const envInfo = getEnvironmentInfo()
  const Icon = envInfo.icon

  return (
    <div className={`${envInfo.className} border-b`}>
      <div className="flex items-center justify-center text-sm font-medium px-4 py-1.5">
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3" />
          <span className="text-xs">{envInfo.label}: {envInfo.description}</span>
          <span className="text-xs opacity-75 font-mono ml-2">
            ({process.env.NODE_ENV})
          </span>
        </div>
      </div>
    </div>
  )
}