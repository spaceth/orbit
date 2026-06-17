import type { Metadata, Viewport } from "next";

import { GoogleAnalytics } from "@/components/google-analytics";
import { ThemeColorMeta } from "@/components/theme-color-meta";
import { ThemeProvider } from "@/components/theme-provider";
import { themeInitScript } from "@/lib/theme-init-script";

import "./globals.css";

const OG_IMAGE = "https://spaceth.co/wp-content/uploads/2026/06/new-orbit-og.jpg";
const OG_TITLE = "Thailand in Orbit";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: "Spaceth Orbit — Visualizing Thailand's Satellites",
  description:
    "An interactive look at Thailand's satellites in orbit, from their paths above Earth to the missions that put the country on the space map.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/favicon.png",
    apple: [{ url: "/favicon.png", type: "image/png", sizes: "512x512" }],
  },
  openGraph: {
    title: OG_TITLE,
    description:
      "An interactive look at Thailand's satellites in orbit, from their paths above Earth to the missions that put the country on the space map.",
    images: [
      {
        url: OG_IMAGE,
        alt: OG_TITLE,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description:
      "An interactive look at Thailand's satellites in orbit, from their paths above Earth to the missions that put the country on the space map.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="stylesheet" href="https://use.typekit.net/ayj4ilb.css" />
      </head>
      <body className="h-full overflow-hidden font-sans">
        <GoogleAnalytics />
        <ThemeProvider>
          <ThemeColorMeta />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
