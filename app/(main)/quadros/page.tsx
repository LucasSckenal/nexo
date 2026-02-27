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
  CheckCircle2,
  CircleDashed,
  ArrowRightCircle,
  Clock,
  Ban,
  Loader2,
  GitBranch,
  Sparkles,
  Paperclip,
  CheckSquare,
  Target,
} from "lucide-react";

import { TaskExecutionModal } from "@/app/components/modals/TaskExecutionModal";

const KANBAN_COLUMNS = [
  {
    id: "todo",
    title: "A Fazer",
    icon: <CircleDashed size={14} />,
    color: "zinc",
  },
  {
    id: "in-progress",
    title: "Em Curso",
    icon: <ArrowRightCircle size={14} />,
    color: "indigo",
  },
  { id: "blocked", title: "Bloqueados", icon: <Ban size={14} />, color: "red" },
  {
    id: "review",
    title: "Revisão",
    icon: <Search size={14} />,
    color: "yellow",
  },
  {
    id: "done",
    title: "Concluído",
    icon: <CheckCircle2 size={14} />,
    color: "emerald",
  },
];

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
  const [isOverColumn, setIsOverColumn] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

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
            updatedAt: new Date().toISOString(),
          },
        );

        const statusName =
          KANBAN_COLUMNS.find((c) => c.id === newStatus)?.title || newStatus;
        await addDoc(
          collection(db, "projects", activeProject.id, "activities"),
          {
            content: `Moveu a tarefa "${task.title}" para ${statusName}`,
            userId: auth.currentUser?.uid || "unknown",
            userName: auth.currentUser?.displayName || "Membro",
            userPhoto: auth.currentUser?.photoURL || "",
            timestamp: serverTimestamp(),
            type: "move",
            taskId: taskId,
          },
        );
      } catch (error) {
        console.error(error);
      }
    }
    setIsOverColumn(null);
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-400/5 border-red-400/10";
      case "medium":
        return "text-yellow-400 bg-yellow-400/5 border-yellow-400/10";
      case "low":
        return "text-emerald-400 bg-emerald-400/5 border-emerald-400/10";
      default:
        return "text-zinc-500 bg-zinc-500/5 border-zinc-500/10";
    }
  };

  if (!activeProject) return null;

  const totalSprintTasks = tasks.length;
  const completedSprintTasks = tasks.filter((t) => t.status === "done").length;
  const sprintProgress =
    totalSprintTasks === 0
      ? 0
      : Math.round((completedSprintTasks / totalSprintTasks) * 100);

  return (
    <main className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="shrink-0 border-b border-white/[0.08] bg-[#050505]/80 backdrop-blur-xl px-6 lg:px-10 py-6 flex flex-col md:flex-row md:items-end justify-between gap-6 z-20">
        <div className="flex items-center gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.4em]">
                <Target size={12} />
                <span>Sprint Ativa</span>
              </div>

              {activeSprint?.endDate && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.02] border ${getDaysRemaining(activeSprint.endDate)?.includes("Atrasada") ? "border-red-500/30 text-red-400" : "border-white/[0.05] text-zinc-400"} text-[9px] font-black uppercase tracking-widest`}
                >
                  <Clock size={10} />
                  <span>{getDaysRemaining(activeSprint.endDate)}</span>
                </div>
              )}
            </div>

            <div className="flex items-end gap-6">
              <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
                {activeSprint?.name || "Quadro Kanban"}
              </h1>

              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-1.5 mb-1">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center w-32">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Progresso
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {sprintProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${sprintProgress}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] font-bold text-zinc-600 border-l border-white/10 pl-3">
                  <span className="text-white">{completedSprintTasks}</span> /{" "}
                  {totalSprintTasks}{" "}
                  <span className="text-zinc-500">Tarefas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="px-5 py-2 rounded-xl bg-indigo-600 text-[11px] font-black text-white hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2 mb-1">
          <Plus size={16} strokeWidth={3} />
          NOVA TAREFA
        </button>
      </header>

      <div className="flex-1 overflow-x-auto flex px-6 lg:px-10 py-8 gap-0 w-full justify-between custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : (
          KANBAN_COLUMNS.map((column, idx) => (
            <React.Fragment key={column.id}>
              <div
                className={`flex flex-col flex-1 min-w-[280px] max-w-[320px] px-4 transition-all duration-500 ${isOverColumn === column.id ? "bg-white/[0.02] rounded-3xl" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsOverColumn(column.id);
                }}
                onDragLeave={() => setIsOverColumn(null)}
                onDrop={(e) => onDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-${column.color}-400 opacity-80`}>
                      {column.icon}
                    </span>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      {column.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-700 bg-white/[0.02] border border-white/[0.05] px-2 py-0.5 rounded-md">
                    {tasks.filter((t) => t.status === column.id).length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-10">
                  <AnimatePresence mode="popLayout">
                    {tasks
                      .filter((t) => t.status === column.id)
                      .map((task) => {
                        const totalSubtasks = task.checklist?.length || 0;
                        const completedSubtasks =
                          task.checklist?.filter((c: any) => c.completed)
                            .length || 0;
                        const isAllCompleted =
                          totalSubtasks > 0 &&
                          totalSubtasks === completedSubtasks;

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            draggable
                            onDragStart={(e) =>
                              e.dataTransfer.setData("taskId", task.id)
                            }
                            onClick={() => setSelectedTask(task)}
                            className="group bg-[#0A0A0A] border border-white/[0.1] hover:border-indigo-500/50 p-5 rounded-[1.8rem] cursor-grab active:cursor-grabbing transition-all duration-300 shadow-md hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[9px] font-bold text-zinc-600 tracking-widest">
                                {task.taskKey || "TASK"}
                              </span>
                              <div
                                className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${getPriorityStyles(task.priority)}`}
                              >
                                {task.priority}
                              </div>
                            </div>

                            <h4 className="text-[13px] font-bold text-zinc-300 leading-snug mb-4 group-hover:text-white transition-colors">
                              {task.title}
                            </h4>

                            {task.branch && (
                              <div className="mb-4">
                                <div className="inline-flex items-center gap-1.5 bg-indigo-500/5 border border-indigo-500/20 px-2 py-1 rounded-md text-indigo-400">
                                  <GitBranch size={10} />
                                  <span className="text-[9px] font-mono font-bold tracking-wider truncate max-w-[150px]">
                                    {task.branch}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                              <div className="flex items-center gap-3 text-zinc-600">
                                {task.points && (
                                  <span className="text-[10px] font-black">
                                    {task.points}pts
                                  </span>
                                )}

                                {task.attachmentsCount > 0 && (
                                  <Paperclip size={12} />
                                )}

                                {totalSubtasks > 0 && (
                                  <div
                                    className={`flex items-center gap-1 ${isAllCompleted ? "text-emerald-500" : "text-zinc-500"}`}
                                  >
                                    <CheckSquare size={12} />
                                    <span className="text-[10px] font-black">
                                      {completedSubtasks}/{totalSubtasks}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex -space-x-2">
                                {task.assignees ? (
                                  task.assignees.map((a: any, i: number) => (
                                    <img
                                      key={i}
                                      src={a.photo}
                                      className="w-6 h-6 rounded-full border border-[#080808] grayscale group-hover:grayscale-0 transition-all duration-500 object-cover"
                                      alt=""
                                      title={a.name}
                                    />
                                  ))
                                ) : (
                                  <img
                                    src={
                                      task.assigneePhoto ||
                                      `https://ui-avatars.com/api/?name=${task.assignee}&background=0D0D0D&color=fff`
                                    }
                                    className="w-6 h-6 rounded-full border border-[#080808] grayscale group-hover:grayscale-0 transition-all duration-500"
                                    alt=""
                                  />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              </div>

              {idx < KANBAN_COLUMNS.length - 1 && (
                <div className="w-px h-full bg-gradient-to-b from-transparent via-white/[0.1] to-transparent shrink-0" />
              )}
            </React.Fragment>
          ))
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