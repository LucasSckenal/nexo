"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase"; // Ajuste o caminho se necessário
import { useData } from "../context/DataContext"; // Ajuste o caminho se necessário
import { CreateProjectModal } from "../components/CreateProjectModal";
import {
  Plus,
  FolderOpen,
  LayoutList,
  Target,
  CheckCircle2,
  CircleDashed,
  ArrowRightCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Bug,
  Sparkles,
  FileText,
  Clock,
  Activity,
  Zap,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!activeProject?.id) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", activeProject.id),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeProject]);

  // --- CÁLCULO DE MÉTRICAS ---
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "in-progress" || t.status === "review",
  ).length;
  const totalPoints = tasks.reduce(
    (acc, task) => acc + (Number(task.points) || 0),
    0,
  );
  const donePoints = tasks
    .filter((t) => t.status === "done")
    .reduce((acc, task) => acc + (Number(task.points) || 0), 0);

  const progressPercentage =
    totalPoints === 0 ? 0 : Math.round((donePoints / totalPoints) * 100);
  const recentTasks = tasks.slice(0, 5); // Mostra apenas as 5 mais recentes

  return (
    <main className="flex-1 flex flex-col h-full z-10 relative overflow-hidden bg-[#09090B]">
      {/* HEADER PRINCIPAL */}
      <header className="h-24 flex flex-col justify-center px-8 shrink-0 border-b border-[#27272A]/50 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              <span>
                {user?.displayName
                  ? `Olá, ${user.displayName.split(" ")[0]}`
                  : "Visão Geral"}
              </span>
              <span>/</span>
              <span className="text-indigo-400">
                {activeProject?.name || "Sem Projeto"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Dashboard do Projeto
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-[#121214] hover:bg-[#1A1A1E] border border-[#27272A] text-zinc-300 hover:text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
            >
              <FolderPlus size={16} /> Novo Projeto
            </button>
            <Link
              href="/backlog"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
            >
              <Plus strokeWidth={3} size={16} /> Nova Issue
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* SKELETON OU CONTEÚDO */}
          {isLoading ? (
            <DashboardSkeleton />
          ) : !activeProject?.id ? (
            <NoProjectState onOpenModal={() => setIsProjectModalOpen(true)} />
          ) : (
            <>
              {/* 1. CARTÕES DE MÉTRICAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total de Tarefas"
                  value={totalTasks.toString()}
                  icon={<LayoutList size={20} className="text-blue-400" />}
                  trend="+2 esta semana"
                />
                <StatCard
                  title="Em Progresso"
                  value={inProgressTasks.toString()}
                  icon={<Activity size={20} className="text-amber-400" />}
                  trend="Trabalho ativo"
                />
                <StatCard
                  title="Concluídas"
                  value={doneTasks.toString()}
                  icon={<CheckCircle2 size={20} className="text-emerald-400" />}
                  trend={`${progressPercentage}% do projeto`}
                />
                <StatCard
                  title="Story Points"
                  value={`${donePoints} / ${totalPoints}`}
                  icon={<Zap size={20} className="text-purple-400" />}
                  trend="Velocidade da equipa"
                />
              </div>

              {/* 2. BARRA DE PROGRESSO GLOBAL */}
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="flex items-end justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Progresso do Projeto
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Baseado nos Story Points das tarefas concluídas.
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-indigo-400">
                    {progressPercentage}%
                  </div>
                </div>
                <div className="w-full h-3 bg-[#09090B] rounded-full border border-[#27272A] overflow-hidden relative z-10">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* 3. GRID INFERIOR (TAREFAS RECENTES & ATIVIDADE) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de Tarefas Recentes (Ocupa 2 colunas na lg) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Clock size={18} className="text-zinc-400" /> Tarefas
                      Recentes
                    </h3>
                    <Link
                      href="/backlog"
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Ver todo o backlog &rarr;
                    </Link>
                  </div>

                  <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden divide-y divide-[#27272A]/50">
                    {recentTasks.length > 0 ? (
                      recentTasks.map((task) => (
                        <RecentTaskRow key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center justify-center">
                        <Target size={32} className="text-zinc-600 mb-3" />
                        <p className="text-zinc-400 text-sm font-medium">
                          Nenhuma tarefa criada ainda.
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                          Vá ao backlog para criar a sua primeira issue.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo Rápido (Ocupa 1 coluna) */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-zinc-400" /> Detalhes do
                    Projeto
                  </h3>
                  <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-[#27272A]/50">
                      <span className="text-sm text-zinc-400">
                        Chave do Projeto
                      </span>
                      <span className="text-sm font-mono font-bold text-zinc-200 bg-[#27272A] px-2 py-0.5 rounded">
                        {activeProject.key || "NX"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-[#27272A]/50">
                      <span className="text-sm text-zinc-400">Membros</span>
                      <div className="flex -space-x-2">
                        {activeProject.members
                          ?.slice(0, 3)
                          .map((m: any, i: number) => (
                            <img
                              key={i}
                              src={
                                m.photoURL ||
                                `https://ui-avatars.com/api/?name=${m.name || "U"}&background=27272A&color=fff`
                              }
                              className="w-7 h-7 rounded-full border-2 border-[#121214]"
                              title={m.name}
                              alt="Membro"
                            />
                          ))}
                        {(activeProject.members?.length || 0) === 0 && (
                          <span className="text-xs text-zinc-500">
                            Sem membros
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-zinc-400">Criado em</span>
                      <span className="text-sm font-medium text-zinc-200">
                        {activeProject.createdAt
                          ? new Date(
                              activeProject.createdAt,
                            ).toLocaleDateString("pt-PT")
                          : "Recente"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </main>
  );
}

// === COMPONENTES AUXILIARES DO DASHBOARD ===

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <div className="bg-[#121214] p-5 rounded-xl border border-[#27272A] flex flex-col relative overflow-hidden group hover:border-[#3F3F46] transition-colors">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {title}
        </h3>
        <div className="p-2 bg-[#09090B] border border-[#27272A] rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-3xl font-bold text-white tracking-tight">
          {value}
        </span>
        <p className="text-xs text-zinc-500 mt-1 font-medium">{trend}</p>
      </div>
    </div>
  );
}

function RecentTaskRow({ task }: { task: any }) {
  return (
    <Link
      href="/backlog"
      className="flex items-center gap-4 p-4 hover:bg-[#1A1A1E] transition-colors group"
    >
      <div className="flex items-center gap-2 shrink-0">
        <TypeIcon type={task.type} />
        <StatusIcon status={task.status} />
      </div>

      <div className="flex items-center gap-2 shrink-0 w-20">
        <span className="text-xs font-mono text-zinc-500">
          {task.key || task.id.slice(0, 8)}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-400 transition-colors">
          {task.title}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <PriorityIcon priority={task.priority} />
        {task.points > 0 && (
          <span className="text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full bg-[#09090B] text-zinc-400 border border-[#27272A]">
            {task.points}
          </span>
        )}
        <img
          src={
            task.assigneePhoto ||
            `https://ui-avatars.com/api/?name=${task.assignee || "U"}&background=27272A&color=fff`
          }
          alt="Assignee"
          title={task.assignee || "Sem Responsável"}
          className="w-6 h-6 rounded-full border border-[#27272A] object-cover"
        />
      </div>
    </Link>
  );
}

function NoProjectState({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-[#121214] border border-[#27272A] shadow-lg rounded-full flex items-center justify-center mb-6 relative">
        <FolderOpen className="text-zinc-500" size={32} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
        Bem-vindo ao Nexo
      </h3>
      <p className="text-zinc-500 text-sm max-w-md mb-8 leading-relaxed">
        Você ainda não selecionou ou criou nenhum projeto. Crie um novo espaço
        de trabalho para começar a gerir as suas tarefas.
      </p>
      <button
        onClick={onOpenModal}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95"
      >
        <FolderPlus size={18} /> Criar o Primeiro Projeto
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#121214] h-32 rounded-xl border border-[#27272A]"
          ></div>
        ))}
      </div>
      <div className="bg-[#121214] h-32 rounded-xl border border-[#27272A]"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#121214] h-64 rounded-xl border border-[#27272A]"></div>
        <div className="bg-[#121214] h-64 rounded-xl border border-[#27272A]"></div>
      </div>
    </div>
  );
}

// --- ÍCONES (Mesmo padrão visual do Backlog) ---
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "bug":
      return (
        <div className="text-red-400 bg-red-400/10 p-1 rounded">
          <Bug size={12} />
        </div>
      );
    case "feature":
      return (
        <div className="text-emerald-400 bg-emerald-400/10 p-1 rounded">
          <Sparkles size={12} />
        </div>
      );
    case "task":
      return (
        <div className="text-blue-400 bg-blue-400/10 p-1 rounded">
          <FileText size={12} />
        </div>
      );
    default:
      return (
        <div className="text-zinc-400 bg-zinc-400/10 p-1 rounded">
          <FileText size={12} />
        </div>
      );
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "todo":
      return <CircleDashed size={16} className="text-zinc-500" />;
    case "in-progress":
      return <ArrowRightCircle size={16} className="text-amber-500" />;
    case "review":
      return <ArrowRightCircle size={16} className="text-purple-500" />;
    case "done":
      return <CheckCircle2 size={16} className="text-emerald-500" />;
    default:
      return <CircleDashed size={16} className="text-zinc-500" />;
  }
}

function PriorityIcon({ priority }: { priority: string }) {
  switch (priority) {
    case "low":
      return <ArrowDown size={14} className="text-zinc-500" />;
    case "medium":
      return <ArrowRight size={14} className="text-zinc-400" />;
    case "high":
      return <ArrowUp size={14} className="text-amber-500" />;
    case "critical":
      return (
        <div className="bg-red-500/10 text-red-500 p-0.5 rounded">
          <ArrowUp size={14} />
        </div>
      );
    default:
      return <ArrowRight size={14} className="text-zinc-500" />;
  }
}
