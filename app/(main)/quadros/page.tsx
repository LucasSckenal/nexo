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
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  GitBranch,
  Paperclip,
  AlignLeft,
  LayoutList,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";

import { TaskExecutionModal } from "@/app/components/modals/TaskExecutionModal";

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
      return "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]";
    case "critical":
      return "bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)]";
    case "high":
      return "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]";
    case "medium":
      return "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]";
    case "low":
      return "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]";
    default:
      return "bg-zinc-600 shadow-[0_0_8px_rgba(82,82,91,0.5)]";
  }
};

export default function KanbanPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const [editingLimitCol, setEditingLimitCol] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<string>("");

  const boardColumns = activeProject?.boardColumns || DEFAULT_COLUMNS;

  useEffect(() => {
    if (!activeProject?.id) return;
    setLoading(true);
    const q = query(
      collection(db, "projects", activeProject.id, "tasks"),
      where("target", "==", "sprint"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeProject?.id]);

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

  // FUNÇÃO QUE ESTAVA EM FALTA!
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
    await updateDoc(doc(db, "projects", activeProject.id, "tasks", taskId), {
      status: colId,
    });
  };

  const handleSaveLimit = async (colId: string) => {
    if (!activeProject?.id) return;
    const newLimit = parseInt(tempLimit, 10) || 0;
    const updatedCols = (activeProject.boardColumns || DEFAULT_COLUMNS).map(
      (c: any) => (c.id === colId ? { ...c, limit: newLimit } : c),
    );
    await updateDoc(doc(db, "projects", activeProject.id), {
      boardColumns: updatedCols,
    });
    setEditingLimitCol(null);
  };

  if (!activeProject) return null;

  return (
    <main className="flex-1 flex flex-col bg-[#000000] overflow-hidden relative h-full">
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      <header className="shrink-0 px-8 py-6 border-b border-white/[0.05] bg-white/[0.01] backdrop-blur-2xl flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
            <LayoutList size={14} />
            <span>Sprint Ativa</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Quadro Kanban
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-zinc-300">
              {tasks.length} issues
            </span>
          </h1>
        </div>
        <div className="relative group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
          />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/50 outline-none transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-stretch gap-6 px-8 py-6 custom-scrollbar relative z-10 min-h-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          boardColumns.map((column: any) => {
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
                onDragLeave={handleDragLeave} // Agora definido corretamente!
                onDrop={(e) => handleDrop(e, column.id)}
                className={`h-full max-h-full flex flex-col flex-shrink-0 w-[340px] bg-white/[0.01] backdrop-blur-[2px] border border-white/[0.05] rounded-3xl transition-all duration-300 ${isDraggedOver ? "bg-white/[0.04] ring-2 ring-indigo-500/30 scale-[1.01]" : ""} ${isOverLimit ? "border-red-500/20 bg-red-500/[0.02]" : ""}`}
              >
                {/* CABEÇALHO DA COLUNA (AGORA COM BANNER) */}
                <div
                  className={`relative flex items-end justify-between border-b border-white/[0.05] shrink-0 bg-white/[0.01] backdrop-blur-md rounded-t-3xl overflow-hidden transition-all duration-300 ${column.bannerUrl ? "h-28 p-5" : "p-5"}`}
                >
                  {/* Banner Background */}
                  {column.bannerUrl && (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 hover:scale-110"
                        style={{ backgroundImage: `url(${column.bannerUrl})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent z-0" />
                    </>
                  )}

                  {/* Título e Ícone */}
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

                  {/* WIP Limit */}
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

                {/* LISTA DE CARDS */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
                  <AnimatePresence>
                    {columnTasks.map((task) => {
                      const checklistTotal = task.checklist?.length || 0;
                      const checklistDone =
                        task.checklist?.filter((c: any) => c.completed)
                          .length || 0;
                      const progress =
                        checklistTotal > 0
                          ? (checklistDone / checklistTotal) * 100
                          : 0;
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
                          onDragStart={(e: any) => handleDragStart(e, task.id)}
                          onDragEnd={() => handleDragEnd(task.id)}
                          onClick={() => setSelectedTask(task)}
                          className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 cursor-grab active:cursor-grabbing hover:bg-white/[0.05] hover:border-white/20 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-[3px] opacity-70 group-hover:opacity-100 transition-opacity ${getPriorityStyles(task.priority)}`}
                          />

                          <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 relative z-10">
                            <div className="flex items-center gap-1.5">
                              <span className="group-hover:text-indigo-300 transition-colors drop-shadow-md">
                                {task.key || "TSK"}
                              </span>
                              {task.epicName && (
                                <>
                                  <span className="text-white/20">•</span>
                                  <span
                                    className="truncate max-w-[100px] text-zinc-500"
                                    title={task.epicName}
                                  >
                                    {task.epicName}
                                  </span>
                                </>
                              )}
                            </div>
                            {task.type && (
                              <div
                                className={`px-1.5 py-0.5 rounded backdrop-blur-md border border-white/5 ${task.type === "bug" ? "bg-red-500/10 text-red-400" : task.type === "feature" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-zinc-300"}`}
                              >
                                {task.type === "bug"
                                  ? "Bug"
                                  : task.type === "feature"
                                    ? "Feat"
                                    : "Task"}
                              </div>
                            )}
                          </div>

                          <h4 className="text-[14px] font-semibold text-zinc-100 mb-4 leading-relaxed group-hover:text-white transition-colors relative z-10 drop-shadow-sm">
                            {task.title}
                          </h4>

                          {checklistTotal > 0 && (
                            <div className="mb-4 relative z-10">
                              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-1.5">
                                <span className="flex items-center gap-1">
                                  <CheckSquare size={12} /> Tarefas
                                </span>
                                <span
                                  className={
                                    progress === 100
                                      ? "text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                      : ""
                                  }
                                >
                                  {checklistDone}/{checklistTotal}
                                </span>
                              </div>
                              <div className="h-1 w-full bg-white/5 backdrop-blur-sm rounded-full overflow-hidden border border-white/5">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-indigo-500"}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10 mt-2">
                            <div className="flex items-center gap-3 text-zinc-500">
                              {task.description && (
                                <div title="Possui descrição">
                                  <AlignLeft
                                    size={14}
                                    className="group-hover:text-zinc-300"
                                  />
                                </div>
                              )}
                              {task.attachments?.length > 0 && (
                                <div
                                  className="flex items-center gap-1 text-[11px] font-medium group-hover:text-zinc-300"
                                  title={`${task.attachments.length} anexos`}
                                >
                                  <Paperclip size={12} />{" "}
                                  {task.attachments.length}
                                </div>
                              )}
                              {task.githubBranch && (
                                <div title={`Branch: ${task.githubBranch}`}>
                                  <GitBranch
                                    size={13}
                                    className="text-indigo-400/80 group-hover:text-indigo-300"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {task.points && (
                                <div className="w-5 h-5 rounded-md bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-300 shadow-sm">
                                  {task.points}
                                </div>
                              )}
                              <div className="flex -space-x-1.5">
                                {assignees.length > 0 ? (
                                  assignees
                                    .slice(0, 3)
                                    .map((a: any, i: number) => (
                                      <img
                                        key={i}
                                        src={
                                          a.photoURL ||
                                          `https://ui-avatars.com/api/?name=${a.name || "User"}&background=1A1A1E&color=fff`
                                        }
                                        className="w-6 h-6 rounded-full border border-[#1A1A1E] object-cover ring-1 ring-white/20 relative z-10 hover:z-20 hover:scale-110 hover:-translate-y-1 transition-all shadow-md"
                                        title={a.name}
                                      />
                                    ))
                                ) : (
                                  <div
                                    className="w-6 h-6 rounded-full border border-white/5 bg-white/5 backdrop-blur-md border-dashed flex items-center justify-center"
                                    title="Sem responsável"
                                  >
                                    <span className="text-[8px] text-zinc-500">
                                      ?
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {columnTasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-zinc-600 bg-white/[0.01] backdrop-blur-sm transition-colors hover:bg-white/[0.03] hover:border-white/20">
                      <span className="text-[10px] font-black uppercase tracking-widest drop-shadow-sm">
                        Soltar aqui
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
    </main>
  );
}
