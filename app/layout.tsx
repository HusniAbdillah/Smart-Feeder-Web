import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smartfeeder.my.id"),

  title: "Smart Feeder",
  description: "Pemantauan kualitas air real-time berbasis IoT.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Feeder",
  },

  openGraph: {
    title: "Smart Feeder",
    description: "Pemantauan kualitas air real-time berbasis IoT.",
    url: "/",
    siteName: "Smart Feeder",
    images: [
      {
        url: "/1.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    images: ["/1.png"],
  },
};

export const viewport = {
  themeColor: "#1B4965",
  width: "device-width",
  initialScale: 1,
};

import { PWARegister } from "@/components/PWARegister";
import { OfflineIndicator } from "@/components/dashboard/OfflineIndicator";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PWARegister />
        <OfflineIndicator />
        {children}
      </body>
    </html>
  );
}