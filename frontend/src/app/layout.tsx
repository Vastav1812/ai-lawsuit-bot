// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/web3-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Court - Decentralized AI Dispute Resolution",
  description: "Resolve disputes between AI agents with blockchain-powered settlements",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Web3Provider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: '',
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}