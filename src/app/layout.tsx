import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ServeMyTable — TAP . ORDER . ENJOY",
    template: "%s | ServeMyTable",
  },
  description:
    "ServeMyTable gives restaurants an AI-powered virtual waiter that chats with diners, takes orders, answers questions, and handles allergens — all via a QR code scan. No app download needed.",
  keywords: ["AI waiter", "restaurant technology", "QR menu", "virtual waiter", "food ordering", "ServeMyTable"],
  authors: [{ name: "ServeMyTable" }],
  creator: "LeadJar Agency",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "ServeMyTable",
    title: "ServeMyTable — TAP . ORDER . ENJOY",
    description: "AI-powered virtual waiters for restaurants. Scan. Order. Enjoy.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B2A4A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bebasNeue.variable} ${montserrat.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
