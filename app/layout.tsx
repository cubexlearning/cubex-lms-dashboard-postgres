import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ClientSessionProvider } from '@/components/session-provider'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'

export const metadata: Metadata = {
  title: 'LMS Platform',
  description: 'Learning Management System'
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
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
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
        <SpeedInsights />
      </body>
    </html>
  )
}