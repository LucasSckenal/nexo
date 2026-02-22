import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="pt-PT" className="dark">
      {/* O corpo é apenas um fundo escuro limpo */}
      <body
        className={`${inter.className} bg-[#09090B] text-[#FAFAFA] h-screen overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
