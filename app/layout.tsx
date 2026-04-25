import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Feeder",
  description: "Pemantauan kualitas air real-time berbasis IoT.",
  manifest: "/manifest.json",

  openGraph: {
    title: "Smart Feeder",
    description: "Pemantauan kualitas air real-time berbasis IoT.",
    url: "https://smartfeeder.my.id",
    siteName: "Smart Feeder",
    images: [
      {
        url: "https://smartfeeder.my.id/1.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Smart Feeder",
    description: "Pemantauan kualitas air real-time berbasis IoT.",
    images: ["https://smartfeeder.my.id/1.png"],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Feeder",
  },
};

export const viewport = {
  themeColor: "#1B4965",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}