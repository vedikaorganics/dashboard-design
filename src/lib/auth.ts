import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { magicLink } from "better-auth/plugins/magic-link"
import { MongoClient } from "mongodb"
import nodemailer from "nodemailer"

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required")
}

// Create MongoDB client
const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})

const db = client.db()

// Create Mailjet transporter
const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY,
  },
})

export const auth = betterAuth({
  database: mongodbAdapter(db),
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
        try {
          await transporter.sendMail({
            from: process.env.FROM_EMAIL || "noreply@vedika-organics.com",
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
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
})

export type Session = typeof auth.$Infer.Session.session & {
  user: typeof auth.$Infer.Session.user
}
export type User = typeof auth.$Infer.Session.user