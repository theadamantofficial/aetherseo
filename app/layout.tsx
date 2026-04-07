import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aether AI | AI SEO Automation Dashboard",
    template: "%s | Aether AI",
  },
  description:
    "Aether AI helps you manage AI content, SEO audits, multilingual blog experiences, historical performance, and workspace analytics from one place.",
  applicationName: "Aether AI",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Aether AI | AI SEO Automation Dashboard",
    description:
      "Aether AI helps you manage AI content, SEO audits, multilingual blog experiences, historical performance, and workspace analytics from one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aether AI | AI SEO Automation Dashboard",
    description:
      "Aether AI helps you manage AI content, SEO audits, multilingual blog experiences, historical performance, and workspace analytics from one place.",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
