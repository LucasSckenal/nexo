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
    <html lang="pt-BR" >
      <body className={`${inter.className} h-screen overflow-hidden`}>
        <ThemeProvider>
          <GitHubProvider>{children}</GitHubProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
