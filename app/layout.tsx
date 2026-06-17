import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthGate } from "@/components/auth/AuthGate";
import { Navbar } from "@/components/layout/Navbar";
import { QueueProcessor } from "@/components/queue/QueueProcessor";
import { QueueStatusBar } from "@/components/queue/QueueStatusBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Story Manager",
  description: "Local-first, AI-assisted story management. The author owns every word.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthGate>
          <Navbar />
          {children}
        </AuthGate>
        <QueueProcessor />
        <QueueStatusBar />
      </body>
    </html>
  );
}
