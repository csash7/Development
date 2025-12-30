import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BhumiSetu - Indian Land Records Portal",
  description: "Access land records across Indian states. Search survey records, pattadar passbooks, encumbrance certificates, and more. Currently supporting Telangana.",
  keywords: ["India", "land records", "Telangana", "BhuBharati", "survey", "pattadar", "EC", "encumbrance certificate", "భూమి రికార్డులు", "भूमिसेतु"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-white min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
