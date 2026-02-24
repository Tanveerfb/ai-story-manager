import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "AI-First Authoring Suite",
  description:
    "Create stories from scratch with AI assistance - interactive narrative creation and entity management",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Navigation>{children}</Navigation>
        </ThemeProvider>
      </body>
    </html>
  );
}
