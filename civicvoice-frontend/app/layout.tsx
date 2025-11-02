import type { Metadata, Viewport } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import type { ReactNode } from "react";

import { ThemeStyles } from "@/components/ThemeStyles";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--cv-font-sans-family" });
const sourceCode = Source_Code_Pro({ subsets: ["latin"], display: "swap", variable: "--cv-font-mono-family" });

export const metadata: Metadata = {
  title: "CivicVoice — Encrypted Civic Feedback",
  description:
    "CivicVoice enables privacy-preserving municipal satisfaction scoring using FHEVM aggregation.",
  applicationName: "CivicVoice",
  generator: "Next.js",
  keywords: ["FHE", "Civic Feedback", "Zama", "FHEVM", "Privacy"],
};

export const viewport: Viewport = {
  themeColor: "#146C7E",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceCode.variable}`} suppressHydrationWarning>
      <body>
        <ThemeStyles />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

