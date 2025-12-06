// src/app/layout.tsx
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
// import { SiteFooter } from "@/components/site-footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Edutech",
  description: "Learning Management System",
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
            {/* <SiteFooter/> */}
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}