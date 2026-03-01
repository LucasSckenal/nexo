import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GitHubProvider } from "./context/GitHubContext";
import { ThemeProvider } from "./context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexo - Workspace",
  description: "Plataforma de gestão",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning evita avisos do Next.js quando o ThemeProvider injeta a classe "dark" no cliente
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-bgMain text-textPrimary h-screen overflow-hidden transition-colors duration-500`}
      >
        {/* ThemeProvider agora envolve toda a aplicação na raiz */}
        <ThemeProvider>
          <GitHubProvider>{children}</GitHubProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}