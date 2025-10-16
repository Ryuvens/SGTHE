import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/lib/trpc/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SGTHE - Sistema de Gestión de Turnos y Horas Extraordinarias",
  description: "Sistema de gestión para Controladores de Tránsito Aéreo - DGAC Chile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <TRPCProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={300}>
              {children}
              <Toaster position="top-right" expand={false} richColors />
            </TooltipProvider>
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}

