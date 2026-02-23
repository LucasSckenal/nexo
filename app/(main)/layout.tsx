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
  CheckSquare,
  Github,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  User,
  LogOut,
  CreditCard,
  Bell,
  Shield,
  Sliders,
  ListTodo,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Adicionado suppressHydrationWarning para evitar erros silenciosos no HTML
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      {/* Retirado o h-screen e flex diretamente do body */}
      <body
        className={`${inter.className} bg-[#09090B] text-[#FAFAFA] antialiased`}
      >
        <DataProvider>
          {/* Este é o Contentor Mestre que garante que o Layout não quebra */}
          <div className="flex w-full h-screen overflow-hidden">
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
        // Adicionado shrink-0 e h-full para a sidebar nunca ser esmagada
        className={`relative z-50 shrink-0 h-full bg-[#121214] border-r border-[#27272A] flex flex-col transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}
      >
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            setIsProjectOpen(false);
            setIsAccountOpen(false);
          }}
          className="absolute -right-3 top-12 bg-[#27272A] border border-[#3F3F46] rounded-full p-1 text-zinc-400 hover:text-white z-50 shadow-lg"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-6 h-20 flex items-center">
          <div
            className={`flex items-center w-full transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
          >
            {isCollapsed ? (
              <Image
                src="/Nexo_small_icon.png"
                alt="Icon"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <Image
                src="/Nexo_icon.png"
                alt="Logo"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            )}
          </div>
        </div>

        <div className="px-4 mb-6 relative">
          <button
            onClick={() => {
              setIsProjectOpen(!isProjectOpen);
              setIsAccountOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${isProjectOpen ? "bg-[#1A1A1E] border-indigo-500/50" : "hover:bg-[#1A1A1E] border-transparent hover:border-[#27272A]"} ${isCollapsed ? "justify-center p-1" : ""}`}
          >
            <div className="w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold shrink-0 border border-white/10 bg-zinc-800 overflow-hidden">
              {activeProject?.imageUrl ? (
                <img
                  src={activeProject.imageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span style={{ color: activeProject?.color || "#6366f1" }}>
                  {activeProject?.key || "NX"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                    Projeto Atual
                  </p>
                  <p className="text-sm font-semibold truncate text-zinc-200">
                    {activeProject?.name || "Selecionar..."}
                  </p>
                </div>
                <ChevronsUpDown size={14} className="text-zinc-500" />
              </>
            )}
          </button>

          {isProjectOpen && (
            <div
              className={`absolute z-[80] bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isCollapsed ? "left-full ml-4 top-0 w-56" : "left-4 right-4 top-full mt-2"}`}
            >
              <div className="p-2 border-b border-[#27272A] bg-[#0D0D0F]/50">
                <p className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-1">
                  Trocar Projeto
                </p>
              </div>
              <div className="p-1 max-h-60 overflow-y-auto">
                {projects.map((proj: any) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setActiveProject(proj);
                      setIsProjectOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-[#1A1A1E] rounded-lg transition-colors group"
                  >
                    <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold bg-zinc-900 border border-white/5 overflow-hidden">
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
                      className={`flex-1 text-sm text-left ${activeProject?.id === proj.id ? "text-white font-medium" : "text-zinc-400 group-hover:text-zinc-200"}`}
                    >
                      {proj.name}
                    </span>
                    {activeProject?.id === proj.id && (
                      <Check size={14} className="text-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">
                Workspace
              </h3>
            )}
            <nav className="space-y-1">
              <NavItem
                href="/"
                icon={<LayoutDashboard size={20} />}
                label="Visão Geral"
                active={pathname === "/"}
                collapsed={isCollapsed}
              />
              <NavItem
                href="/backlog"
                icon={<ListTodo size={20} />}
                label="Backlog"
                active={pathname === "/backlog"}
                collapsed={isCollapsed}
              />
              <NavItem
                href="/quadros"
                icon={<Kanban size={20} />}
                label="Quadros"
                active={pathname === "/quadros"}
                collapsed={isCollapsed}
              />
              <NavItem
                href="/tarefas"
                icon={<CheckSquare size={20} />}
                label="Minhas Tarefas"
                active={pathname === "/tarefas"}
                collapsed={isCollapsed}
              />
            </nav>
          </div>
          <div>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">
                Sistema
              </h3>
            )}
            <nav className="space-y-1">
              <NavItem
                href="/configuracoes"
                icon={<Sliders size={20} />}
                label="Configurações"
                active={pathname === "/configuracoes"}
                collapsed={isCollapsed}
              />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#27272A] relative">
          <button
            onClick={() => {
              setIsAccountOpen(!isAccountOpen);
              setIsProjectOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#1A1A1E] transition-all group ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="relative shrink-0">
              <img
                src={user?.photoURL || "https://i.pravatar.cc/150?img=12"}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-[#3F3F46] object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#121214] rounded-full"></div>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate leading-none">
                    {user?.displayName || "Alex Dev"}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate mt-1">
                    Plano Enterprise
                  </p>
                </div>
                <Settings
                  size={14}
                  className={`text-zinc-500 transition-transform duration-500 ${isAccountOpen ? "rotate-180 text-indigo-500" : ""}`}
                />
              </>
            )}
          </button>

          {isAccountOpen && (
            <div
              className={`absolute z-[80] bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 ${isCollapsed ? "left-full ml-4 bottom-0 w-56" : "left-4 right-4 bottom-full mb-2"}`}
            >
              <div className="p-1.5 border-t border-[#27272A] bg-[#1A1A1E]/30">
                <button
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-2.5 p-2 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut size={14} /> Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Adicionado h-full e flex flex-col para o conteúdo interno preencher corretamente e não ser empurrado para baixo */}
      <main className="flex-1 h-full bg-[#09090B] overflow-y-auto flex flex-col relative">
        {children}
      </main>
    </>
  );
}

function AccountMenuItem({
  icon,
  label,
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="w-full flex items-center gap-2.5 p-2 rounded-md text-xs font-medium text-zinc-400 hover:bg-[#1A1A1E] hover:text-white transition-all"
    >
      <span className="text-zinc-500">{icon}</span>
      {label}
    </Link>
  );
}

function NavItem({
  icon,
  label,
  href = "#",
  active = false,
  badge,
  collapsed,
}: any) {
  return (
    <Link
      href={href}
      className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-[#1A1A1E]"} ${collapsed ? "justify-center" : ""}`}
    >
      <div
        className={`${active ? "text-indigo-500" : "text-zinc-500 group-hover:text-zinc-300"} shrink-0`}
      >
        {icon}
      </div>
      {!collapsed && (
        <>
          <span className="flex-1 font-medium">{label}</span>
          {badge && (
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-md text-zinc-400 border border-zinc-700">
              {badge}
            </span>
          )}
        </>
      )}
      {active && !collapsed && (
        <div className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
      )}
    </Link>
  );
}
