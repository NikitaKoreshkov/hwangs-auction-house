import type { Metadata } from "next";
import { Playfair_Display, Open_Sans } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "./components/ConditionalHeader";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "500", "700"], // Regular, Medium, Bold (300 Light not available)
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600"], // Regular, Semibold
});

export const metadata: Metadata = {
  title: "Hwang's аукционный дом",
  description: "Первый в России аукционный дом по продаже предметов роскоши и эксклюзивных активов",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${playfairDisplay.variable} ${openSans.variable} antialiased`}
      >
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
