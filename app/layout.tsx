import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Poppins, Dancing_Script } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { AppProviders } from "@/providers"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
})

const dancing = Dancing_Script({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-dancing",
})

export const metadata: Metadata = {
  title: "MAISON JOIE | Perfume with Elegance",
  description:
    "Premium perfumes and fragrances with elegance. Shop now and get a free gift card with every order! Based in Kenya 🇰🇪",
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/icon-512.png',
  },
  openGraph: {
    title: 'MAISON JOIE | Perfume with Elegance',
    description: 'Premium perfumes and fragrances with elegance',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Maison Joie',
    locale: 'en_KE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MAISON JOIE | Perfume with Elegance',
    description: 'Premium perfumes and fragrances with elegance',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: "#f43f5e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isAdmin = pathname.startsWith("/admin")

  return (
    <html lang="en">
      <body className={`${poppins.variable} ${dancing.variable} font-sans antialiased`}>
        <AppProviders>
          {!isAdmin && <Header />}
          <main className={isAdmin ? "min-h-screen" : "min-h-screen pb-20 md:pb-0"}>
            {children}
          </main>
          {!isAdmin && (
            <>
              <Footer />
              <MobileNav />
              <WhatsAppButton />
              <PWAInstallPrompt />
            </>
          )}
        </AppProviders>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#ffe4e6', // rose-100 - lighter pink
              border: '1px solid #fda4af', // rose-300
              color: '#881337', // rose-950
            },
            classNames: {
              actionButton: "bg-black text-white hover:bg-gray-800",
              cancelButton: "bg-rose-100 text-rose-900",
            },
          }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
