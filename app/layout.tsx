import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsentProvider } from "@/components/cookie-consent-provider";
import SiteMonitor from "@/components/site-monitor";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const tagline = "AI MEETS SEO";
const siteDescription =
  "Aether SEO helps you manage AI content, SEO audits, multilingual blog experiences, historical performance, and workspace analytics from one place.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `Aether SEO | ${tagline}`,
    template: "%s | Aether SEO",
  },
  description: `${siteDescription} ${tagline}.`,
  applicationName: "Aether SEO",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `Aether SEO | ${tagline}`,
    description: `${siteDescription} ${tagline}.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Aether SEO | ${tagline}`,
    description: `${siteDescription} ${tagline}.`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <CookieConsentProvider>
          <ThemeProvider>
            <SiteMonitor />
            {children}
          </ThemeProvider>
        </CookieConsentProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
