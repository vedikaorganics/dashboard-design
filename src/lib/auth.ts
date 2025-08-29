import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { magicLink } from "better-auth/plugins/magic-link"
import nodemailer from "nodemailer"
import { clientPromise } from './mongodb' // Use shared MongoDB client
import { 
  getBetterAuthSecret, 
  getBetterAuthUrl, 
  getMailjetApiKey, 
  getMailjetSecretKey, 
  getFromEmail 
} from './env'

// Create Mailjet transporter
const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false,
  auth: {
    user: getMailjetApiKey(),
    pass: getMailjetSecretKey(),
  },
})

// Create and initialize the auth instance
let authInstance: any = null

async function getAuthInstance() {
  if (!authInstance) {
    const client = await clientPromise
    const database = client.db()
    
    authInstance = betterAuth({
      database: mongodbAdapter(database),
      emailAndPassword: {
        enabled: false, // Disable password auth, only magic links
      },
      user: {
        modelName: "staffs", // Use "staffs" collection instead of default "user"
        additionalFields: {
          role: {
            type: "string",
            defaultValue: "member",
          },
          fullName: {
            type: "string",
            required: false,
          },
          isActive: {
            type: "boolean",
            defaultValue: true,
          },
          lastLogin: {
            type: "date",
            required: false,
          },
        },
      },
      plugins: [
        magicLink({
          sendMagicLink: async ({ email, url, token }) => {
            // Check if user exists in staffs collection before sending magic link
            const existingUser = await database.collection('staffs').findOne({ email })
            if (!existingUser) {
              console.log(`Magic link requested for non-existent user: ${email}`)
              throw new Error('No account found with this email address')
            }
            try {
              await transporter.sendMail({
                from: getFromEmail(),
                to: email,
                subject: "Sign in to Vedika Organics Dashboard",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Sign in to Vedika Organics Dashboard</h2>
                    <p>Click the button below to sign in to your dashboard account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${url}" 
                         style="background-color: #007bff; color: white; padding: 12px 24px; 
                                text-decoration: none; border-radius: 6px; display: inline-block;">
                        Sign In
                      </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                      This link will expire in 10 minutes for security purposes.
                    </p>
                  </div>
                `,
                text: `Sign in to Vedika Organics Dashboard\n\nClick this link to sign in: ${url}\n\nIf you didn't request this email, you can safely ignore it.\nThis link will expire in 10 minutes for security purposes.`,
              })
            } catch (error) {
              console.error("Failed to send magic link email:", error)
              throw error
            }
          },
          expiresIn: 60 * 10, // 10 minutes
        }),
      ],
      secret: getBetterAuthSecret(),
      baseURL: getBetterAuthUrl(),
    })
  }
  return authInstance
}

// Export an object that lazy-loads the auth instance
export const auth = {
  // API methods for server-side usage
  api: {
    getSession: async (options: any) => {
      const instance = await getAuthInstance()
      return instance.api.getSession(options)
    },
    // Add other API methods as needed
  },
  
  // Handler for Next.js API routes (/api/auth/*)
  handler: async (...args: any[]) => {
    const instance = await getAuthInstance()
    return instance.handler(...args)
  },
  
  // Client-side methods
  signIn: async (...args: any[]) => {
    const instance = await getAuthInstance()
    return instance.signIn(...args)
  },
  signOut: async (...args: any[]) => {
    const instance = await getAuthInstance()
    return instance.signOut(...args)
  },
  
  // Other commonly used properties/methods
  $Infer: {} as any, // For TypeScript inference (placeholder)
}

// For types, we'll need to define them manually
export interface Session {
  user: {
    id: string
    email: string
    role?: string
    fullName?: string
    isActive?: boolean
    lastLogin?: Date
  }
  session: {
    token: string
    userId: string
    expiresAt: Date
  }
}

export interface User {
  id: string
  email: string
  role?: string
  fullName?: string
  isActive?: boolean
  lastLogin?: Date
}