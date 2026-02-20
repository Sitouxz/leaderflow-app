import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "CyborgFlow Capture Dashboard",
  description: "Hybrid AI + Human workflow for thought leadership content",
};

import { ToastProvider } from "@/context/ToastContext";
import { PipelineProvider } from "@/context/PipelineContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} font-display bg-background-dark h-full w-full overflow-hidden flex flex-col antialiased`}
      >
        <ToastProvider>
          <PipelineProvider>
            {children}
          </PipelineProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
