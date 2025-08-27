/**
 * Environment variable validation
 * This file ensures all required environment variables are present at build time
 */

interface RequiredEnvVars {
  // Database
  MONGODB_URI: string
  
  // Authentication
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  
  // Email (Mailjet)
  MAILJET_API_KEY: string
  MAILJET_SECRET_KEY: string
  FROM_EMAIL: string
  
  // Payment Server
  NEXT_PUBLIC_PAYMENT_SERVER_URL: string
  PAYMENT_SERVER_API_KEY: string
  
  // LimeChat
  LIMECHAT_ACCESS_TOKEN: string
  LIMECHAT_ACCOUNT_ID: string
}

function validateEnvVars(): RequiredEnvVars {
  const requiredVars = [
    'MONGODB_URI',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'MAILJET_API_KEY',
    'MAILJET_SECRET_KEY',
    'FROM_EMAIL',
    'NEXT_PUBLIC_PAYMENT_SERVER_URL',
    'PAYMENT_SERVER_API_KEY',
    'LIMECHAT_ACCESS_TOKEN',
    'LIMECHAT_ACCOUNT_ID',
  ] as const

  const missingVars: string[] = []
  const envVars: Partial<RequiredEnvVars> = {}

  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missingVars.push(varName)
    } else {
      envVars[varName] = value
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars
        .map(v => `  - ${v}`)
        .join('\n')}\n\nPlease check your .env.local file and ensure all variables are set.`
    )
  }

  return envVars as RequiredEnvVars
}

// Validate environment variables immediately when this module is imported
export const env = validateEnvVars()

// Helper functions for accessing validated environment variables
export const getPaymentServerUrl = () => env.NEXT_PUBLIC_PAYMENT_SERVER_URL
export const getPaymentServerApiKey = () => env.PAYMENT_SERVER_API_KEY
export const getMongoDbUri = () => env.MONGODB_URI
export const getBetterAuthSecret = () => env.BETTER_AUTH_SECRET
export const getBetterAuthUrl = () => env.BETTER_AUTH_URL
export const getMailjetApiKey = () => env.MAILJET_API_KEY
export const getMailjetSecretKey = () => env.MAILJET_SECRET_KEY
export const getFromEmail = () => env.FROM_EMAIL
export const getLimeChatAccessToken = () => env.LIMECHAT_ACCESS_TOKEN
export const getLimeChatAccountId = () => env.LIMECHAT_ACCOUNT_ID