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
  Plus,
  MoreHorizontal,
  Filter,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  CircleDashed,
  ArrowRightCircle,
  Clock,
  Ban,
  Loader2,
} from "lucide-react";

const KANBAN_COLUMNS = [
  {
    id: "todo",
    title: "A Fazer",
    icon: <CircleDashed size={16} className="text-zinc-500" />,
  },
  {
    id: "in-progress",
    title: "Em Progresso",
    icon: <ArrowRightCircle size={16} className="text-accentPurple" />,
  },
  {
    id: "review",
    title: "Em Revisão",
    icon: <Search size={16} className="text-yellow-500" />,
  },
  {
    id: "done",
    title: "Concluído",
    icon: <CheckCircle2 size={16} className="text-green-500" />,
  },
  {
    id: "blocked",
    title: "Bloqueados",
    icon: <Ban size={16} className="text-red-500" />,
  },
];

export default function QuadrosPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isOverColumn, setIsOverColumn] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProject?.id) return;
    setIsLoading(true);

    const q = query(
      collection(db, "projects", activeProject.id, "tasks"),
      where("target", "==", "sprint"),
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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
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
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", taskId),
          {
            status: newStatus,
          },
        );
      } catch (error) {
        console.error("Erro ao mover:", error);
      }
    }
    setIsOverColumn(null);
  };

  if (!activeProject) return null;

  return (
    <main className="flex-1 flex flex-col h-full z-10 overflow-hidden bg-bgMain">
      {/* Header mais compacto */}
      <header className="h-20 flex flex-col justify-center px-6 shrink-0 border-b border-borderSubtle bg-bgMain/50 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3 text-textPrimary">
              Quadro da Sprint
              <span className="bg-bgSurface border border-borderSubtle text-textSecondary text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                <Clock size={12} className="text-accentPurple" /> Sprint Ativa
              </span>
            </h1>
          </div>
          <button className="bg-accentPurple hover:bg-accentPurpleDark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg">
            <Plus size={14} strokeWidth={3} /> Nova Issue
          </button>
        </div>
      </header>

      {/* Área do Kanban - Sem scroll horizontal desnecessário */}
      <div className="flex-1 overflow-hidden p-6 flex justify-between gap-2">
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Loader2 className="animate-spin text-accentPurple" size={24} />
          </div>
        ) : (
          KANBAN_COLUMNS.map((column, index) => {
            const columnTasks = tasks.filter((t) => t.status === column.id);

            return (
              <React.Fragment key={column.id}>
                <div
                  className={`flex flex-col flex-1 min-w-0 max-w-[280px] rounded-xl transition-all duration-200 ${
                    isOverColumn === column.id
                      ? "bg-accentPurple/5 ring-1 ring-accentPurple/20"
                      : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsOverColumn(column.id);
                  }}
                  onDragLeave={() => setIsOverColumn(null)}
                  onDrop={(e) => onDrop(e, column.id)}
                >
                  {/* Título da Coluna Menor */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-[13px] flex items-center gap-2 text-textPrimary truncate">
                      {column.icon} {column.title}
                      <span className="text-textSecondary text-[10px] font-normal">
                        ({columnTasks.length})
                      </span>
                    </h3>
                  </div>

                  {/* Lista de Cartões */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                    <AnimatePresence mode="popLayout">
                      {columnTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className="bg-bgSurface/50 backdrop-blur-sm p-3.5 rounded-xl border border-borderSubtle/60 hover:border-accentPurple/40 shadow-sm cursor-grab active:cursor-grabbing group"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1">
                              {task.tags
                                ?.slice(0, 2)
                                .map((tag: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accentPurple/10 text-accentPurple border border-accentPurple/20 uppercase tracking-tight"
                                  >
                                    {tag}
                                  </span>
                                )) || (
                                <span className="text-[9px] text-textSecondary uppercase font-bold">
                                  {task.type}
                                </span>
                              )}
                            </div>

                            <h4 className="text-[13px] font-medium text-textPrimary leading-snug line-clamp-2">
                              {task.title}
                            </h4>

                            <div className="flex items-center justify-between pt-2.5 border-t border-borderSubtle/30 mt-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"}`}
                                />
                                <span className="text-[9px] font-mono text-textSecondary uppercase">
                                  {task.key || task.id.slice(0, 4)}
                                </span>
                              </div>
                              <img
                                src={
                                  task.assigneePhoto ||
                                  `https://ui-avatars.com/api/?name=${task.assignee}&background=1c1c21&color=fff`
                                }
                                className="w-5 h-5 rounded-full border border-bgMain"
                                alt="Assignee"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Divisórias Verticais (Gradients) */}
                {index < KANBAN_COLUMNS.length - 1 && (
                  <div className="w-[1px] bg-gradient-to-b from-transparent via-borderSubtle/50 to-transparent shrink-0 h-full mx-1"></div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </main>
  );
}
