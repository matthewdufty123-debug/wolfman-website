import type { Metadata } from 'next'
import { Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import AuthProvider from '@/components/AuthProvider'
import { CartProvider } from '@/lib/cart'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wolfman',
  description: 'Mindful living. Morning intentions. Matthew Wolfman.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before paint — prevents theme flash on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var t=localStorage.getItem('wolfman-theme')||'dark';
              var f=localStorage.getItem('wolfman-fontsize')||'normal';
              document.documentElement.setAttribute('data-theme',t);
              document.documentElement.setAttribute('data-fontsize',f);
            })();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
