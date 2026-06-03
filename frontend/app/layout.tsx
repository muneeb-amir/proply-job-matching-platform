import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Proply — Match smarter. Pitch faster.",
  description:
    "AI matches your skills to live freelance gigs and writes your winning proposal — in under 3 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable)} suppressHydrationWarning>
      <body className={cn("min-h-screen font-sans antialiased", inter.className)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
