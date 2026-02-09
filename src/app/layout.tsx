"use client";

import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CommandPalette } from "@/components/command-palette";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0a0a0a] text-white selection:bg-blue-500/30 selection:text-blue-200`}>
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
