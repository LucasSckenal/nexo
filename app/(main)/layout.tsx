"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataProvider, useData } from "../context/DataContext";
import { auth } from "../lib/firebase";
import "../globals.css";
import {
  LayoutDashboard,
  Kanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  LogOut,
  Sliders,
  ListTodo,
  Activity,
  Search,
  User, // <-- Importamos o ícone de Usuário
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-[#000000] text-[#FAFAFA] antialiased`}
      >
        <DataProvider>
          <div className="flex w-full h-screen overflow-hidden p-3 gap-3">
            <LayoutContent>{children}</LayoutContent>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { projects, activeProject, setActiveProject } = useData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const pathname = usePathname();
  const user = auth.currentUser;

  return (
    <>
      <aside
        className={`relative z-50 shrink-0 h-full flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* LOGO */}
        <div className="px-4 h-20 flex items-center">
          <div
            className={`flex items-center w-full transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
          >
            <Image
              src={isCollapsed ? "/Nexo_small_icon.png" : "/Nexo_icon.png"}
              alt="Logo"
              width={isCollapsed ? 28 : 100}
              height={32}
              className="object-contain opacity-90"
            />
          </div>
        </div>

        {/* BOTÃO NO MEIO DA BORDA (TOGGLE) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-6.5 top-10 z-[100] bg-[#0A0A0A] border border-white/10 rounded-full p-1.5 text-zinc-500 hover:text-purple-400 hover:border-purple-500/50 transition-all shadow-xl backdrop-blur-md group"
        >
          {isCollapsed ? (
            <ChevronRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          ) : (
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          )}
        </button>

        {/* SELETOR DE PROJETO */}
        <div className="px-3 mb-4 relative">
          <button
            onClick={() => {
              setIsProjectOpen(!isProjectOpen);
              setIsAccountOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/[0.06] transition-all border border-white/5 ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 overflow-hidden">
              {activeProject?.imageUrl ? (
                <img
                  src={activeProject.imageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-purple-400">
                  {activeProject?.key || "NX"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[13px] font-medium text-zinc-200 truncate leading-none">
                    {activeProject?.name || "Projeto"}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1.5 leading-none">
                    Enterprise
                  </p>
                </div>
                <ChevronsUpDown size={14} className="text-zinc-600 shrink-0" />
              </>
            )}
          </button>

          {/* DROP PROJETOS COM FOTO */}
          <AnimatePresence>
            {isProjectOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute z-[110] bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl p-2 ${isCollapsed ? "left-full ml-4 top-0 w-64" : "left-0 right-0 top-full mt-2"}`}
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                  {projects.map((proj: any) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj);
                        setIsProjectOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white/[0.06] rounded-xl transition-all group"
                    >
                      <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 border border-white/5 bg-white/5 flex items-center justify-center text-[9px]">
                        {proj.imageUrl ? (
                          <img
                            src={proj.imageUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span style={{ color: proj.color }}>{proj.key}</span>
                        )}
                      </div>
                      <span
                        className={`flex-1 text-[13px] text-left truncate ${activeProject?.id === proj.id ? "text-purple-400 font-medium" : "text-zinc-400 group-hover:text-zinc-200"}`}
                      >
                        {proj.name}
                      </span>
                      {activeProject?.id === proj.id && (
                        <Check size={14} className="text-purple-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BUSCA */}
        {!isCollapsed && (
          <div className="px-3 mb-6">
            <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-zinc-500 hover:bg-white/[0.04] transition-all text-[12px] group">
              <Search size={14} className="group-hover:text-zinc-300" />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="text-[9px] font-mono bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/5">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* NAVEGAÇÃO PRINCIPAL */}
        <div className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1">
            <NavItem
              href="/"
              icon={<LayoutDashboard size={18} />}
              label="Visão Geral"
              active={pathname === "/"}
              collapsed={isCollapsed}
            />
            <NavItem
              href="/backlog"
              icon={<ListTodo size={18} />}
              label="Backlog"
              active={pathname === "/backlog"}
              collapsed={isCollapsed}
            />
            <NavItem
              href="/quadros"
              icon={<Kanban size={18} />}
              label="Kanban"
              active={pathname === "/quadros"}
              collapsed={isCollapsed}
            />
            <NavItem
              href="/analises"
              icon={<Activity size={18} />}
              label="Análises"
              active={pathname === "/analises"}
              collapsed={isCollapsed}
            />
          </nav>

          {/* SESSÃO ADMINISTRAÇÃO E PERFIL */}
          <div>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-zinc-700 px-4 mb-2 tracking-[0.2em] uppercase">
                Administração
              </h3>
            )}
            <nav className="space-y-1">
              <NavItem
                href="/configuracoes"
                icon={<Settings size={18} />}
                label="Ajustes do Projeto"
                active={pathname === "/configuracoes"}
                collapsed={isCollapsed}
              />
              <NavItem
                href="/perfil"
                icon={<User size={18} />}
                label="Meu Perfil"
                active={pathname === "/perfil"}
                collapsed={isCollapsed}
              />
            </nav>
          </div>
        </div>

        {/* PERFIL RODAPÉ */}
        <div className="p-3 mt-auto relative">
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all group ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="relative shrink-0">
              <img
                src={user?.photoURL || "https://i.pravatar.cc/150"}
                className="w-8 h-8 rounded-full border border-white/10"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-black" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[13px] font-medium text-zinc-300 truncate w-full">
                  {user?.displayName?.split(" ")[0] || "Usuário"}
                </span>
                <span className="text-[10px] text-zinc-600 truncate w-full">
                  Plano Enterprise
                </span>
              </div>
            )}
          </button>

          {/* POP-UP DO USUÁRIO NO RODAPÉ */}
          <AnimatePresence>
            {isAccountOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute z-[100] bottom-full mb-2 bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl p-2 w-56 ${isCollapsed ? "left-full ml-4" : "left-3"}`}
              >
                <Link
                  href="/perfil"
                  onClick={() => setIsAccountOpen(false)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all mb-1"
                >
                  <User size={14} /> Acessar Perfil
                </Link>
                <button
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={14} /> Sair da conta
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 bg-[#050505] rounded-[2.5rem] border border-white/[0.05] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="h-full overflow-y-auto custom-scrollbar p-1">
          {children}
        </div>
      </main>
    </>
  );
}

function NavItem({ icon, label, href, active, collapsed }: any) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 group ${active ? "text-purple-50" : "text-zinc-500 hover:text-zinc-200"} ${collapsed ? "justify-center px-0" : ""}`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.15] via-purple-500/[0.05] to-transparent border border-purple-500/20 rounded-xl"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute inset-0 bg-purple-500/5 blur-lg rounded-xl" />
        </motion.div>
      )}

      <div
        className={`relative z-10 flex items-center gap-3 transition-all ${active ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] scale-105" : ""}`}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </div>

      {active && !collapsed && (
        <div className="absolute left-0 w-[3px] h-6 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,1)]" />
      )}
    </Link>
  );
}
