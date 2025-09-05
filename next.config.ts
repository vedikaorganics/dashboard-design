import type { NextConfig } from "next";

// Validate environment variables at build time
function validateEnvVars() {
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
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'MUX_TOKEN_ID',
    'MUX_TOKEN_SECRET',
  ] as const

  const missingVars: string[] = []

  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    console.error('\n❌ Build failed: Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('\nPlease check your environment files (.env.local, .env, etc.) and ensure all variables are set.\n')
    process.exit(1)
  }
  
  console.log('✅ All required environment variables are present')
}

// Run validation immediately
validateEnvVars()

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  env: {
    // Make VERCEL_ENV available on client-side
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stream.mux.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.mux.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
