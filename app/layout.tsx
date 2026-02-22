"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import Image from "next/image"; // <-- Importação do Next.js
import "./globals.css";
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  Github,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus,
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

const PROJECTS = [
  {
    id: 1,
    name: "Nexus Dev",
    code: "DN",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: 2,
    name: "Marketing Hub",
    code: "MH",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: 3,
    name: "Mobile App",
    code: "MA",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(PROJECTS[0]);

  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.className} bg-[#09090B] text-[#FAFAFA] h-screen overflow-hidden flex`}
      >
        <aside
          className={`relative z-50 bg-[#121214] border-r border-[#27272A] flex flex-col transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}
        >
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsProjectOpen(false);
              setIsAccountOpen(false);
            }}
            className="absolute -right-3 top-12 bg-[#27272A] border border-[#3F3F46] rounded-full p-1 text-zinc-400 hover:text-white z-50 shadow-lg"
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          {/* 1. Header & Logo Dinâmica */}
          <div className="p-6 h-20 flex items-center">
            <div
              className={`flex items-center w-full transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
            >
              {isCollapsed ? (
                /* MOSTRA QUANDO FECHADO (Ícone Pequeno) */
                <div className="shrink-0 flex items-center justify-center animate-in fade-in duration-300">
                  <Image
                    src="/Nexo_small_icon.png" // <-- Seu ícone pequeno sem espaços
                    alt="Nexo Icon"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                    priority
                  />
                </div>
              ) : (
                /* MOSTRA QUANDO ABERTO (Logo Grande) */
                <div className="shrink-0 flex items-center animate-in fade-in duration-300">
                  <Image
                    src="/Nexo_icon.png" // <-- Sua logo completa sem espaços
                    alt="Nexo Logo Completa"
                    width={320} // Ajuste essa largura baseada no tamanho real da sua imagem
                    height={64}
                    className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                    priority
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Project Switcher */}
          <div className="px-4 mb-6 relative">
            <button
              onClick={() => {
                setIsProjectOpen(!isProjectOpen);
                setIsAccountOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all
                ${isProjectOpen ? "bg-[#1A1A1E] border-indigo-500/50" : "hover:bg-[#1A1A1E] border-transparent hover:border-[#27272A]"}
                ${isCollapsed ? "justify-center border-transparent p-0" : ""}
              `}
            >
              <div
                className={`w-8 h-8 ${activeProject.bg} ${activeProject.color} rounded flex items-center justify-center text-[11px] font-bold shrink-0 border border-current/20`}
              >
                {activeProject.code}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight leading-none">
                      Projeto Atual
                    </p>
                    <p className="text-sm font-semibold truncate text-zinc-200 mt-1">
                      {activeProject.name}
                    </p>
                  </div>
                  <ChevronsUpDown size={14} className="text-zinc-500" />
                </>
              )}
            </button>

            {/* Dropdown de Projetos - Flyout inteligente */}
            {isProjectOpen && (
              <div
                className={`absolute z-[80] bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200
                ${isCollapsed ? "left-full ml-4 top-0 w-56" : "left-4 right-4 top-full mt-2"}
              `}
              >
                <div className="p-2 border-b border-[#27272A] bg-[#0D0D0F]/50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-1">
                    Trocar Projeto
                  </p>
                </div>
                <div className="p-1">
                  {PROJECTS.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj);
                        setIsProjectOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-[#1A1A1E] rounded-lg transition-colors group"
                    >
                      <div
                        className={`w-7 h-7 ${proj.bg} ${proj.color} rounded flex items-center justify-center text-[10px] font-bold`}
                      >
                        {proj.code}
                      </div>
                      <span
                        className={`flex-1 text-sm text-left ${activeProject.id === proj.id ? "text-white font-medium" : "text-zinc-400"}`}
                      >
                        {proj.name}
                      </span>
                      {activeProject.id === proj.id && (
                        <Check size={14} className="text-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
                <button className="w-full flex items-center gap-2 p-3 text-[11px] font-medium text-zinc-500 hover:text-white border-t border-[#27272A] hover:bg-[#1A1A1E] transition-all">
                  <Plus size={14} /> Novo Projeto
                </button>
              </div>
            )}
          </div>

          {/* 3. Navegação Principal */}
          <div className="flex-1 px-3 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div>
              {!isCollapsed && (
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">
                  Workspace
                </h3>
              )}
              <nav className="space-y-1">
                <NavItem
                  icon={<LayoutDashboard size={20} />}
                  label="Visão Geral"
                  active
                  collapsed={isCollapsed}
                />
                <NavItem
                  icon={<ListTodo size={20} />}
                  label="Backlog"
                  collapsed={isCollapsed}
                />
                <NavItem
                  icon={<Kanban size={20} />}
                  label="Quadros"
                  collapsed={isCollapsed}
                />
                <NavItem
                  icon={<CheckSquare size={20} />}
                  label="Minhas Tarefas"
                  badge="8"
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
                  icon={<Github size={20} />}
                  label="Repositórios"
                  collapsed={isCollapsed}
                />
                <NavItem
                  icon={<Sliders size={20} />}
                  label="Configurações"
                  collapsed={isCollapsed}
                />
              </nav>
            </div>
          </div>

          {/* 4. Footer & Account Switcher */}
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
                  src="https://i.pravatar.cc/150?img=12"
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-[#3F3F46] object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#121214] rounded-full"></div>
              </div>

              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate leading-none">
                      Alex Dev
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

            {/* Dropdown da Conta - Flyout inteligente */}
            {isAccountOpen && (
              <div
                className={`absolute z-[80] bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200
                ${isCollapsed ? "left-full ml-4 bottom-0 w-56" : "left-4 right-4 bottom-full mb-2"}
              `}
              >
                <div className="p-3 border-b border-[#27272A] bg-[#0D0D0F]/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-xs font-bold">
                    AD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">
                      Alex Dev
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      alex@nexo.ai
                    </p>
                  </div>
                </div>

                <div className="p-1.5">
                  <AccountMenuItem
                    icon={<User size={14} />}
                    label="Meu Perfil"
                  />
                  <AccountMenuItem
                    icon={<Shield size={14} />}
                    label="Segurança"
                  />
                  <AccountMenuItem
                    icon={<CreditCard size={14} />}
                    label="Assinatura"
                  />
                  <AccountMenuItem
                    icon={<Bell size={14} />}
                    label="Notificações"
                  />
                </div>

                <div className="p-1.5 border-t border-[#27272A] bg-[#1A1A1E]/30">
                  <button className="w-full flex items-center gap-2.5 p-2 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                    <LogOut size={14} />
                    Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 relative bg-[#09090B] overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

function AccountMenuItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="w-full flex items-center gap-2.5 p-2 rounded-md text-xs font-medium text-zinc-400 hover:bg-[#1A1A1E] hover:text-white transition-all">
      <span className="text-zinc-500">{icon}</span>
      {label}
    </button>
  );
}

function NavItem({ icon, label, active = false, badge, collapsed }: any) {
  return (
    <a
      href="#"
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
      {collapsed && (
        <div className="absolute left-16 bg-[#18181B] border border-[#27272A] text-white text-[10px] px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
          {label}
        </div>
      )}
      {active && !collapsed && (
        <div className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
      )}
    </a>
  );
}
