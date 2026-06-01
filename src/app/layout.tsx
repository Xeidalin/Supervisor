import type { Metadata } from "next";
import { ConvexClientProvider } from "@/lib/convex";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supervisor de consumo — Control de APIs IA",
  description: "Supervisa el gasto de tus API keys de IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
