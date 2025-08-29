type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface PerformanceMetrics {
  operation: string
  duration: number
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isDebugEnabled = process.env.ENABLE_DEBUG_LOGS === 'true'
  private isVercelProduction = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production'

  private shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === 'error') return true
    
    // In development, log everything
    if (this.isDevelopment) return true
    
    // In production, only log if debug is explicitly enabled
    if (this.isDebugEnabled) return true
    
    // Warn level logs in production
    if (level === 'warn') return true
    
    return false
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      console.error(`❌ ERROR: ${message}`, error)
    }
  }

  // Performance logging specifically for timing operations
  performance(metrics: PerformanceMetrics) {
    if (this.shouldLog('info')) {
      console.log(`⏱️ PERF: ${metrics.operation} completed in ${metrics.duration}ms`, 
        metrics.metadata ? JSON.stringify(metrics.metadata) : '')
    }
  }

  // Performance breakdown logging
  performanceBreakdown(operation: string, breakdown: Record<string, number>) {
    if (this.shouldLog('info')) {
      console.log(`📈 PERF BREAKDOWN: ${operation}`)
      Object.entries(breakdown).forEach(([step, duration]) => {
        console.log(`   ├── ${step}: ${duration}ms`)
      })
      const total = Object.values(breakdown).reduce((sum, duration) => sum + duration, 0)
      console.log(`   └── Total: ${total}ms`)
    }
  }

  // API request logging
  apiRequest(method: string, endpoint: string, startTime: number) {
    if (this.shouldLog('info')) {
      const duration = Date.now() - startTime
      console.log(`🚀 API: ${method} ${endpoint} - ${duration}ms`)
    }
  }

  // Database query logging
  dbQuery(operation: string, duration: number, recordCount?: number) {
    if (this.shouldLog('debug')) {
      const metadata = recordCount !== undefined ? ` (${recordCount} records)` : ''
      console.log(`🗄️ DB: ${operation} - ${duration}ms${metadata}`)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for use in other files
export type { LogLevel, PerformanceMetrics }