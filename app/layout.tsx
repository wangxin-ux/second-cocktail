import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import LanguageProvider from "./language-provider";
import TonightAgeGuard from "./tonight-age-guard";
import AgentAssistant from "./agent-assistant";
import { headers } from "next/headers";
import { resolveVenueIdFromHost } from "@/server/realtime/venue";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xinxinyuntu.top"),
  title: { default: "second", template: "%s — second" },
  description: "A drink shaped around your night — and, only if you choose, a reason to meet someone.",
  applicationName: "second",
  icons: { icon: [{ url: "/second-mark.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }], apple: "/second-mark.svg" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "second",
    title: "second — a drink, then a connection",
    description: "A personal cocktail. An optional introduction. One night at a time.",
  },
  twitter: { card: "summary", title: "second — a drink, then a connection", description: "A personal cocktail. An optional introduction." },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const venueId = resolveVenueIdFromHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}><LanguageProvider><TonightAgeGuard>{children}</TonightAgeGuard>{venueId === "agent" ? <AgentAssistant /> : null}</LanguageProvider></body>
    </html>
  );
}
