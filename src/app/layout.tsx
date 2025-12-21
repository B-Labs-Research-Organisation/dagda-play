import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from '@/components/providers/Providers'
import { FrameMeta } from '@/components/frame/FrameMeta'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dagda Play - Irish God of Games",
  description: "Play Coinflip & Randomizer games! Earn PIE tokens and collect achievements. Farcaster users get bonus rewards!",
  keywords: ["gaming", "blockchain", "farcaster", "mini app", "games", "PIE tokens"],
  authors: [{ name: "Dagda Play" }],
  openGraph: {
    title: "🏰 Dagda Play - Play & Earn PIE!",
    description: "Irish God of Games awaits! Coinflip, Randomizer, and exclusive Farcaster rewards.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dagda Play",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "🏰 Dagda Play",
    description: "Play games, earn PIE tokens! Farcaster users get bonus rewards.",
    images: ["/og-image.png"],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dagda-play.vercel.app'}/preview.svg`,
      button: {
        title: "Launch App",
        action: {
          type: "launch_frame",
          name: "Dagda Play",
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dagda-play.vercel.app'}`,
          splashImageUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dagda-play.vercel.app'}/splash.svg`,
          splashBackgroundColor: "#10b981",
        },
      },
    }),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <FrameMeta />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
