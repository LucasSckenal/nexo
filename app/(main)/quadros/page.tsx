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
} from "lucide-react";

import { TaskModal } from "../../components/modals/TaskModal";

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

  return (
    <main className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="h-20 shrink-0 border-b border-white/[0.04] bg-[#050505]/60 backdrop-blur-xl px-10 flex items-center justify-between z-20">
        <div className="flex items-center gap-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-[9px] uppercase tracking-[0.4em]">
              <Sparkles size={12} className="animate-pulse" />
              <span>Workspace Pipeline</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {activeSprint?.name || "Kanban Board"}
            </h1>
          </div>
        </div>
        <button className="bg-white text-black text-[11px] font-black px-6 py-2.5 rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2">
          <Plus size={14} strokeWidth={3} />
          NOVA TAREFA
        </button>
      </header>

      {/* Ajustado: w-full e justify-between para eliminar o espaço vazio na direita */}
      <div className="flex-1 overflow-x-auto flex p-8 gap-0 w-full justify-between custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-500" />
          </div>
        ) : (
          KANBAN_COLUMNS.map((column, idx) => (
            <React.Fragment key={column.id}>
              <div
                className={`flex flex-col flex-1 min-w-[280px] max-w-[320px] px-4 transition-all duration-500 ${isOverColumn === column.id ? "bg-white/[0.01]" : ""}`}
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
                      .map((task) => (
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
                          className="group bg-[#080808]/80 border border-white/[0.05] hover:border-purple-500/20 p-5 rounded-[1.8rem] cursor-grab active:cursor-grabbing transition-all duration-300 shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
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
                          <h4 className="text-[13px] font-bold text-zinc-300 leading-snug mb-5 group-hover:text-white transition-colors">
                            {task.title}
                          </h4>
                          <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                            <div className="flex items-center gap-3 text-zinc-600">
                              {task.points && (
                                <span className="text-[10px] font-black">
                                  {task.points}pts
                                </span>
                              )}
                              {task.branch && <GitBranch size={12} />}
                              {task.attachmentsCount > 0 && (
                                <Paperclip size={12} />
                              )}
                            </div>
                            <img
                              src={
                                task.assigneePhoto ||
                                `https://ui-avatars.com/api/?name=${task.assignee}&background=0D0D0D&color=fff`
                              }
                              className="w-6 h-6 rounded-full border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-500"
                              alt=""
                            />
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>

              {idx < KANBAN_COLUMNS.length - 1 && (
                <div className="w-px h-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent shrink-0" />
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {selectedTask && (
        <TaskModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskForm={selectedTask}
          setTaskForm={() => {}}
          onSave={() => {}}
          onDelete={() => {}}
          editingId={null}
          isSaving={false}
          epics={[]}
          activeProject={activeProject}
          fileInputRef={null}
          handleFileUpload={() => {}}
          handleAddLink={() => {}}
          removeAttachment={() => {}}
          handleAddChecklistItem={() => {}}
          toggleChecklistItem={() => {}}
          removeChecklistItem={() => {}}
          handleAddTag={() => {}}
          removeTag={() => {}}
          isAssigneeDropdownOpen={false}
          setIsAssigneeDropdownOpen={() => {}}
        />
      )}
    </main>
  );
}
