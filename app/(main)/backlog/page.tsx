"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // NOVO IMPORT
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  Plus,
  Loader2,
  Search,
  MessageSquare,
  GitBranch,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  CircleDashed,
  Calendar,
  ArrowRight,
  AlertCircle,
  Edit2,
  Trash2,
  PlayCircle,
  Archive,
  History,
  Lightbulb,
  X,
  PieChart,
  BarChart3,
  ListChecks,
  Check, // NOVO IMPORT
} from "lucide-react";

// Componentes e Modais
import { SprintModal } from "../../components/modals/SprintModal";
import { EpicModal } from "../../components/modals/EpicModal";
import { TaskModal } from "../../components/modals/TaskModal";

// Constantes
import { DEFAULT_TASK } from "../../constants/backlog";

export default function BacklogPage() {
  const { activeProject } = useData();
  const router = useRouter(); // NOVO: Inicializa o router
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Estados dos Dados ---
  const [sprintIssues, setSprintIssues] = useState<any[]>([]);
  const [backlogIssues, setBacklogIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sprints, setSprints] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any | null>(null);
  const [epics, setEpics] = useState<any[]>([]);

  // --- Estados da UI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // --- NOVOS ESTADOS DE FILTRO ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // --- Estados dos Modais ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState(DEFAULT_TASK);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);

  // --- Drag state ---
  const [draggedItem, setDraggedItem] = useState<{
    issue: any;
    source: "sprint" | "backlog";
  } | null>(null);
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [dragOverArea, setDragOverArea] = useState<"sprint" | "backlog" | null>(
    null,
  );

  // --- Context Menu State ---
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [contextMenuTask, setContextMenuTask] = useState<any | null>(null);

  // Fechar o menu de contexto ao clicar fora
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      // setIsFilterOpen(false); // Pode adicionar isto se quiser fechar os filtros ao clicar fora
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // --- Listeners Firebase ---
  useEffect(() => {
    if (!activeProject?.id) {
      setSprintIssues([]);
      setBacklogIssues([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "projects", activeProject.id, "tasks"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSprintIssues(
        tasksData.filter((t: any) => t.sprintId === activeSprint?.id),
      );
      setBacklogIssues(tasksData.filter((t: any) => t.target === "backlog"));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeProject, activeSprint]);

  useEffect(() => {
    if (!activeProject?.id) return;
    const q = query(
      collection(db, "projects", activeProject.id, "epics"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEpics(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject?.id) return;
    const q = query(
      collection(db, "projects", activeProject.id, "sprints"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSprints(data);
      const active = data.find((s: any) => s.status === "active");
      setActiveSprint(active || null);
    });
    return () => unsubscribe();
  }, [activeProject]);

  useEffect(() => {
    if (!activeSprint || !activeProject?.id) return;
    const now = new Date();
    const end = new Date(activeSprint.endDate?.seconds * 1000);
    if (now > end && activeSprint.status === "active") {
      updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        { status: "completed" },
      );
    }
  }, [activeSprint, activeProject]);

  // --- Funções auxiliares ---
  const getSprintCountdown = (endDate: any) => {
    if (!endDate) return "-- restantes";
    const now = new Date();
    const end = new Date(endDate?.seconds * 1000);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Finalizada";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h restantes`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "--/--/----";
    try {
      if (timestamp.toDate)
        return new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(timestamp.toDate());
      if (typeof timestamp === "string" && isNaN(new Date(timestamp).getTime()))
        return timestamp;
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "--/--/----";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return "--/--/----";
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
      case "critical":
        return "text-red-400 bg-red-400/5 border-red-400/10";
      case "medium":
        return "text-yellow-400 bg-yellow-400/5 border-yellow-400/10";
      case "low":
        return "text-emerald-400 bg-emerald-400/5 border-emerald-400/10";
      default:
        return "text-zinc-500 bg-zinc-500/5 border-zinc-500/10";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "done")
      return <CheckCircle2 size={12} className="text-emerald-500" />;
    if (status === "in-progress" || status === "review")
      return <ArrowRight size={12} className="text-indigo-400" />;
    return <CircleDashed size={12} className="text-zinc-400" />;
  };

  // --- Redirecionamento de Perfil ---
  const handleProfileClick = (identifier: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!identifier) return;
    // Assume que a rota seja /membros/[email] ou /perfil/[id]
    router.push(`/membros/${encodeURIComponent(identifier)}`);
  };

  // --- Funções de Filtro ---
  const togglePriorityFilter = (p: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const toggleAssigneeFilter = (a: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const clearFilters = () => {
    setSelectedPriorities([]);
    setSelectedAssignees([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedPriorities.length > 0 ||
    selectedAssignees.length > 0 ||
    searchQuery.trim() !== "";

  const filterTask = (task: any) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskKey?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      selectedPriorities.length === 0 ||
      selectedPriorities.includes(task.priority?.toLowerCase());
    const matchesAssignee =
      selectedAssignees.length === 0 ||
      selectedAssignees.includes(task.assignee);
    return matchesSearch && matchesPriority && matchesAssignee;
  };

  const filteredSprint = sprintIssues.filter(filterTask);
  const filteredBacklog = backlogIssues.filter(filterTask);

  // --- Drag & Drop e Context Menu ---
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    issue: any,
    source: "sprint" | "backlog",
  ) => {
    setDraggedItem({ issue, source });
    setIsDraggingTask(true);
    setTimeout(() => {
      if (e.target instanceof HTMLElement) e.target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDraggingTask(false);
    setDragOverArea(null);
    setDraggedItem(null);
    if (e.target instanceof HTMLElement) e.target.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (
    e: React.DragEvent,
    target: "sprint" | "backlog",
  ) => {
    e.preventDefault();
    setIsDraggingTask(false);
    setDragOverArea(null);
    if (!draggedItem || !activeProject?.id) return;
    const { issue } = draggedItem;
    try {
      if (target === "sprint") {
        if (!activeSprint) {
          alert("Crie uma sprint antes de mover tarefas.");
          return;
        }
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", issue.id),
          { sprintId: activeSprint.id, target: "sprint" },
        );
      } else {
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", issue.id),
          { sprintId: null, target: "backlog" },
        );
      }
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, task: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setContextMenuTask(task);
  };

  const contextMenuMoveToSprint = async () => {
    if (!contextMenuTask || !activeProject?.id) return;
    if (!activeSprint) {
      alert("Crie ou ative uma sprint primeiro!");
      return;
    }
    await updateDoc(
      doc(db, "projects", activeProject.id, "tasks", contextMenuTask.id),
      { sprintId: activeSprint.id, target: "sprint" },
    );
  };

  const contextMenuMoveToBacklog = async () => {
    if (!contextMenuTask || !activeProject?.id) return;
    await updateDoc(
      doc(db, "projects", activeProject.id, "tasks", contextMenuTask.id),
      { sprintId: null, target: "backlog" },
    );
  };

  const contextMenuDeleteTask = async () => {
    if (!contextMenuTask || !activeProject?.id) return;
    if (
      !confirm(
        `Tem certeza que deseja apagar a tarefa ${contextMenuTask.taskKey}?`,
      )
    )
      return;
    await deleteDoc(
      doc(db, "projects", activeProject.id, "tasks", contextMenuTask.id),
    );
  };

  // --- Modal Openers ---
  const openCreateModal = () => {
    if (!activeProject?.id) {
      alert("Por favor, selecione um projeto primeiro.");
      return;
    }
    setEditingId(null);
    setTaskForm({
      ...DEFAULT_TASK,
      target: "backlog",
      sprintId: null,
      assignee: activeProject?.members?.[0]?.name || "Agente",
      assigneePhoto: activeProject?.members?.[0]?.photoURL || "",
    });
    setIsAssigneeDropdownOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (issue: any) => {
    setEditingId(issue.id);
    setTaskForm({ ...issue });
    setIsAssigneeDropdownOpen(false);
    setIsModalOpen(true);
  };

  // Handlers omitidos por simplicidade para o arquivo (mantêm-se os padrões)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    /* ... */
  };
  const handleAddLink = () => {
    /* ... */
  };
  const removeAttachment = (id: string) => {
    /* ... */
  };
  const handleAddChecklistItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    /* ... */
  };
  const toggleChecklistItem = (id: string) => {
    /* ... */
  };
  const removeChecklistItem = (id: string) => {
    /* ... */
  };
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    /* ... */
  };
  const removeTag = (tagToRemove: string) => {
    /* ... */
  };

  const handleCreateSprint = async (name: string, duration: number) => {
    if (!activeProject?.id || !name.trim()) return;
    if (activeSprint)
      await updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        { status: "completed" },
      );
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);
    await addDoc(collection(db, "projects", activeProject.id, "sprints"), {
      name,
      startDate,
      endDate,
      status: "active",
      createdAt: serverTimestamp(),
    });
  };

  const handleCreateEpic = async (name: string, color: string) => {
    if (!activeProject?.id || !name.trim()) return;
    await addDoc(collection(db, "projects", activeProject.id, "epics"), {
      name,
      color,
      createdAt: serverTimestamp(),
      status: "active",
    });
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !activeProject?.id) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", editingId),
          { ...taskForm, updatedAt: new Date().toLocaleDateString("pt-BR") },
        );
      } else {
        await runTransaction(db, async (transaction) => {
          const projectRef = doc(db, "projects", activeProject.id);
          const projectDoc = await transaction.get(projectRef);
          if (!projectDoc.exists()) throw "Projeto não encontrado!";
          const projectData = projectDoc.data();
          const projectKey = (projectData.name || "TASK").replace(
            /[^a-zA-Z0-9]/g,
            "",
          );
          const nextNumber = (projectData.lastTaskNumber || 0) + 1;
          transaction.update(projectRef, { lastTaskNumber: nextNumber });
          const newTaskRef = doc(
            collection(db, "projects", activeProject.id, "tasks"),
          );
          transaction.set(newTaskRef, {
            ...taskForm,
            taskKey: `${projectKey}-${nextNumber}`,
            createdAt: serverTimestamp(),
            projectId: activeProject.id,
          });
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingId || !activeProject?.id) return;
    try {
      await deleteDoc(
        doc(db, "projects", activeProject.id, "tasks", editingId),
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Lógica dos Insights
  const totalIssues = sprintIssues.length + backlogIssues.length;
  const highPriority = [...sprintIssues, ...backlogIssues].filter(
    (i) => i.priority === "high" || i.priority === "critical",
  ).length;
  const completedIssues = [...sprintIssues, ...backlogIssues].filter(
    (i) => i.status === "done",
  ).length;

  if (!activeProject) return null;

  return (
    <main className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* MENU DE CONTEXTO (RIGHT CLICK) */}
      <AnimatePresence>
        {contextMenu && contextMenuTask && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-[9999] w-48 bg-[#121214]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1.5 overflow-hidden flex flex-col"
          >
            <button
              onClick={() => {
                openEditModal(contextMenuTask);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Edit2 size={14} className="text-zinc-500" /> Editar Tarefa
            </button>
            {contextMenuTask.target === "backlog" ? (
              <button
                onClick={() => {
                  contextMenuMoveToSprint();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <PlayCircle size={14} className="text-indigo-400" /> Mover p/
                Sprint
              </button>
            ) : (
              <button
                onClick={() => {
                  contextMenuMoveToBacklog();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Archive size={14} className="text-amber-400" /> Mover p/
                Backlog
              </button>
            )}
            <div className="h-px w-full bg-white/10 my-1" />
            <button
              onClick={() => {
                contextMenuDeleteTask();
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} /> Apagar Tarefa
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 z-10">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
                <span>{activeProject.name}</span> <ChevronRight size={10} />{" "}
                <span className="text-indigo-400">
                  {activeSprint?.name || "Planejamento"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">
                  Backlog
                </h1>
                <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    {totalIssues} Issues totais
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowHistory(true);
                  setShowInsights(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-2"
              >
                <History size={14} /> Histórico
              </button>
              <button
                onClick={() => {
                  setShowInsights(true);
                  setShowHistory(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-2"
              >
                <Lightbulb size={14} /> Insights
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={() => setIsSprintModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-black text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Plus size={14} /> Nova Sprint
              </button>
              <button
                onClick={openCreateModal}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-[11px] font-black text-white hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2"
              >
                Criar Issue
              </button>
            </div>
          </header>

          <div className="flex items-center justify-between bg-[#080808]/60 border border-white/[0.05] z-[60] rounded-2xl p-2 backdrop-blur-md shadow-lg relative">
            <div className="flex items-center flex-1">
              <div className="relative flex-1 max-w-md flex items-center group">
                <Search
                  size={14}
                  className="absolute left-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Pesquisar por título, ID ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-[12px] text-zinc-300 pl-10 pr-4 py-2 outline-none placeholder:text-zinc-600 focus:ring-0"
                />
              </div>
              <div className="w-px h-6 bg-white/10 mx-2" />

              {/* --- BOTÃO E MENU DE FILTROS --- */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFilterOpen(!isFilterOpen);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors rounded-lg ${hasActiveFilters ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
                >
                  <Filter size={12} /> Filtros{" "}
                  {hasActiveFilters && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full mt-2 left-0 w-64 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold text-white">
                          Filtrar Tarefas
                        </span>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors font-bold uppercase"
                          >
                            Limpar
                          </button>
                        )}
                      </div>

                      {/* Filtro Prioridade */}
                      <div className="z-index-[100]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 block">
                          Prioridade
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {["low", "medium", "high", "critical"].map((p) => (
                            <button
                              key={p}
                              onClick={() => togglePriorityFilter(p)}
                              className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${selectedPriorities.includes(p) ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-transparent text-zinc-500 border-white/10 hover:border-white/20"}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtro Responsável */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 block">
                          Responsável
                        </span>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {activeProject?.members?.map((m: any) => (
                            <button
                              key={m.email || m.name}
                              onClick={() => toggleAssigneeFilter(m.name)}
                              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5 transition-colors group"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    m.photoURL ||
                                    `https://ui-avatars.com/api/?name=${m.name}`
                                  }
                                  className="w-5 h-5 rounded-full"
                                  alt=""
                                />
                                <span
                                  className={`text-[11px] ${selectedAssignees.includes(m.name) ? "text-indigo-400 font-bold" : "text-zinc-400 group-hover:text-white"}`}
                                >
                                  {m.name}
                                </span>
                              </div>
                              {selectedAssignees.includes(m.name) && (
                                <Check size={12} className="text-indigo-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* FOTOS DA EQUIPE NO TOPO COM REDIRECIONAMENTO */}
            <div className="pr-4 flex -space-x-2">
              {activeProject?.members?.slice(0, 4).map((m: any, i: number) => (
                <img
                  key={i}
                  src={
                    m.photoURL || `https://ui-avatars.com/api/?name=${m.name}`
                  }
                  onClick={() => handleProfileClick(m.email || m.name)}
                  className="w-7 h-7 rounded-full border border-white/10 grayscale hover:grayscale-0 transition-all cursor-pointer hover:z-10 hover:scale-110"
                  title={`Ver perfil de ${m.name}`}
                />
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                A carregar planejamento...
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-8 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] sticky top-0 z-20 backdrop-blur-md bg-[#050505]/80 rounded-lg">
                <div className="flex gap-14 pl-6">
                  <span className="w-16">Tipo / ID</span>
                  <span>Detalhes da Issue</span>
                </div>
                <div className="flex gap-8 text-right pr-6">
                  <span className="w-20">Interação</span>
                  <span className="w-20">Atualizado</span>
                  <span className="w-12 text-center">Prior</span>
                  <span className="w-10 text-center">Pts</span>
                  <span className="w-10 text-center">Resp</span>
                </div>
              </div>

              {/* BLOCO SPRINT */}
              {activeSprint && (
                <div
                  className={`border rounded-[1.8rem] overflow-hidden relative mb-8 transition-all duration-300 ${dragOverArea === "sprint" ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.2)]" : isDraggingTask ? "bg-[#080808]/80 border-dashed border-white/20" : "bg-[#080808]/80 border-white/[0.05] shadow-2xl"}`}
                  onDragEnter={() => setDragOverArea("sprint")}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "sprint")}
                >
                  {!isDraggingTask && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent" />
                  )}
                  <div
                    className={`p-5 px-6 flex items-center justify-between border-b transition-colors ${dragOverArea === "sprint" ? "bg-indigo-500/20 border-indigo-500/30" : "bg-white/[0.02] border-white/[0.05]"}`}
                  >
                    <div>
                      <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
                        {activeSprint.name}{" "}
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                          Active
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-medium mt-1">
                        {getSprintCountdown(activeSprint.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-500">
                      <span>{filteredSprint.length} issues</span>
                      <span className="px-2 py-1 bg-white/[0.03] rounded-md border border-white/5 text-zinc-300">
                        {filteredSprint.reduce(
                          (acc, task) => acc + (Number(task.points) || 0),
                          0,
                        )}{" "}
                        pts
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col min-h-[50px] relative z-10">
                    <AnimatePresence>
                      {filteredSprint.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          draggable
                          onDragStart={(e: any) =>
                            handleDragStart(e, task, "sprint")
                          }
                          onDragEnd={handleDragEnd}
                          onClick={() => openEditModal(task)}
                          onContextMenu={(e) => handleContextMenu(e, task)}
                          className={`flex items-center justify-between px-6 py-4 border-b last:border-0 transition-colors group cursor-pointer ${draggedItem?.issue?.id === task.id ? "bg-white/5 border-indigo-500/30 ring-1 ring-indigo-500/50" : "hover:bg-white/[0.02] border-white/[0.03]"}`}
                        >
                          <div className="flex items-center gap-4">
                            <GripVertical
                              size={14}
                              className="text-zinc-700 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            <div
                              className={`w-6 h-6 rounded-lg ${task.status === "done" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-800/50 border-zinc-700"} border flex items-center justify-center shrink-0`}
                            >
                              {getStatusIcon(task.status)}
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500 w-12">
                              {task.taskKey || "TASK"}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/[0.03] text-zinc-400 rounded-md border border-white/5 truncate max-w-[80px]">
                              {task.epic || "Geral"}
                            </span>
                            <span className="text-[13px] font-semibold text-zinc-200 group-hover:text-white transition-colors truncate max-w-[300px]">
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-8 text-[11px]">
                            <div className="flex items-center gap-4 w-20">
                              {task.branch && (
                                <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 truncate">
                                  <GitBranch size={10} /> {task.branch}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-600 w-12">
                              <MessageSquare size={12} />{" "}
                              {task.commentsCount || 0}
                            </div>
                            <div className="text-zinc-600 font-mono text-[10px] w-20 flex items-center gap-1.5 truncate">
                              <Calendar size={10} />{" "}
                              {formatDate(task.updatedAt || task.createdAt)}
                            </div>
                            <div className="w-12 flex justify-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getPriorityStyles(task.priority)}`}
                              >
                                {task.priority || "Low"}
                              </span>
                            </div>
                            <div className="w-10 flex justify-center">
                              <span
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold border ${task.points ? "bg-zinc-800/50 text-zinc-400 border-zinc-700" : "bg-transparent border-dashed border-zinc-700 text-zinc-600"}`}
                              >
                                {task.points || "-"}
                              </span>
                            </div>
                            <div className="w-10 flex justify-end">
                              <img
                                src={
                                  task.assigneePhoto ||
                                  `https://ui-avatars.com/api/?name=${task.assignee || "U"}&background=0D0D0D&color=fff`
                                }
                                className="w-7 h-7 rounded-full grayscale group-hover:grayscale-0 transition-all border border-white/10 hover:scale-110"
                                alt=""
                                title={`Ver perfil de ${task.assignee}`}
                                onClick={(e) =>
                                  handleProfileClick(task.assignee, e)
                                }
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {filteredSprint.length === 0 && (
                        <div className="py-10 text-center text-zinc-600 text-[11px] font-medium flex flex-col items-center gap-2 pointer-events-none">
                          <AlertCircle size={20} className="text-zinc-700" />{" "}
                          Nenhuma tarefa encontrada.
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* BLOCO BACKLOG */}
              <div
                className={`border rounded-[1.8rem] overflow-hidden transition-all duration-300 ${dragOverArea === "backlog" ? "bg-white/5 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]" : isDraggingTask ? "bg-[#080808]/80 border-dashed border-white/20" : "bg-[#080808]/80 border-white/[0.05] shadow-2xl"}`}
                onDragEnter={() => setDragOverArea("backlog")}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "backlog")}
              >
                <div
                  className={`p-5 px-6 flex items-center justify-between border-b transition-colors ${dragOverArea === "backlog" ? "bg-white/10 border-white/10" : "bg-white/[0.02] border-white/[0.05]"}`}
                >
                  <h3 className="text-[13px] font-bold text-white">
                    Backlog de Produto
                  </h3>
                  <div className="text-[11px] font-bold text-zinc-500">
                    <span>{filteredBacklog.length} issues</span>
                  </div>
                </div>
                <div className="flex flex-col min-h-[50px] relative z-10">
                  <AnimatePresence>
                    {filteredBacklog.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        draggable
                        onDragStart={(e: any) =>
                          handleDragStart(e, task, "backlog")
                        }
                        onDragEnd={handleDragEnd}
                        onClick={() => openEditModal(task)}
                        onContextMenu={(e) => handleContextMenu(e, task)}
                        className={`flex items-center justify-between px-6 py-4 border-b last:border-0 transition-colors group cursor-pointer ${draggedItem?.issue?.id === task.id ? "bg-white/5 border-indigo-500/30 ring-1 ring-indigo-500/50" : "hover:bg-white/[0.02] border-white/[0.03]"}`}
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical
                            size={14}
                            className="text-zinc-700 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <div
                            className={`w-6 h-6 rounded-lg ${task.status === "done" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-800/50 border-zinc-700"} border flex items-center justify-center shrink-0`}
                          >
                            {getStatusIcon(task.status)}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500 w-12">
                            {task.taskKey || "TASK"}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/[0.03] text-zinc-400 rounded-md border border-white/5 truncate max-w-[80px]">
                            {task.epic || "Geral"}
                          </span>
                          <span className="text-[13px] font-semibold text-zinc-200 group-hover:text-white transition-colors truncate max-w-[300px]">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-8 text-[11px]">
                          <div className="w-20"></div>
                          <div className="flex items-center gap-1.5 text-zinc-600 w-12">
                            <MessageSquare size={12} />{" "}
                            {task.commentsCount || 0}
                          </div>
                          <div className="text-zinc-600 font-mono text-[10px] w-20 flex items-center gap-1.5 truncate">
                            <Calendar size={10} />{" "}
                            {formatDate(task.updatedAt || task.createdAt)}
                          </div>
                          <div className="w-12 flex justify-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getPriorityStyles(task.priority)}`}
                            >
                              {task.priority || "Low"}
                            </span>
                          </div>
                          <div className="w-10 flex justify-center">
                            <span
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold border ${task.points ? "bg-zinc-800/50 text-zinc-400 border-zinc-700" : "bg-transparent border-dashed border-zinc-700 text-zinc-600"}`}
                            >
                              {task.points || "-"}
                            </span>
                          </div>
                          <div className="w-10 flex justify-end">
                            <img
                              src={
                                task.assigneePhoto ||
                                `https://ui-avatars.com/api/?name=${task.assignee || "U"}&background=0D0D0D&color=fff`
                              }
                              className="w-7 h-7 rounded-full grayscale group-hover:grayscale-0 transition-all border border-white/10 hover:scale-110"
                              alt=""
                              title={`Ver perfil de ${task.assignee}`}
                              onClick={(e) =>
                                handleProfileClick(task.assignee, e)
                              }
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredBacklog.length === 0 && (
                      <div className="py-10 text-center text-zinc-600 text-[11px] font-medium flex flex-col items-center gap-2 pointer-events-none">
                        <AlertCircle size={20} className="text-zinc-700" />{" "}
                        Nenhuma tarefa encontrada.
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- SIDEBARS (HISTÓRICO E INSIGHTS) --- */}
      <AnimatePresence>
        {(showHistory || showInsights) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHistory(false);
                setShowInsights(false);
              }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#0A0A0A] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  {showHistory ? (
                    <>
                      <History size={18} className="text-indigo-400" />{" "}
                      Histórico de Sprints
                    </>
                  ) : (
                    <>
                      <Lightbulb size={18} className="text-amber-400" />{" "}
                      Insights do Projeto
                    </>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setShowInsights(false);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {showHistory && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {sprints.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center mt-10">
                      Nenhuma Sprint registrada ainda.
                    </p>
                  ) : (
                    sprints.map((sprint) => (
                      <div
                        key={sprint.id}
                        className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-white">
                            {sprint.name}
                          </h4>
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${sprint.status === "active" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                          >
                            {sprint.status === "active"
                              ? "Em curso"
                              : "Concluída"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Calendar size={12} /> {formatDate(sprint.startDate)}{" "}
                          — {formatDate(sprint.endDate)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {showInsights && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex flex-col">
                      <ListChecks size={20} className="text-indigo-400 mb-2" />
                      <span className="text-2xl font-black text-white">
                        {totalIssues}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        Total de Tarefas
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col">
                      <CheckCircle2
                        size={20}
                        className="text-emerald-400 mb-2"
                      />
                      <span className="text-2xl font-black text-white">
                        {completedIssues}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        Tarefas Concluídas
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <PieChart size={14} /> Progresso Geral
                    </h4>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-1000"
                        style={{
                          width: `${totalIssues === 0 ? 0 : (completedIssues / totalIssues) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-zinc-400">
                      <span>0%</span>
                      <span>
                        {totalIssues === 0
                          ? "0"
                          : Math.round((completedIssues / totalIssues) * 100)}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BarChart3 size={14} /> Volume de Prioridade Alta
                    </h4>
                    <div className="flex items-end gap-4 h-24 border-b border-white/10 pb-2">
                      <div
                        className="w-12 bg-red-500/80 rounded-t-md transition-all duration-1000 relative group"
                        style={{
                          height: `${totalIssues === 0 ? 0 : Math.max(10, (highPriority / totalIssues) * 100)}%`,
                        }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {highPriority}
                        </span>
                      </div>
                      <div
                        className="w-12 bg-zinc-700 rounded-t-md transition-all duration-1000 relative group"
                        style={{
                          height: `${totalIssues === 0 ? 0 : Math.max(10, ((totalIssues - highPriority) / totalIssues) * 100)}%`,
                        }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {totalIssues - highPriority}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-[10px] font-bold text-zinc-500 uppercase">
                      <span className="w-12 text-center text-red-400">
                        Alta
                      </span>
                      <span className="w-12 text-center">Normal</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onCreate={handleCreateSprint}
        activeSprint={activeSprint}
      />
      <EpicModal
        isOpen={isEpicModalOpen}
        onClose={() => setIsEpicModalOpen(false)}
        onCreate={handleCreateEpic}
      />
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        editingId={editingId}
        isSaving={isSaving}
        epics={epics}
        activeProject={activeProject}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        handleAddLink={handleAddLink}
        removeAttachment={removeAttachment}
        handleAddChecklistItem={handleAddChecklistItem}
        toggleChecklistItem={toggleChecklistItem}
        removeChecklistItem={removeChecklistItem}
        handleAddTag={handleAddTag}
        removeTag={removeTag}
        isAssigneeDropdownOpen={isAssigneeDropdownOpen}
        setIsAssigneeDropdownOpen={setIsAssigneeDropdownOpen}
        onOpenEpicModal={() => setIsEpicModalOpen(true)}
      />
    </main>
  );
}
