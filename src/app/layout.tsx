import type { Metadata, Viewport } from "next";
import { Bungee, DM_Sans, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

/** Headings and the wordmark. */
const bungee = Bungee({
  variable: "--font-bungee",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#003057",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${bungee.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
