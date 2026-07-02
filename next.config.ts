import type { NextConfig } from 'next'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appVersion } = require('./package.json') as { appVersion: string }

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  async redirects() {
    return [
      { source: '/features', destination: '/dev', permanent: false },
      { source: '/intentions', destination: '/feed', permanent: false },
    ]
  },
  outputFileTracingIncludes: {
    '/[username]/[slug]/opengraph-image': ['./public/images/site_images/**'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'files.cdn.printful.com',
      },
      // OAuth profile avatars (users.image) — GitHub and Google sign-in
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
