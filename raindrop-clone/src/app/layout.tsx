import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raindrop Clone - Bookmark Manager",
  description: "An all-in-one bookmark manager inspired by Raindrop.io",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
