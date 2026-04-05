import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fat FIRE City Calculator",
  description:
    "Estimate the portfolio size needed to retire in major global cities at a Fat FIRE lifestyle as a US tax resident.",
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
      <body className="min-h-full">
        <div className="min-h-screen">
          <header className="border-b border-black/10 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Fat FIRE City Calculator
              </Link>
              <nav className="flex items-center gap-4 text-sm text-neutral-600">
                <Link href="/" className="transition hover:text-neutral-950">
                  Cities
                </Link>
                <Link href="/compare" className="transition hover:text-neutral-950">
                  Compare
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
          <footer className="mx-auto max-w-7xl px-6 py-10 text-sm text-neutral-600">
            Educational only. Not financial, legal, or tax advice. Every city uses curated source data and a US-resident tax model.
          </footer>
        </div>
      </body>
    </html>
  );
}
