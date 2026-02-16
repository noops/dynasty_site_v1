import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Dynasty Dashboard | Sleeper League",
  description: "Advanced analytics and history for your Sleeper Dynasty League",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased overflow-x-hidden`}>
        <div className="flex min-h-screen w-full bg-background relative">
          <Sidebar />
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-20 lg:py-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
            <Analytics />
          </main>
        </div>
      </body>
    </html>
  );
}
