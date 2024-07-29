import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "kisuyo",
  description:
    "A skilled front-end developer specializing in React, SolidJS, and Framer Motion.",
  keywords: [
    "front-end developer",
    "React",
    "SolidJS",
    "Framer Motion",
    "web development",
    "portfolio",
  ],
  authors: [{ name: "Kisuyo", url: "https://kisuyo.com" }],
  openGraph: {
    title: "kisuyo",
    description: "Showcasing expertise in React, SolidJS, and Framer Motion.",
    type: "website",
    url: "https://kisuyo.com",
  },
  twitter: {
    card: "summary_large_image",
    site: "@KisuyoTT",
    creator: "@KisuyoTT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
