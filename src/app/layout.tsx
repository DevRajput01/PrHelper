import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PrHelper | 3D AI Marketing Studio",
  description:
    "Generate structured Instagram Reel scripts, YouTube Shorts breakdowns, and studio image prompts with 3D Sky Blue Claymorphism.",
  icons: {
    icon: "/favicon.png?v=3",
    shortcut: "/favicon.png?v=3",
    apple: "/favicon.png?v=3",
  },
  openGraph: {
    title: "PrHelper | 3D AI Marketing Studio",
    description: "Generate ready-to-use marketing scripts, reels, shorts & studio images in 1 click.",
    url: siteUrl,
    siteName: "PrHelper",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PrHelper 3D Marketing Studio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrHelper | 3D AI Marketing Studio",
    description: "Generate ready-to-use marketing scripts, reels, shorts & studio images in 1 click.",
    images: ["/og-image.png"],
  },
  keywords: [
    "PrHelper",
    "AI marketing",
    "3D Claymorphism",
    "Reels generator",
    "Shorts script generator",
    "pgvector RAG",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png?v=3" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png?v=3" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png?v=3" />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-sky-500 selection:text-white relative">
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            {/* Background 3D Caustic Glow Elements */}
            <div className="fixed top-[-80px] left-[10%] w-[500px] h-[350px] bg-sky-300/30 rounded-full blur-[90px] pointer-events-none -z-10" />
            <div className="fixed top-[20%] right-[-50px] w-[550px] h-[400px] bg-orange-300/25 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="fixed bottom-[-100px] left-1/3 w-[600px] h-[450px] bg-emerald-300/25 rounded-full blur-[110px] pointer-events-none -z-10" />
            
            <Navbar />
            <main className="flex-1 pb-16">{children}</main>

            <footer className="py-8 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">PrHelper</span>
                  <span>— 3D AI Marketing Studio Platform</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <span>NeonDB pgvector & Gemini</span>
                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                  <span>100% Free Toolchain</span>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
