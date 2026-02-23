"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  CircleDashed,
  ArrowRightCircle,
  Clock,
  Ban,
  Loader2,
  GitBranch,
  MoreHorizontal,
  AlignLeft,
  Calendar,
} from "lucide-react";

// 👇 O IMPORT DO MODAL AQUI (descomentado) 👇
import {TaskModal} from "../../components/modals/TaskModal";

const KANBAN_COLUMNS = [
  {
    id: "todo",
    title: "A Fazer",
    icon: <CircleDashed size={14} className="text-zinc-500" />,
  },
  {
    id: "in-progress",
    title: "Em Progresso",
    icon: <ArrowRightCircle size={14} className="text-indigo-500" />,
  },
  {
    id: "blocked",
    title: "Bloqueados",
    icon: <Ban size={14} className="text-red-500" />,
  },
  {
    id: "review",
    title: "Em Revisão",
    icon: <Search size={14} className="text-yellow-500" />,
  },
  {
    id: "done",
    title: "Concluído",
    icon: <CheckCircle2 size={14} className="text-emerald-500" />,
  },
];

export default function QuadrosPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isOverColumn, setIsOverColumn] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    if (!activeProject?.id) return;
    setIsLoading(true);

    // 1. BUSCA AS TAREFAS (O seu código original)
    const qTasks = query(
      collection(db, "projects", activeProject.id, "tasks"),
      where("target", "==", "sprint"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
      setIsLoading(false);
    });

    // 2. BUSCA A SPRINT ATIVA (Novo código)
    const qSprint = query(
      collection(db, "projects", activeProject.id, "sprints"),
      where("status", "==", "active"),
    );

    const unsubscribeSprint = onSnapshot(qSprint, (snapshot) => {
      if (!snapshot.empty) {
        // Pega a primeira sprint ativa que encontrar
        const sprintDoc = snapshot.docs[0];
        setActiveSprint({ id: sprintDoc.id, ...sprintDoc.data() });
      } else {
        setActiveSprint(null);
      }
    });

    // 3. LIMPEZA: Para os dois ouvintes quando sair da página
    return () => {
      unsubscribeTasks();
      unsubscribeSprint();
    };
  }, [activeProject]);

  const formatData = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date
      .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      .replace(".", "");
  };

  // Calcula dias restantes
  const getDiasRestantes = (endDateStr: any) => {
    if (!endDateStr) return 0;
    const end = endDateStr.toDate ? endDateStr.toDate() : new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "0.5";
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "1";
    }
    setDraggedTaskId(null);
    setIsOverColumn(null);
  };

  const onDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId || !activeProject?.id) return;

    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      try {
        // 1. Atualiza a tarefa normalmente
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", taskId),
          {
            status: newStatus,
            updatedAt: new Date().toISOString(),
          },
        );

        // 2. ADICIONA O LISTENER DE ATIVIDADE AQUI 👇
        await addDoc(
          collection(db, "projects", activeProject.id, "activities"),
          {
            content: `Moveu a tarefa "${task.title}" para ${newStatus}`,
            userId: auth.currentUser?.uid || "unknown",
            userName: auth.currentUser?.displayName || "Membro",
            timestamp: serverTimestamp(),
            type: "move",
          },
        );
      } catch (error) {
        console.error("Erro ao mover e registar atividade:", error);
      }
    }
    setIsOverColumn(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-emerald-500";
      default:
        return "bg-zinc-500";
    }
  };

  if (!activeProject) return null;

  return (
    <main className="flex-1 flex flex-col h-full z-10 overflow-hidden bg-[#09090B]">
      {/* Header Premium */}
      <header className="h-16 shrink-0 border-b border-[#27272A] bg-[#09090B]/80 backdrop-blur-md px-6 flex items-center justify-between z-20">
        {/* Lado Esquerdo: Info do Sprint & Equipa */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2.5">
              <h1
                className="text-lg font-bold text-white tracking-tight leading-none truncate max-w-[250px]"
                title={activeSprint?.name}
              >
                {activeSprint?.name || "Nenhuma Sprint Ativa"}
              </h1>

              {activeSprint && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ativa
                </span>
              )}
            </div>

            {activeSprint && activeSprint.startDate && activeSprint.endDate && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium mt-1.5">
                <span className="flex items-center gap-1 capitalize">
                  <Calendar size={11} />
                  {formatData(activeSprint.startDate)} -{" "}
                  {formatData(activeSprint.endDate)}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1 text-indigo-400">
                  <Clock size={11} /> {getDiasRestantes(activeSprint.endDate)}{" "}
                  dias restantes
                </span>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-[#27272A] hidden sm:block" />

          {/* Avatares da Equipa puxados do Firebase */}
          <div className="hidden sm:flex items-center">
            <div className="flex -space-x-2">
              {activeProject?.members
                ?.slice(0, 4)
                .map((member: any, index: number) => (
                  <img
                    key={member.email || index}
                    src={
                      member.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "User")}&background=27272A&color=fff`
                    }
                    className="w-7 h-7 rounded-full border-2 border-[#09090B] relative object-cover"
                    style={{ zIndex: 40 - index }} // Mantém o primeiro avatar por cima dos outros
                    alt={member.name || "Team member"}
                    title={member.name} // Mostra o nome ao passar o rato
                  />
                ))}

              {/* Contador extra caso existam mais de 4 membros no projeto */}
              {(activeProject?.members?.length || 0) > 4 && (
                <div
                  className="w-7 h-7 rounded-full border-2 border-[#09090B] bg-[#1A1A1E] text-zinc-400 flex items-center justify-center text-[10px] font-bold relative"
                  style={{ zIndex: 0 }}
                >
                  +{activeProject.members.length - 4}
                </div>
              )}
            </div>

            <button
              className="w-7 h-7 rounded-full border-2 border-[#09090B] bg-[#1A1A1E] text-zinc-400 flex items-center justify-center text-xs hover:bg-[#27272A] hover:text-white transition-colors -ml-2 relative z-0"
              title="Convidar membro"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Lado Direito: Ações & Filtros */}
        <div className="flex items-center gap-3">
          {/* Barra de Pesquisa */}
          <div className="relative hidden md:block">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              className="bg-[#121214] border border-[#27272A] text-sm text-zinc-200 rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-indigo-500/50 transition-all w-48 focus:w-64 placeholder:text-zinc-600"
            />
          </div>

          <div className="h-6 w-px bg-[#27272A] mx-1 hidden md:block" />

          {/* Botão de Filtros */}
          <button className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1A1A1E] border border-transparent hover:border-[#27272A] transition-all flex items-center gap-2 text-sm font-medium">
            <Filter size={14} />
            <span className="hidden lg:inline">Filtros</span>
          </button>

          {/* Botão Principal */}
          <button className="bg-white hover:bg-zinc-200 text-black text-[13px] font-bold px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 shadow-sm">
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>
        </div>
      </header>

      {/* Área do Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-1.5 custom-scrollbar">
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={28} />
          </div>
        ) : (
          KANBAN_COLUMNS.map((column, index) => {
            const columnTasks = tasks.filter((t) => t.status === column.id);

            return (
              <React.Fragment key={column.id}>
                <div
                  className={`flex flex-col shrink-0 w-[18%] min-w-[280px] rounded-xl transition-all duration-200 ${
                    isOverColumn === column.id
                      ? "bg-indigo-500/5 ring-1 ring-indigo-500/20"
                      : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsOverColumn(column.id);
                  }}
                  onDragLeave={() => setIsOverColumn(null)}
                  onDrop={(e) => onDrop(e, column.id)}
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[13px] flex items-center gap-1.5 text-zinc-200">
                        {column.icon} {column.title}
                      </h3>
                      <span className="text-zinc-500 text-[10px] font-bold bg-[#1A1A1E] px-1.5 rounded border border-[#27272A]">
                        {columnTasks.length}
                      </span>
                    </div>
                    {column.id === "todo" && (
                      <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {/* Lista de Cartões */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1.5 pb-10">
                    <AnimatePresence mode="popLayout">
                      {columnTasks.map((task) => {
                        const priorityColor = getPriorityColor(task.priority);
                        const hasDescription =
                          task.description &&
                          task.description.trim().length > 0;

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -2 }}
                            // 👇 Funcionalidades de Drag and Drop preservadas
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedTask(task)}
                            className="group relative bg-[#0C0C0E] hover:bg-[#121214] rounded-lg border border-[#27272A] hover:border-[#3F3F46] shadow-sm hover:shadow-xl transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden"
                          >
                            {/* Indicador Lateral de Status/Prioridade Estilo Enterprise */}
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-[3px] ${priorityColor} opacity-80`}
                            />

                            <div className="p-3.5 space-y-3">
                              {/* Header: Identificador Único e Metadados Rápidos */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold text-zinc-500 tracking-wider">
                                    {/* Usa a nova taskKey ou fallback para ID */}
                                    {task.taskKey ||
                                      task.id.slice(0, 5).toUpperCase()}
                                  </span>
                                  <div className="h-1 w-1 rounded-full bg-zinc-700" />
                                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-tight">
                                    {task.type || "Task"}
                                  </span>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal
                                    size={14}
                                    className="text-zinc-500 hover:text-white"
                                  />
                                </div>
                              </div>

                              {/* Título: Tipografia com maior peso e legibilidade */}
                              <h4 className="text-[13.5px] font-semibold text-zinc-100 leading-snug group-hover:text-indigo-400 transition-colors line-clamp-2">
                                {task.title}
                              </h4>

                              {/* Tags Estilizadas (Pills) */}
                              {task.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.tags.map((tag: string, i: number) => (
                                    <span
                                      key={i}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-700/30 uppercase tracking-tighter"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Footer: Grid de Informações Técnicas */}
                              <div className="flex items-center justify-between pt-1 border-t border-[#1A1A1E]">
                                <div className="flex items-center gap-3">
                                  {/* Story Points - Badge Retangular */}
                                  {task.points && (
                                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#1A1A1E] border border-[#27272A] text-zinc-400">
                                      <span className="text-[10px] font-black">
                                        {task.points}
                                      </span>
                                    </div>
                                  )}

                                  {/* GitHub Branch - Ícone e Nome Limpo */}
                                  {task.branch && (
                                    <div className="flex items-center gap-1 text-zinc-500 hover:text-indigo-400 transition-colors">
                                      <GitBranch size={11} />
                                      <span className="text-[10px] font-medium max-w-[80px] truncate">
                                        {task.branch.split("/").pop()}
                                      </span>
                                    </div>
                                  )}

                                  {/* Indicadores de Anexos/Checklist */}
                                  <div className="flex items-center gap-2 text-zinc-600">
                                    {hasDescription && <AlignLeft size={12} />}
                                    {task.attachmentsCount > 0 && (
                                      <div className="flex items-center gap-0.5 text-[10px]">
                                        <Paperclip size={11} />
                                        <span>{task.attachmentsCount}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Assignee - Avatar Minimalista com Borda de Status */}
                                <div className="flex -space-x-1">
                                  <img
                                    src={
                                      task.assigneePhoto ||
                                      `https://ui-avatars.com/api/?name=${task.assignee}&background=1A1A1E&color=fff`
                                    }
                                    className="w-5 h-5 rounded-md border border-[#27272A] object-cover filter saturate-[0.8] hover:saturate-100 transition-all"
                                    title={task.assignee}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Divisórias Verticais */}
                {index < KANBAN_COLUMNS.length - 1 && (
                  <div className="w-[1px] bg-gradient-to-b from-transparent via-[#27272A] to-transparent shrink-0 h-full mx-1"></div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* 👇 O MODAL É RENDERIZADO AQUI 👇 */}
      {selectedTask && (
        <TaskModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskForm={selectedTask} // <--- MUDA PARA taskForm
          setTaskForm={function (
            value: React.SetStateAction<{
              title: string;
              description: string;
              type: string;
              epic: string;
              status: string;
              priority: string;
              points: number;
              assignee: string;
              assigneePhoto: string;
              target: string;
              tags: string[];
              checklist: { id: string; title: string; completed: boolean }[];
              attachments: {
                id: string;
                name: string;
                type: string;
                url: string;
              }[];
              branch: string;
            }>,
          ): void {
            throw new Error("Function not implemented.");
          }}
          onSave={function (e: React.FormEvent): void {
            throw new Error("Function not implemented.");
          }}
          onDelete={function (): void {
            throw new Error("Function not implemented.");
          }}
          editingId={null}
          isSaving={false}
          epics={[]}
          activeProject={undefined}
          fileInputRef={undefined}
          handleFileUpload={function (
            e: React.ChangeEvent<HTMLInputElement>,
          ): void {
            throw new Error("Function not implemented.");
          }}
          handleAddLink={function (): void {
            throw new Error("Function not implemented.");
          }}
          removeAttachment={function (id: string): void {
            throw new Error("Function not implemented.");
          }}
          handleAddChecklistItem={function (
            e: React.KeyboardEvent<HTMLInputElement>,
          ): void {
            throw new Error("Function not implemented.");
          }}
          toggleChecklistItem={function (id: string): void {
            throw new Error("Function not implemented.");
          }}
          removeChecklistItem={function (id: string): void {
            throw new Error("Function not implemented.");
          }}
          handleAddTag={function (
            e: React.KeyboardEvent<HTMLInputElement>,
          ): void {
            throw new Error("Function not implemented.");
          }}
          removeTag={function (tag: string): void {
            throw new Error("Function not implemented.");
          }}
          isAssigneeDropdownOpen={false}
          setIsAssigneeDropdownOpen={function (open: boolean): void {
            throw new Error("Function not implemented.");
          }}
        />
      )}
    </main>
  );
}
