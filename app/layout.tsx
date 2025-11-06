import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { AuthProvider } from '@/hooks/useAuth'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TikTok Clone',
  description: 'A modern TikTok clone built with Next.js and Supabase',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            {children}
            <Toaster 
              theme="dark"
              position="top-right"
              richColors
              closeButton
            />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
