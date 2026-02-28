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
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Clock,
  Loader2,
  GitBranch,
  Paperclip,
  Target,
  AlertTriangle,
  ListChecks,
  Briefcase,
  Trash2,
} from "lucide-react";

import { TaskExecutionModal } from "@/app/components/modals/TaskExecutionModal";
import { CreateTaskModal } from "@/app/components/modals/CreateTaskModal";

const DEFAULT_COLUMNS = [
  { id: "todo", title: "A Fazer", color: "zinc", limit: 0, emoji: "📝" },
  {
    id: "in-progress",
    title: "Em Curso",
    color: "indigo",
    limit: 4,
    emoji: "🚀",
  },
  { id: "review", title: "Revisão", color: "purple", limit: 3, emoji: "👀" },
  { id: "done", title: "Concluído", color: "emerald", limit: 0, emoji: "✅" },
];

const getColumnColorClasses = (colorName: string) => {
  const colors: Record<string, { border: string; bg: string; text: string }> = {
    zinc: {
      border: "border-zinc-500/30",
      bg: "bg-zinc-500/10",
      text: "text-zinc-400",
    },
    indigo: {
      border: "border-indigo-500/30",
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
    },
    purple: {
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      text: "text-purple-400",
    },
    emerald: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
    },
    red: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-400",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
    blue: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
    },
  };
  return colors[colorName] || colors.zinc;
};

const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "high":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    case "medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "low":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    default:
      return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  }
};

const getPriorityAccent = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]";
    case "high":
      return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]";
    case "medium":
      return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]";
    case "low":
      return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]";
    default:
      return "bg-zinc-600";
  }
};

const getDaysRemaining = (endDate: any) => {
  if (!endDate) return null;
  const end = endDate.seconds
    ? new Date(endDate.seconds * 1000)
    : new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Sprint Atrasada";
  if (diffDays === 0) return "Termina Hoje";
  if (diffDays === 1) return "Falta 1 dia";
  return `Faltam ${diffDays} dias`;
};

