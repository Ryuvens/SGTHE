import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}

