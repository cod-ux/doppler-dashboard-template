import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'careCycle Dashboard',
  description: 'Custom dashboard for careCycle prompt optimization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <Image
                  src="/doppler_icon.png"
                  alt="doppler"
                  width={120}
                  height={120}
                  /* className="rounded-lg border border-gray-800" */
                />
                
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}