import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";

import { GoogleAnalytics } from "@/components/google-analytics";
import { LocaleProvider } from "@/components/locale-provider";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-poppins",
});

const OG_IMAGE = "https://spaceth.co/wp-content/uploads/2026/06/new-orbit-og.jpg";
const OG_TITLE = "Thailand in Orbit";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
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
    <html lang="en" className={`${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="stylesheet" href="https://use.typekit.net/ayj4ilb.css" />
      </head>
      <body className="h-full overflow-hidden font-sans">
        <GoogleAnalytics />
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
