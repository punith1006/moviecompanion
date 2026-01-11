import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// PRD Typography - Inter for body, Plus Jakarta Sans for headings
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ReelMind - Your Entertainment Memory",
  description: "An AI-powered entertainment companion that remembers everything you watch, generates personalized recaps, and keeps you engaged with interactive trivia.",
  keywords: ["entertainment", "movies", "series", "tracking", "AI", "recommendations", "recaps"],
  authors: [{ name: "ReelMind" }],
  openGraph: {
    title: "ReelMind - Your Entertainment Memory",
    description: "AI-powered companion for movie and series lovers",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${plusJakarta.variable} antialiased min-h-screen bg-background`}
      >
        {children}
      </body>
    </html>
  );
}
