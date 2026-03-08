import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ToastContainer } from "@/components/Toast";
import InstallPWA from "@/components/InstallPWA";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};
export const metadata: Metadata = {
  metadataBase: new URL("https://nexhaul.sellyticshq.com"),
  title: {
    default: "NexHaul | Logistics Visibility & Critical Field Service Management",
    template: "%s | NexHaul",
  },
  description: "Eliminate manual waybills and track cargo in real-time. NexHaul automates work orders and maintenance tracking for Telecom, Data Centers, and Fleet operations.",
  keywords: [
    "logistics visibility",
    "digital waybill nigeria",
    "telecom site maintenance software",
    "data center field service",
    "proof of work tracking",
    "nexhaul", "inventory", "clusters", "sites",
    "trips & logistics", "supplies", "reconciliation", "work orders", "field service",
    "live tracking", "Asset registry", "asset tracking", "preventive maintenance",
    "safety compliance", "reports centre", "audit trail", "knowledge base", "sellytics", "maintain", "infrastructure", "infra", "teams", "b2b", "b2c"
  ],
  manifest: '/manifest.json',
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NexHaul | End-to-End Logistics & Field Service Visibility",
    description: "Digital truth for businesses that move. Track cargo, automate waybills, and verify site engineer maintenance in real-time.",
    url: "https://nexhaul.sellyticshq.com",
    siteName: "NexHaul",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NexHaul Logistics & Maintenance Dashboard",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexHaul | Digital Waybills & Critical Site Maintenance Tracking",
    description: "Stop the cargo invisibility. Automate work orders and get real-time proof of completion for field operations.",
    site: "@nexhaul",
    creator: "@sellytics",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexHaul',
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "wJJgrGfMKG2vJ7Dr7ENXqdSykoimxp_DV8qNEAKi9P4",
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA splash screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NexHaul" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T02YNQ3W0S"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-T02YNQ3W0S', { debug_mode: true });
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Blocking script to apply saved theme BEFORE React hydration — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ht-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){}})()`,
          }}
        />
        <AuthProvider>
          <ServiceWorkerRegistration />
          <ToastContainer />
          <InstallPWA />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
