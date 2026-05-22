import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://fluxarc.com'),
  title: "FluxArc",
  description: "Autonomous AI Agent Marketplace powered by Arc Network",
  icons: {
    icon: '/fluxarc.jpg',
    shortcut: '/fluxarc.jpg',
    apple: '/fluxarc.jpg',
  },
  openGraph: {
    title: "FluxArc | Autonomous AI Agent Marketplace",
    description: "Discover and deploy native AI agents on the Arc L1 network. Secure, trustless, and efficient.",
    url: "https://fluxarc.com",
    siteName: "FluxArc",
    images: [
      {
        url: "/fluxarc.jpg",
        width: 1200,
        height: 630,
        alt: "FluxArc Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FluxArc",
    description: "Autonomous AI Agent Marketplace powered by Arc Network",
    images: ["/fluxarc.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}