export default function QuadrosPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState<any>(null);

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [editingLimitCol, setEditingLimitCol] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<string>("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const boardColumns = activeProject?.boardColumns || DEFAULT_COLUMNS;
  const firstColumnId = boardColumns[0]?.id || "todo";

  useEffect(() => {
    if (!activeProject?.id) return;
    setIsLoading(true);

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

    const qSprint = query(
      collection(db, "projects", activeProject.id, "sprints"),
      where("status", "==", "active"),
    );
    const unsubscribeSprint = onSnapshot(qSprint, (snapshot) => {
      if (!snapshot.empty) {
        const sprintDoc = snapshot.docs[0];
        setActiveSprint({ id: sprintDoc.id, ...sprintDoc.data() });
      } else {
        setActiveSprint(null);
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSprint();
    };
  }, [activeProject]);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.key?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      const el = document.getElementById(`card-${taskId}`);
      if (el) el.style.opacity = "0.3";
    }, 0);
  };

  const handleDragEnd = (taskId: string) => {
    setDraggedOverCol(null);
    const el = document.getElementById(`card-${taskId}`);
    if (el) el.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedOverCol !== colId) setDraggedOverCol(colId);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggedOverCol(null);

    const taskId = e.dataTransfer.getData("taskId");
    const el = document.getElementById(`card-${taskId}`);
    if (el) el.style.opacity = "1";

    if (!taskId || !activeProject?.id) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === colId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: colId } : t)),
    );

    try {
      await updateDoc(doc(db, "projects", activeProject.id, "tasks", taskId), {
        status: colId,
        updatedAt: new Date().toISOString(),
      });

      const statusName =
        boardColumns.find((c: any) => c.id === colId)?.title || colId;

      await addDoc(collection(db, "projects", activeProject.id, "activities"), {
        content: `Moveu a tarefa "${task.title}" para ${statusName}`,
        userId: auth.currentUser?.uid || "unknown",
        userName: auth.currentUser?.displayName || "Membro",
        userPhoto: auth.currentUser?.photoURL || "",
        timestamp: serverTimestamp(),
        type: "move",
        taskId: taskId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveLimit = async (colId: string) => {
    if (!activeProject?.id) return;
    const newLimit = parseInt(tempLimit, 10) || 0;
    const updatedCols = boardColumns.map((c: any) =>
      c.id === colId ? { ...c, limit: newLimit } : c,
    );
    await updateDoc(doc(db, "projects", activeProject.id), {
      boardColumns: updatedCols,
    });
    setEditingLimitCol(null);
  };

  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (window.confirm("Apagar este cartão permanentemente?")) {
      try {
        await deleteDoc(doc(db, "projects", activeProject.id, "tasks", taskId));
      } catch (error) {
        console.error("Erro ao apagar tarefa:", error);
      }
    }
  };

  if (!activeProject) return null;

  const totalSprintTasks = tasks.length;
  const completedSprintTasks = tasks.filter(
    (t) => t.status === "done" || t.status === "concluido",
  ).length;
  const sprintProgress =
    totalSprintTasks === 0
      ? 0
      : Math.round((completedSprintTasks / totalSprintTasks) * 100);

  return (
    // Removida a div absoluta. O main com flex-1 flex flex-col h-full preenche o ecrã nativamente.
    <main className="flex-1 flex flex-col h-full bg-[#000000] relative overflow-hidden">
      {/* Efeitos de Fundo */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* HEADER DO QUADRO */}
      <header className="shrink-0 px-8 py-6 border-b border-white/[0.05] bg-white/[0.01] backdrop-blur-2xl flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.4em]">
              <Target size={12} />
              <span>
                {activeProject.category === "design"
                  ? "Fluxo Contínuo"
                  : "Sprint Ativa"}
              </span>
            </div>

            {activeSprint?.endDate && activeProject.category !== "design" && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border ${getDaysRemaining(activeSprint.endDate)?.includes("Atrasada") ? "border-red-500/30 text-red-400" : "border-white/[0.05] text-zinc-400"} text-[9px] font-black uppercase tracking-widest shadow-sm`}
              >
                <Clock size={10} />
                <span>{getDaysRemaining(activeSprint.endDate)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-8">
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
              {activeProject.category === "design"
                ? "Quadro de Design"
                : activeSprint?.name || "Quadro Kanban"}
            </h1>

            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-2.5 backdrop-blur-md">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center w-32">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    Progresso
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {sprintProgress}%
                  </span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden shadow-inner">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-4">
                <div className="text-[13px] font-black text-white leading-none">
                  {completedSprintTasks}{" "}
                  <span className="text-[10px] text-zinc-600 font-bold">
                    / {totalSprintTasks}
                  </span>
                </div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                  Tarefas
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden lg:block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
            />
            <input
              type="text"
              placeholder="Procurar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/50 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-black hover:bg-zinc-200 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.05)] active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={3} /> Nova Tarefa
          </button>
        </div>
      </header>

      {/* ÁREA DE SCROLL PRINCIPAL - A magia do flex-1 e min-w-[] acontece aqui */}
      <div className="flex-1 flex gap-6 px-8 py-6 overflow-x-auto overflow-y-hidden custom-scrollbar relative z-10 min-h-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          boardColumns.map((column: any, idx: number) => {
            const columnTasks = filteredTasks.filter(
              (t) => t.status === column.id,
            );
            const isDraggedOver = draggedOverCol === column.id;
            const style = getColumnColorClasses(column.color || "zinc");
            const hasLimit = column.limit && column.limit > 0;
            const isOverLimit = hasLimit && columnTasks.length > column.limit;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                // FLEX-1 faz com que distribuam o espaço disponível. MIN-W-[320px] impede que fiquem muito pequenas.
                className={`flex-1 min-w-[320px] flex flex-col bg-white/[0.01] backdrop-blur-[2px] border border-white/[0.05] rounded-3xl transition-all duration-300 ${isDraggedOver ? "bg-white/[0.03] ring-1 ring-white/20 scale-[1.01]" : ""} ${isOverLimit ? "border-red-500/20 bg-red-500/[0.02]" : ""}`}
              >
                {/* CABEÇALHO DA COLUNA */}
                <div
                  className={`relative flex items-end justify-between border-b border-white/[0.05] shrink-0 bg-white/[0.01] backdrop-blur-md rounded-t-3xl overflow-hidden transition-all duration-300 ${column.bannerUrl ? "h-28 p-5" : "p-5"}`}
                >
                  {column.bannerUrl && (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 hover:scale-110"
                        style={{ backgroundImage: `url(${column.bannerUrl})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent z-0" />
                    </>
                  )}

                  <div className="flex items-center gap-2.5 relative z-10">
                    {column.emoji ? (
                      <span className="text-xl drop-shadow-lg">
                        {column.emoji}
                      </span>
                    ) : (
                      <div
                        className={`w-2 h-2 rounded-full ${style.bg} border ${style.border} shadow-[0_0_12px_currentColor] ${style.text}`}
                      />
                    )}
                    <h3
                      className={`text-[13px] font-black uppercase tracking-widest drop-shadow-md ${column.bannerUrl ? "text-white" : "text-zinc-200"}`}
                    >
                      {column.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 relative z-10">
                    {isOverLimit && (
                      <AlertTriangle
                        size={14}
                        className="text-red-400 animate-pulse"
                      />
                    )}
                    {editingLimitCol === column.id ? (
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        value={tempLimit}
                        onChange={(e) => setTempLimit(e.target.value)}
                        onBlur={() => handleSaveLimit(column.id)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveLimit(column.id)
                        }
                        className="w-14 bg-[#1A1A1E] border border-indigo-500/50 rounded-md py-0.5 px-1.5 text-[11px] text-center font-bold text-white outline-none focus:ring-1"
                      />
                    ) : (
                      <div
                        onClick={() => {
                          setEditingLimitCol(column.id);
                          setTempLimit(column.limit?.toString() || "0");
                        }}
                        className={`cursor-pointer hover:scale-105 px-2.5 py-0.5 rounded-lg text-[11px] font-black tracking-wider transition-all backdrop-blur-md ${isOverLimit ? "bg-red-500/20 text-red-300 border border-red-500/30" : `bg-black/40 text-white border border-white/10 hover:bg-black/60`}`}
                      >
                        {columnTasks.length}{" "}
                        {hasLimit ? (
                          <span className="opacity-50">/ {column.limit}</span>
                        ) : (
                          <span className="opacity-50">/ ∞</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* === LISTA DE CARTÕES COM SCROLL INTERNO === */}
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar min-h-0">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {columnTasks.map((task) => {
                        const totalSubtasks = task.checklist?.length || 0;
                        const completedSubtasks =
                          task.checklist?.filter((c: any) => c.completed)
                            .length || 0;
                        const isAllCompleted =
                          totalSubtasks > 0 &&
                          totalSubtasks === completedSubtasks;
                        const assignees = Array.isArray(task.assignees)
                          ? task.assignees
                          : task.assignee
                            ? [
                                {
                                  name: task.assignee,
                                  photoURL: task.assigneePhoto,
                                },
                              ]
                            : [];

                        return (
                          <motion.div
                            layout
                            layoutId={task.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={task.id}
                            id={`card-${task.id}`}
                            draggable
                            onDragStart={(e: any) =>
                              handleDragStart(e, task.id)
                            }
                            onDragEnd={() => handleDragEnd(task.id)}
                            onClick={() => setSelectedTask(task)}
                            className="group relative bg-[#0D0D0F] border border-white/[0.04] hover:border-indigo-500/30 p-6 rounded-[2rem] cursor-grab active:cursor-grabbing transition-all duration-300 shadow-xl hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.15)] hover:-translate-y-1.5 overflow-hidden"
                          >
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-[3px] opacity-60 group-hover:opacity-100 transition-opacity z-20 ${getPriorityAccent(task.priority)}`}
                            />

                            {task.coverImage && (
                              <div className="-mx-6 -mt-6 mb-5 h-36 relative shrink-0 overflow-hidden border-b border-white/[0.05] rounded-t-[2rem]">
                                <img
                                  src={task.coverImage}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                  alt="Capa"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-transparent to-transparent opacity-90" />
                              </div>
                            )}

                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                  {task.key || task.taskKey || "TSK"}
                                </span>
                                {task.clientId && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <span className="text-[9px] font-bold text-zinc-400 group-hover:text-zinc-300 flex items-center gap-1">
                                      <Briefcase size={10} />
                                      Cliente
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => handleDeleteTask(e, task.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Apagar Cartão"
                                >
                                  <Trash2 size={14} />
                                </button>

                                <div
                                  className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase border backdrop-blur-md ${getPriorityStyles(task.priority)}`}
                                >
                                  {task.priority || "Normal"}
                                </div>
                              </div>
                            </div>

                            <h4 className="text-[15px] font-bold text-zinc-100 leading-snug mb-5 group-hover:text-white transition-colors relative z-10">
                              {task.title}
                            </h4>

                            {totalSubtasks > 0 && (
                              <div className="mb-5 relative z-10 bg-white/[0.02] border border-white/[0.03] p-3 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                    <ListChecks size={12} /> Subtarefas
                                  </span>
                                  <span
                                    className={`text-[10px] font-black ${isAllCompleted ? "text-emerald-400" : "text-zinc-400"}`}
                                  >
                                    {completedSubtasks}/{totalSubtasks}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${isAllCompleted ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.6)]"}`}
                                    style={{
                                      width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] relative z-10">
                              <div className="flex items-center gap-3 text-zinc-500">
                                {task.points && (
                                  <div className="flex items-center justify-center px-2 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[10px] font-black text-indigo-300">
                                    {task.points} pts
                                  </div>
                                )}
                                {task.branch && (
                                  <div
                                    className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-mono font-bold"
                                    title={`Branch: ${task.branch}`}
                                  >
                                    <GitBranch size={10} />{" "}
                                    <span className="max-w-[60px] truncate">
                                      {task.branch}
                                    </span>
                                  </div>
                                )}
                                {task.attachmentsCount > 0 && (
                                  <div className="flex items-center gap-1 text-[11px] font-black text-zinc-400">
                                    <Paperclip size={12} />{" "}
                                    {task.attachmentsCount}
                                  </div>
                                )}
                              </div>

                              <div className="flex -space-x-2">
                                {assignees.length > 0 ? (
                                  assignees
                                    .slice(0, 3)
                                    .map((a: any, i: number) => (
                                      <img
                                        key={i}
                                        src={a.photo || a.photoURL}
                                        className="w-7 h-7 rounded-xl border-2 border-[#0D0D0F] object-cover ring-1 ring-white/[0.05] relative z-10 hover:z-20 hover:scale-110 hover:-translate-y-1 transition-all shadow-lg"
                                        title={a.name}
                                        alt=""
                                      />
                                    ))
                                ) : (
                                  <div className="w-7 h-7 rounded-xl border-2 border-[#0D0D0F] bg-zinc-800 flex items-center justify-center relative z-10">
                                    <span className="text-[9px] font-black text-zinc-500">
                                      ?
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {idx === 0 && activeProject.category === "design" && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 w-full py-3.5 border border-dashed border-white/[0.08] hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-[1.5rem] flex items-center justify-center gap-2 text-zinc-500 hover:text-indigo-400 transition-all group shrink-0"
                    >
                      <Plus
                        size={16}
                        className="group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Adicionar Cartão
                      </span>
                    </button>
                  )}

                  {columnTasks.length === 0 &&
                    (activeProject.category !== "design" || idx !== 0) && (
                      <div className="mt-4 h-28 border-2 border-dashed border-white/[0.05] rounded-[2rem] flex flex-col items-center justify-center text-zinc-600 bg-white/[0.01] transition-colors shrink-0">
                        <div className={`p-2 rounded-xl bg-white/[0.02] mb-2`}>
                          <Plus size={16} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-50">
                          Mover para aqui
                        </span>
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedTask && (
        <TaskExecutionModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          activeProjectId={activeProject.id}
        />
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={activeProject.id}
        projectKey={activeProject.key}
        firstColumnId={firstColumnId}
        clients={activeProject.clients || []}
        members={activeProject.members || []}
      />
    </main>
  );
}
