// src/app/layout.tsx
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Futuretek Institute Of Astrological Sciences",
  description: "Expert-led courses in KP Astrology, Financial Astrology, Vastu Shastra, and Astro-Vastu.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("flex min-h-svh flex-col antialiased", inter.className)}>
        <SessionProvider 
          session={session}
          refetchInterval={5 * 60} // Refetch every 5 minutes
          refetchOnWindowFocus={true}
        >
          <Providers>
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}