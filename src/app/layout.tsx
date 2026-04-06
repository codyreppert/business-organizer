import type { Metadata, Viewport } from 'next'
import Nav from '@/components/Nav'
import ThemeProvider from '@/components/ThemeProvider'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Business Organizer',
  description: 'Track business assets, trips, and expenses',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Business Organizer',
  },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <ThemeProvider />
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
