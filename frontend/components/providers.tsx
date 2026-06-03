"use client";

import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AppProvider>
    </ThemeProvider>
  );
}
