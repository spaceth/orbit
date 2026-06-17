import type { Metadata } from "next";

import { GoogleAnalytics } from "@/components/google-analytics";
import { ThemeColorMeta } from "@/components/theme-color-meta";
import { ThemeProvider } from "@/components/theme-provider";
import { themeInitScript } from "@/lib/theme-init-script";

import "./globals.css";

const OG_IMAGE = "https://spaceth.co/wp-content/uploads/2026/06/tracking-og.jpg";

export const metadata: Metadata = {
  title: "Spaceth Orbit — Visualizing Thailand's Satellites",
  description:
    "An interactive look at Thailand's satellites in orbit, from their paths above Earth to the missions that put the country on the space map.",
  openGraph: {
    title: "Spaceth Orbit — Visualizing Thailand's Satellites",
    description:
      "An interactive look at Thailand's satellites in orbit, from their paths above Earth to the missions that put the country on the space map.",
    images: [
      {
        url: OG_IMAGE,
        alt: "Spaceth Orbit — Visualizing Thailand's Satellites",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spaceth Orbit — Visualizing Thailand's Satellites",
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
