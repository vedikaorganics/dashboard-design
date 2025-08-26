import { createAuthClient } from "better-auth/client"
import { magicLinkClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [magicLinkClient()],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient