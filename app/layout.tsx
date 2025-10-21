import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import { Analytics } from '@vercel/analytics/next'
import { ClientSessionProvider } from '@/components/session-provider'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Add the weights you need
  variable: '--font-poppins',
})

import './globals.css'

export const metadata: Metadata = {
  title: 'Cubex Learning Management System',
  description: 'Cubex Learning Management System'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
            html {
              font-family: ${poppins.style.fontFamily};
              --font-sans: ${poppins.variable};
              --font-mono: ${GeistMono.variable};
            }
        `}</style>
      </head>
      <body>
        <ClientSessionProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </ClientSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}