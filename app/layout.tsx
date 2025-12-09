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
      <body className={inter.className}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400..700;1,400..700&family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Cormorant:ital,wght@0,300..700;1,300..700&family=Didact+Gothic&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Jura:wght@300..700&family=Manrope:wght@200..800&family=Mona+Sans:ital,wght@0,200..900;1,200..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Rubik:ital,wght@0,300..900;1,300..900&family=Russo+One&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
        {children}
      </body>
    </html>
  );
}
