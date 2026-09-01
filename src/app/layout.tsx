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

export const metadata: Metadata = {
  title: "Bee-U by Bernie | Nail Technician",
  description:
    "Bee-U by Bernie – Be You. Be Beautiful. Book your nail appointment online.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  manifest: "/manifest.json",
  openGraph: {
    title: "Bee-U by Bernie | Nail Technician",
    description:
      "Bee-U by Bernie – Be You. Be Beautiful. Book your nail appointment online.",
    type: "website",
    images: ["/images/bee-u-logo.png"],
  },
  icons: {
    icon: "/images/bee-u-logo.png",
    apple: "/images/bee-u-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#c19a6b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}