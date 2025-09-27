import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI-InterviewSpark - Advanced Mock Interview Platform',
  description: 'Master your interviews with AI-powered mock sessions, real-time emotional analysis, and personalized feedback.',
  keywords: [
    'mock interview',
    'interview preparation',
    'AI interview',
    'emotional analysis',
    'interview coaching',
    'job preparation',
    'career development',
  ],
  authors: [{ name: 'AI-InterviewSpark Team' }],
  creator: 'AI-InterviewSpark',
  publisher: 'AI-InterviewSpark',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AI-InterviewSpark - Advanced Mock Interview Platform',
    description: 'Master your interviews with AI-powered mock sessions, real-time emotional analysis, and personalized feedback.',
    siteName: 'AI-InterviewSpark',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI-InterviewSpark - Advanced Mock Interview Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-InterviewSpark - Advanced Mock Interview Platform',
    description: 'Master your interviews with AI-powered mock sessions, real-time emotional analysis, and personalized feedback.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}