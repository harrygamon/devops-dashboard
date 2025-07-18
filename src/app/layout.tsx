import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow mb-6">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-6">
            <Link href="/dashboard" className="font-semibold text-gray-700 hover:text-blue-600">Dashboard</Link>
            <Link href="/ai-assistant" className="font-semibold text-gray-700 hover:text-blue-600">AI Assistant</Link>
            <Link href="/logs" className="font-semibold text-gray-700 hover:text-blue-600">Logs</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
