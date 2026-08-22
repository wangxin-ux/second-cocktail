import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import LanguageProvider from "./language-provider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "second — a drink, then a connection",
  description: "A personal cocktail and the person you should meet tonight.",
};

export const viewport: Viewport = {
  themeColor: "#090909",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
