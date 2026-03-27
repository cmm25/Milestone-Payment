import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import { ToastProvider } from "@/lib/toast";
import Navigation from "@/components/Navigation";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FreelanceEscrow",
  description: "Milestone-based payment escrow on Rootstock.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen bg-[#fafafa]">
        <WalletProvider>
          <ToastProvider>
            <Navigation />
            <main className="pt-16">{children}</main>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
