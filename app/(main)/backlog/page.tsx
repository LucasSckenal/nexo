"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

// Componentes e Modais
import { SprintModal } from "../../components/modals/SprintModal";
import { EpicModal } from "../../components/modals/EpicModal";
import { TaskModal } from "../../components/modals/TaskModal";

// Constantes
import { DEFAULT_TASK } from "../../constants/backlog";

export default function BacklogPage() {
  const { activeProject } = useData();
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
  const [isSprintOpen, setIsSprintOpen] = useState(true);
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

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

  // --- Listeners Firebase (subcoleções) ---
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

  // Verificar se sprint expirou
  useEffect(() => {
    if (!activeSprint || !activeProject?.id) return;
    const now = new Date();
    const end = new Date(activeSprint.endDate?.seconds * 1000);
    if (now > end && activeSprint.status === "active") {
      updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        {
          status: "completed",
        },
      );
    }
  }, [activeSprint, activeProject]);

  // --- Funções auxiliares (Lógica Original) ---
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
      // Se for um Timestamp do Firebase
      if (timestamp.toDate) {
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(date);
      }

      // Se for uma string (como as gravadas pelo toLocaleDateString)
      if (typeof timestamp === "string") {
        const testDate = new Date(timestamp);
        // Se o JavaScript não conseguir converter (ex: "23/02/2026"), devolvemos a própria string já que está formatada
        if (isNaN(testDate.getTime())) {
          return timestamp;
        }
      }

      // Fallback padrão
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "--/--/----"; // Previne o erro "not finite"

      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch (error) {
      return "--/--/----";
    }
  };

  // --- Funções auxiliares (UI Aesthetic) ---
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

  // --- Drag & Drop ---
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    issue: any,
    source: "sprint" | "backlog",
  ) => {
    setDraggedItem({ issue, source });
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "0.4";
        e.target.style.border = "1px dashed #4F46E5";
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "1";
      e.target.style.border = "none";
      e.target.style.borderBottom = "1px solid rgba(255,255,255,0.03)";
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (
    e: React.DragEvent,
    target: "sprint" | "backlog",
  ) => {
    e.preventDefault();
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
          {
            sprintId: activeSprint.id,
            target: "sprint",
          },
        );
      } else {
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", issue.id),
          {
            sprintId: null,
            target: "backlog",
          },
        );
      }
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    }
    setDraggedItem(null);
  };

  // --- Abertura dos modais ---
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
    setTaskForm({
      ...issue,
      title: issue.title || "",
      description: issue.description || "",
      type: issue.type || "feature",
      epic: issue.epic || "Geral",
      status: issue.status || "todo",
      priority: issue.priority || "medium",
      points: issue.points || 1,
      assignee: issue.assignee || "",
      assigneePhoto: issue.assigneePhoto || "",
      target: issue.target || "backlog",
      branch: issue.branch || "",
      tags: issue.tags || [],
      checklist: issue.checklist || [],
      attachments: issue.attachments || [],
    });
    setIsAssigneeDropdownOpen(false);
    setIsModalOpen(true);
  };

  // --- Handlers de anexos, checklists, tags (Mantidos iguais) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAttachment = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.includes("image") ? "image" : "file",
        url: reader.result as string,
      };
      setTaskForm((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment],
      }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = () => {
    const url = prompt(
      "Insira o URL do link a anexar (ex: https://figma.com/...)",
    );
    if (url && url.trim() !== "") {
      const newAttachment = {
        id: Date.now().toString(),
        name: url,
        type: "link",
        url: url.startsWith("http") ? url : `https://${url}`,
      };
      setTaskForm((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment],
      }));
    }
  };

  const removeAttachment = (id: string) => {
    setTaskForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== id),
    }));
  };

  const handleAddChecklistItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        setTaskForm({
          ...taskForm,
          checklist: [
            ...(taskForm.checklist || []),
            { id: Math.random().toString(), title: value, completed: false },
          ],
        });
        e.currentTarget.value = "";
      }
    }
  };

  const toggleChecklistItem = (id: string) => {
    setTaskForm({
      ...taskForm,
      checklist: (taskForm.checklist || []).map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    });
  };

  const removeChecklistItem = (id: string) => {
    setTaskForm({
      ...taskForm,
      checklist: (taskForm.checklist || []).filter((item) => item.id !== id),
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !(taskForm.tags || []).includes(value)) {
        setTaskForm({ ...taskForm, tags: [...(taskForm.tags || []), value] });
      }
      e.currentTarget.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTaskForm({
      ...taskForm,
      tags: (taskForm.tags || []).filter((tag) => tag !== tagToRemove),
    });
  };

  // --- Handlers de Criação no Firebase ---
  const handleCreateSprint = async (name: string, duration: number) => {
    if (!activeProject?.id || !name.trim()) return;
    if (activeSprint) {
      await updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        { status: "completed" },
      );
    }
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
        const taskRef = doc(
          db,
          "projects",
          activeProject.id,
          "tasks",
          editingId,
        );
        await updateDoc(taskRef, {
          ...taskForm,
          updatedAt: new Date().toLocaleDateString("pt-PT"),
        });
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
          const lastNumber = projectData.lastTaskNumber || 0;
          const nextNumber = lastNumber + 1;
          const formattedKey = `${projectKey}-${nextNumber}`;

          transaction.update(projectRef, { lastTaskNumber: nextNumber });

          const newTaskRef = doc(
            collection(db, "projects", activeProject.id, "tasks"),
          );
          const taskData = {
            ...taskForm,
            taskKey: formattedKey,
            createdAt: serverTimestamp(),
            updatedAt: new Date().toLocaleDateString("pt-PT"),
            projectId: activeProject.id,
          };
          transaction.set(newTaskRef, taskData);

          const activityRef = doc(
            collection(db, "projects", activeProject.id, "activities"),
          );
          transaction.set(activityRef, {
            content: `Criou a issue ${formattedKey}: ${taskForm.title}`,
            userId: auth.currentUser?.uid,
            userName: auth.currentUser?.displayName || "Membro",
            timestamp: serverTimestamp(),
            type: "create",
            taskKey: formattedKey,
          });
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
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
      console.error("Erro ao apagar tarefa: ", error);
    }
  };

  // --- Filtragem ---
  const filteredSprint = sprintIssues.filter(
    (issue) =>
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.taskKey?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredBacklog = backlogIssues.filter(
    (issue) =>
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.taskKey?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

      {/* Background Glows (Estética Premium) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 z-10">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* HEADER DO BACKLOG */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
                <span>{activeProject.name}</span> <ChevronRight size={10} />{" "}
                <span className="text-indigo-400">
                  {activeSprint?.name || "Planeamento"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">
                  Backlog
                </h1>
                <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    {backlogIssues.length + sprintIssues.length} Issues totais
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-4 py-2 rounded-xl border text-[11px] font-bold transition-colors ${showHistory ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.05]"}`}
              >
                Histórico
              </button>
              <button className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">
                Insights
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

          {/* BARRA DE PESQUISA E FILTROS */}
          <div className="flex items-center justify-between bg-[#080808]/60 border border-white/[0.05] rounded-2xl p-2 backdrop-blur-md shadow-lg">
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
              <button className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest">
                <Filter size={12} /> Filtros
              </button>
            </div>

            {/* Avatares na barra de pesquisa */}
            <div className="pr-4 flex -space-x-2">
              {activeProject?.members?.slice(0, 4).map((m: any, i: number) => (
                <img
                  key={i}
                  src={
                    m.photoURL || `https://ui-avatars.com/api/?name=${m.name}`
                  }
                  className="w-7 h-7 rounded-full border border-white/10 grayscale hover:grayscale-0 transition-all cursor-pointer"
                  title={m.name}
                />
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                A carregar planeamento...
              </span>
            </div>
          ) : (
            <>
              {/* CABEÇALHO DA TABELA */}
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

              {/* BLOCO 1: SPRINT ATUAL */}
              {activeSprint && (
                <div
                  className="bg-[#080808]/80 border border-white/[0.05] rounded-[1.8rem] overflow-hidden shadow-2xl relative mb-8"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "sprint")}
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent" />

                  <div className="p-5 px-6 flex items-center justify-between bg-white/[0.02] border-b border-white/[0.05]">
                    <div>
                      <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
                        {activeSprint.name}
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

                  <div className="flex flex-col min-h-[50px]">
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
                          className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] border-b border-white/[0.03] last:border-0 transition-colors group cursor-pointer"
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
                            {task.status === "new" && (
                              <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20">
                                NEW
                              </span>
                            )}
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
                                className="w-7 h-7 rounded-full grayscale group-hover:grayscale-0 transition-all border border-white/10"
                                alt=""
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {filteredSprint.length === 0 && (
                        <div className="py-10 text-center text-zinc-600 text-[11px] font-medium flex flex-col items-center gap-2">
                          <AlertCircle size={20} className="text-zinc-700" />
                          Nenhuma tarefa na Sprint (Arraste do backlog ou crie
                          uma nova).
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* BLOCO 2: BACKLOG DE PRODUTO */}
              <div
                className="bg-[#080808]/80 border border-white/[0.05] rounded-[1.8rem] overflow-hidden shadow-2xl"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "backlog")}
              >
                <div className="p-5 px-6 flex items-center justify-between bg-white/[0.02] border-b border-white/[0.05]">
                  <h3 className="text-[13px] font-bold text-white">
                    Backlog de Produto
                  </h3>
                  <div className="text-[11px] font-bold text-zinc-500">
                    <span>{filteredBacklog.length} issues</span>
                  </div>
                </div>

                <div className="flex flex-col min-h-[50px]">
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
                        className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] border-b border-white/[0.03] last:border-0 transition-colors group cursor-pointer"
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
                              className="w-7 h-7 rounded-full grayscale group-hover:grayscale-0 transition-all border border-white/10"
                              alt=""
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredBacklog.length === 0 && (
                      <div className="py-10 text-center text-zinc-600 text-[11px] font-medium flex flex-col items-center gap-2">
                        <AlertCircle size={20} className="text-zinc-700" />O seu
                        backlog está vazio.
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAIS (MANTIDOS DA ESTRUTURA ORIGINAL) */}
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
