import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090A0F",
};

export const metadata: Metadata = {
  title: "vVideosdownloaderPro v2 - Suite Multimedia Profesional",
  description: "Desarrollado por Eduardo Andrada / Catamarca / FastAPI, yt-dlp, FFmpeg & Next.js. Descarga y transcodifica videos 4K, audios en 320kbps y elimina marcas de agua.",
  authors: [{ name: "Eduardo Andrada (Catamarca)", url: "https://github.com/eduandrada/vVideosdownloaderPro" }],
  keywords: [
    "vVideosdownloaderPro",
    "Eduardo Andrada",
    "Catamarca",
    "video downloader",
    "youtube 4k",
    "instagram reels",
    "tiktok sin marca de agua",
    "ffmpeg converter",
    "audio 320k"
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "vVideosdownloaderPro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#090A0F] text-gray-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
