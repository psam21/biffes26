import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "17th BIFFes 2026 | Bengaluru International Film Festival",
  description:
    "Explore films from the 17th Bengaluru International Film Festival - Asian Cinema, Indian Cinema, Kannada Cinema, World Cinema and more.",
  keywords: [
    "BIFFes",
    "Bengaluru Film Festival",
    "International Film Festival",
    "Indian Cinema",
    "Asian Cinema",
    "Kannada Films",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
