import type { Metadata, Viewport } from "next";
import { Sora, Nunito_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "TableTalk — AI Virtual Waiter",
    template: "%s | TableTalk",
  },
  description:
    "TableTalk gives restaurants an AI-powered virtual waiter that chats with diners, takes orders, answers questions, and handles allergens — all via a QR code scan.",
  keywords: ["AI waiter", "restaurant technology", "QR menu", "virtual waiter", "food ordering"],
  authors: [{ name: "TableTalk" }],
  creator: "TableTalk",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "TableTalk",
    title: "TableTalk — AI Virtual Waiter",
    description: "AI-powered virtual waiters for modern restaurants.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${nunitoSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
