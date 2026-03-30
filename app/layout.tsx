import type { Metadata } from 'next'
import { Lora, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import AuthProvider from '@/components/AuthProvider'
import { CartProvider } from '@/lib/cart'
import { Analytics } from '@vercel/analytics/next'
import LandscapeBlock from '@/components/LandscapeBlock'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lora',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Wolfman',
    default: 'Wolfman',
  },
  description: 'Mindful living. Morning intentions. Matthew Wolfman.',
  metadataBase: new URL('https://wolfman.blog'),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wolfman',
  },
  themeColor: '#4A7FA5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before paint — prevents theme flash on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var t=localStorage.getItem('wolfman-theme')||'light';
              var f=localStorage.getItem('wolfman-fontsize')||'normal';
              document.documentElement.setAttribute('data-theme',t);
              document.documentElement.setAttribute('data-fontsize',f);
            })();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <LandscapeBlock />
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
