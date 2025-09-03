/**
 * Environment variable helpers
 * Environment variables are validated at build time in next.config.ts
 */

// Helper functions for accessing environment variables
// These assume variables are already validated at build time
export const getPaymentServerUrl = () => process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL!
export const getPaymentServerApiKey = () => process.env.PAYMENT_SERVER_API_KEY!
export const getMongoDbUri = () => process.env.MONGODB_URI!
export const getBetterAuthSecret = () => process.env.BETTER_AUTH_SECRET!
export const getBetterAuthUrl = () => process.env.BETTER_AUTH_URL!
export const getMailjetApiKey = () => process.env.MAILJET_API_KEY!
export const getMailjetSecretKey = () => process.env.MAILJET_SECRET_KEY!
export const getFromEmail = () => process.env.FROM_EMAIL!
export const getLimeChatAccessToken = () => process.env.LIMECHAT_ACCESS_TOKEN!
export const getLimeChatAccountId = () => process.env.LIMECHAT_ACCOUNT_ID!
export const getCloudflareStreamCustomerCode = () => process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE!