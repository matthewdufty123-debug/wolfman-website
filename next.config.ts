import type { NextConfig } from 'next'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appVersion } = require('./package.json') as { appVersion: string }

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
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
    ],
  },
}

export default nextConfig
