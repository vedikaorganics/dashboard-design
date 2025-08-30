"use client"

import { AlertTriangle, TestTube, Zap } from "lucide-react"

export function EnvironmentBanner() {
  const getEnvironmentInfo = () => {
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
    const nodeEnv = process.env.NODE_ENV || 'development'
    const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL || ''
    
    // Use VERCEL_ENV as primary environment indicator, fallback to NODE_ENV
    const currentEnv = vercelEnv || nodeEnv
    
    // Don't show in actual production
    if (currentEnv === 'production') {
      return null
    }
    
    // Determine environment type based on VERCEL_ENV first, then NODE_ENV
    if (currentEnv === 'development') {
      return {
        label: 'DEV',
        description: 'Development Mode',
        icon: Zap,
        className: 'bg-info text-info-foreground border-info',
        env: currentEnv
      }
    } else if (currentEnv === 'preview' || paymentUrl.includes('staging')) {
      return {
        label: 'STAGING',
        description: 'Staging Environment',
        icon: TestTube,
        className: 'bg-warning text-warning-foreground border-warning',
        env: currentEnv
      }
    } else if (currentEnv === 'test') {
      return {
        label: 'TEST',
        description: 'Test Environment',
        icon: TestTube,
        className: 'bg-warning text-warning-foreground border-warning',
        env: currentEnv
      }
    } else {
      return {
        label: 'NON-PROD',
        description: `Environment: ${currentEnv}`,
        icon: AlertTriangle,
        className: 'bg-destructive text-destructive-foreground border-destructive',
        env: currentEnv
      }
    }
  }

  const envInfo = getEnvironmentInfo()
  
  // Don't render if envInfo is null (production)
  if (!envInfo) {
    return null
  }

  const Icon = envInfo.icon

  return (
    <div className={`${envInfo.className} border-b`}>
      <div className="flex items-center justify-center text-sm font-medium px-4 py-1.5">
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3" />
          <span className="text-xs">{envInfo.label}: {envInfo.description}</span>
          <span className="text-xs opacity-75 font-mono ml-2">
            ({envInfo.env})
          </span>
        </div>
      </div>
    </div>
  )
}