import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { themeInitScript } from "@/lib/theme-init-script";

import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit — Thailand Satellite Tracker",
  description:
    "Minimal 3D orbit visualization for Thailand spacecraft using live TLE data and SGP4 propagation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="stylesheet" href="https://use.typekit.net/ayj4ilb.css" />
      </head>
      <body className="h-full overflow-hidden font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
