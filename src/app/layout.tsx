import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ToastContainer } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haulage Monitoring System",
  description: "Monitor diesel supplies to telecom sites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

