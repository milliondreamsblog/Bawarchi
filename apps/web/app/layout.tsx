import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import RootLayoutClient from "@/components/RootLayoutClient";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { THEME_INIT_SCRIPT } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bawarchie",
  description: "Scan, order, and pay — all from your table!",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bawarchie",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Sets html.dark / html.light before paint to prevent FOUC.
          // Only affects the landing surface via ThemeProvider wiring downstream.
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ServiceWorkerRegistration />
          <RootLayoutClient>{children}</RootLayoutClient>
        </SessionProvider>
      </body>
    </html>
  );
}

