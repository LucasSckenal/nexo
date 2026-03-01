// page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useData } from "../context/DataContext";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  AlertTriangle,
  CheckSquare,
  Calendar,
  Users,
  FolderPlus,
  Activity,
  LayoutPanelLeft,
  Plus,
  Trash2,
  Circle,
  User,
  LogOut,
  ChevronRight,
  Search,
  Filter,
  Check,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";

export default function DashboardPage() {
  const { activeProject } = useData();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const user = auth.currentUser;

  // Estados de Filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Fechar o menu de filtros ao clicar fora
  useEffect(() => {
    const handleClick = () => setIsFilterOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    if (hour >= 18 && hour < 22) return "Boa noite";
    return "Boa madrugada";
  };

  const currentDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Agora";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return "Recente";
    }
  };

  const handleSignOut = () => {
    signOut(auth).catch((error) =>
      console.error("Erro ao terminar sessão", error),
    );
  };

  useEffect(() => {
    if (!activeProject?.id) return;

    const qTasks = query(
      collection(db, "projects", activeProject.id, "tasks"),
      orderBy("createdAt", "desc"),
    );
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const qActivities = query(
      collection(db, "projects", activeProject.id, "activities"),
      orderBy("timestamp", "desc"),
      limit(10),
    );
    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      setActivities(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });

    return () => {
      unsubTasks();
      unsubActivities();
    };
  }, [activeProject?.id]);

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const criticalTasks = tasks.filter(
    (t) => t.priority === "critical" && t.status !== "done",
  );

  // Lógica de Filtragem
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

  const filteredTasks = activeTasks.filter((task) => {
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
  });

  return (
    <motion.main
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex-1 flex flex-col h-full bg-bgMain text-textPrimary relative overflow-hidden font-sans"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 z-10">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <section className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="flex items-center gap-3 text-textSecondary font-bold text-[10px] uppercase tracking-[0.3em]">
                <Calendar size={12} />
                <span>{currentDate}</span>
                <span className="text-textSecondary/50">/</span>
                <span className="text-accentPurple">
                  {activeProject?.name || "System Idle"}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-textPrimary tracking-tighter mt-2">
                {getGreeting()}, {user?.displayName?.split(" ")[0] || "User"}.
              </h1>
            </motion.div>

            <div className="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-main)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsProjectModalOpen(true)}
                className="h-[60px] px-8 border border-borderSubtle text-textSecondary rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative overflow-hidden group w-full md:w-auto justify-center"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <FolderPlus size={16} /> Inicializar Projeto
                </span>
                <div className="absolute inset-0 h-full w-full bg-textPrimary/10 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </motion.button>

              <div className="hidden md:block w-px h-12 bg-borderSubtle" />

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="bg-bgSurface border border-borderSubtle p-2 pr-4 rounded-full flex items-center gap-4 w-full md:w-auto shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] group hover:border-accentPurple/50 transition-colors"
              >
                <div className="relative">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Perfil"
                      className="w-12 h-12 rounded-full border-2 border-borderSubtle object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accentPurple/10 border-2 border-accentPurple/20 flex items-center justify-center">
                      <User size={20} className="text-accentPurple" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-bgSurface rounded-full" />
                </div>

                <div className="flex flex-col flex-1 min-w-[120px]">
                  <span className="text-[13px] font-bold text-textPrimary line-clamp-1">
                    {user?.displayName || "Agente Desconhecido"}
                  </span>
                  <span className="text-[10px] text-textSecondary font-mono truncate max-w-[150px]">
                    {user?.email || "acesso.restrito@sys.com"}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSignOut}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-bgSurfaceHover hover:bg-red-500/10 hover:text-red-500 text-textSecondary transition-all ml-2"
                  title="Desconectar do Sistema"
                >
                  <LogOut size={16} />
                </motion.button>
              </motion.div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="bg-bgSurface border border-borderSubtle rounded-[2rem] flex flex-col h-[680px] shadow-[inset_0_2px_20px_rgba(0,0,0,0.02)] flex-1 overflow-hidden"
              >
                {/* Cabeçalho Principal do Monitor */}
                <div className="p-6 md:p-8 border-b border-borderSubtle flex items-center justify-between bg-bgSurfaceHover/50 shrink-0">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[11px] font-black text-textSecondary uppercase tracking-[0.2em]">
                      Monitor de Tarefas
                    </h3>
                    <AnimatePresence mode="wait">
                      {criticalTasks.length > 0 ? (
                        <motion.div
                          key="critical-alert"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full"
                        >
                          <AlertTriangle
                            size={12}
                            className="text-red-500"
                          />
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                            {criticalTasks.length}{" "}
                            {criticalTasks.length === 1
                              ? "Crítica"
                              : "Críticas"}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="live-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.div
                            animate={{
                              opacity: [0.4, 1, 0.4],
                              scale: [0.9, 1.1, 0.9],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="w-1.5 h-1.5 rounded-full bg-accentPurple"
                          />
                          <span className="text-[9px] font-mono text-accentPurple/70 uppercase italic">
                            Live Data
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link
                    href="/quadros"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-accentPurple bg-accentPurple/5 border border-accentPurple/10 hover:bg-accentPurple/10 transition-colors uppercase tracking-widest"
                  >
                    Ver Kanban <ChevronRight size={12} />
                  </Link>
                </div>

                {/* Sub-cabeçalho de Filtros e Pesquisa */}
                <div className="px-6 py-3 border-b border-borderSubtle bg-bgMain flex items-center justify-between relative z-50 shrink-0">
                  <div className="relative flex-1 max-w-sm flex items-center group">
                    <Search
                      size={14}
                      className="absolute left-3 text-textSecondary group-focus-within:text-accentPurple transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Pesquisar tarefas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none text-[11px] text-textPrimary pl-9 pr-4 py-1.5 outline-none placeholder:text-textSecondary focus:ring-0"
                    />
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFilterOpen(!isFilterOpen);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-lg ${
                        hasActiveFilters
                          ? "text-accentPurple bg-accentPurple/10"
                          : "text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceHover"
                      }`}
                    >
                      <Filter size={12} /> Filtros{" "}
                      {hasActiveFilters && (
                        <span className="ml-1 w-2 h-2 rounded-full bg-accentPurple" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isFilterOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-full mt-2 right-0 w-64 bg-bgSurface backdrop-blur-xl border border-borderSubtle rounded-2xl shadow-2xl p-4 z-[60] flex flex-col gap-4"
                        >
                          <div className="flex items-center justify-between border-b border-borderSubtle pb-2">
                            <span className="text-xs font-bold text-textPrimary">
                              Filtrar Tarefas
                            </span>
                            {hasActiveFilters && (
                              <button
                                onClick={clearFilters}
                                className="text-[10px] text-textSecondary hover:text-red-500 transition-colors font-bold uppercase"
                              >
                                Limpar
                              </button>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-textSecondary mb-2 block">
                              Prioridade
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {["low", "medium", "high", "critical"].map(
                                (p) => (
                                  <button
                                    key={p}
                                    onClick={() => togglePriorityFilter(p)}
                                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${
                                      selectedPriorities.includes(p)
                                        ? "bg-accentPurple/20 text-accentPurple border-accentPurple/30"
                                        : "bg-transparent text-textSecondary border-borderSubtle hover:border-textSecondary"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-textSecondary mb-2 block">
                              Responsável
                            </span>
                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                              {activeProject?.members?.map((m: any) => (
                                <button
                                  key={m.email || m.name}
                                  onClick={() => toggleAssigneeFilter(m.name)}
                                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-bgSurfaceHover transition-colors group"
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
                                      className={`text-[11px] ${
                                        selectedAssignees.includes(m.name)
                                          ? "text-accentPurple font-bold"
                                          : "text-textSecondary group-hover:text-textPrimary"
                                      }`}
                                    >
                                      {m.name}
                                    </span>
                                  </div>
                                  {selectedAssignees.includes(m.name) && (
                                    <Check
                                      size={12}
                                      className="text-accentPurple"
                                    />
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

                {/* Lista de Tarefas */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-bgMain relative z-10">
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filteredTasks.length > 0 ? (
                        filteredTasks.map((task, idx) => {
                          const priorityColors: Record<string, any> = {
                            critical: {
                              bg: "bg-red-500/10",
                              text: "text-red-500",
                              border: "border-red-500/20",
                              line: "bg-red-500",
                              glow: "group-hover:shadow-[inset_0_0_30px_rgba(239,68,68,0.05)]",
                              gradient: "from-red-500/5",
                            },
                            high: {
                              bg: "bg-orange-500/10",
                              text: "text-orange-500",
                              border: "border-orange-500/20",
                              line: "bg-orange-500",
                              glow: "group-hover:shadow-[inset_0_0_30px_rgba(249,115,22,0.05)]",
                              gradient: "from-orange-500/5",
                            },
                            medium: {
                              bg: "bg-yellow-500/10",
                              text: "text-yellow-500",
                              border: "border-yellow-500/20",
                              line: "bg-yellow-500",
                              glow: "group-hover:shadow-[inset_0_0_30px_rgba(234,179,8,0.05)]",
                              gradient: "from-yellow-500/5",
                            },
                            low: {
                              bg: "bg-emerald-500/10",
                              text: "text-emerald-500",
                              border: "border-emerald-500/20",
                              line: "bg-emerald-500",
                              glow: "group-hover:shadow-[inset_0_0_30px_rgba(16,185,129,0.05)]",
                              gradient: "from-emerald-500/5",
                            },
                            default: {
                              bg: "bg-bgSurfaceHover",
                              text: "text-textSecondary",
                              border: "border-borderSubtle",
                              line: "bg-textSecondary",
                              glow: "group-hover:shadow-[inset_0_0_30px_rgba(0,0,0,0.02)]",
                              gradient: "from-black/5 dark:from-white/5",
                            },
                          };
                          const pStyle =
                            priorityColors[
                              task.priority?.toLowerCase() || "default"
                            ];

                          return (
                            <motion.div
                              key={task.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{
                                duration: 0.4,
                                delay: idx * 0.05,
                                ease: "easeOut",
                              }}
                              className={`group relative bg-bgSurface border border-borderSubtle hover:border-accentPurple/50 rounded-[1.5rem] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all duration-500 cursor-pointer overflow-hidden ${pStyle.glow}`}
                            >
                              {/* Efeito de Gradiente de Fundo no Hover */}
                              <div
                                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${pStyle.gradient} to-transparent pointer-events-none`}
                              />

                              {/* Barra de destaque lateral */}
                              <div
                                className={`absolute left-0 top-0 bottom-0 w-[3px] ${pStyle.line} opacity-30 group-hover:opacity-100 transition-all duration-500`}
                              />

                              {/* === ESQUERDA: Ícone e Título === */}
                              <div className="flex items-start sm:items-center gap-4 relative z-10">
                                <div
                                  className={`mt-1 sm:mt-0 w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 ${pStyle.bg} ${pStyle.border}`}
                                >
                                  <CheckSquare
                                    size={18}
                                    className={pStyle.text}
                                  />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] font-mono text-textSecondary group-hover:text-textPrimary transition-colors tracking-widest">
                                      {task.taskKey}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-borderSubtle" />
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}
                                    >
                                      {task.priority || "Normal"}
                                    </span>
                                  </div>
                                  <span className="text-[14px] font-bold text-textPrimary group-hover:text-accentPurple transition-colors line-clamp-1 tracking-tight">
                                    {task.title}
                                  </span>
                                </div>
                              </div>

                              {/* === DIREITA: Badges e Avatar === */}
                              <div className="flex items-center gap-4 sm:gap-6 pl-14 sm:pl-0 relative z-10">
                                {/* Epic Badge */}
                                {task.epic && (
                                  <span className="hidden lg:inline-flex text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 bg-bgSurfaceHover text-textSecondary group-hover:text-textPrimary rounded-lg border border-borderSubtle transition-all truncate max-w-[100px]">
                                    {task.epic}
                                  </span>
                                )}

                                {/* Story Points */}
                                <div className="flex items-center justify-center px-2 py-1 rounded-lg border border-dashed border-borderSubtle bg-bgMain transition-colors min-w-[32px]">
                                  <span className="text-[11px] font-black text-textSecondary group-hover:text-textPrimary">
                                    {task.points || "-"}
                                  </span>
                                </div>

                                <div className="hidden sm:block w-px h-6 bg-borderSubtle" />

                                {/* Avatar & Ações */}
                                <div className="flex items-center gap-2">
                                  <img
                                    src={
                                      task.assigneePhoto ||
                                      `https://ui-avatars.com/api/?name=${task.assignee || "U"}&background=0D0D0D&color=fff`
                                    }
                                    className="w-8 h-8 rounded-full border-2 border-bgSurface group-hover:border-accentPurple/50 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 object-cover shadow-sm"
                                    alt=""
                                    title={task.assignee}
                                  />
                                  <button className="text-textSecondary hover:text-textPrimary p-1.5 rounded-lg hover:bg-bgSurfaceHover transition-colors opacity-0 group-hover:opacity-100 -ml-2 sm:ml-0">
                                    <MoreHorizontal size={18} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full flex flex-col items-center justify-center opacity-40 space-y-4 py-20"
                        >
                          <CheckSquare
                            size={36}
                            className="text-textSecondary mb-2"
                          />
                          <span className="text-[10px] uppercase tracking-[0.3em] text-textSecondary font-bold text-center">
                            {hasActiveFilters
                              ? "Nenhuma tarefa encontrada para os filtros."
                              : "Sem tarefas ativas"}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
                whileHover={{ scale: 1.01 }}
                className="bg-bgSurface border border-indigo-500/20 rounded-[2rem] p-6 flex flex-col relative overflow-hidden group shadow-[inset_0_2px_20px_rgba(88,101,242,0.05)]"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                    rotate: [0, 10, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  className="absolute -top-10 -right-10 w-40 h-40 bg-[#5865F2] rounded-full blur-[80px] pointer-events-none"
                />

                <div className="flex justify-between items-start mb-4 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/30 group-hover:border-[#5865F2]/60 transition-colors">
                      <MessageSquare
                        size={20}
                        className="text-[#5865F2]"
                      />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-textPrimary uppercase tracking-[0.1em]">
                        Bot do Discord
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <motion.div
                          animate={{
                            boxShadow: [
                              "0 0 0px rgba(16,185,129,0.4)",
                              "0 0 10px rgba(16,185,129,0.8)",
                              "0 0 0px rgba(16,185,129,0.4)",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />
                        <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-textSecondary">
                    24ms
                  </span>
                </div>
                <p className="text-[12px] text-textSecondary z-10 leading-relaxed">
                  Sincronização de tarefas e logs de eventos ativas no servidor.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-bgSurface border border-borderSubtle rounded-[2rem] flex flex-col flex-1 min-h-[460px] max-h-[550px] overflow-hidden relative"
              >
                <div className="p-6 md:p-8 border-b border-borderSubtle bg-bgSurfaceHover flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                  <h3 className="text-[11px] font-black text-textSecondary uppercase tracking-[0.2em]">
                    Histórico de Logs
                  </h3>
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-accentPurple/10 border border-accentPurple/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-accentPurple animate-pulse" />
                    <span className="text-[9px] font-mono text-accentPurple uppercase tracking-widest">
                      Live
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-bgMain relative z-0">
                  <div className="relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "100%" }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      className="absolute top-2 bottom-0 left-[15px] w-[2px] bg-gradient-to-b from-accentPurple/50 via-borderSubtle to-transparent"
                    >
                      <motion.div
                        animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                        transition={{
                          duration: 3.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute left-1/2 -translate-x-1/2 w-[3px] h-16 bg-accentPurple rounded-full blur-[2px] shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                      />
                    </motion.div>

                    <div className="space-y-6 relative z-10 pb-8">
                      <AnimatePresence mode="popLayout">
                        {activities.length > 0 ? (
                          activities.map((log, idx) => {
                            const isCreate = log.type === "create";
                            const isDelete = log.type === "delete";
                            const isMove = log.type === "move";

                            let LogIcon = Activity;
                            let iconColor = "text-blue-500";
                            let borderColor = "border-blue-500/20";
                            let glowColor = "group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]";

                            if (isCreate) {
                              LogIcon = Plus;
                              iconColor = "text-emerald-500";
                              borderColor = "border-emerald-500/20";
                              glowColor = "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                            } else if (isDelete) {
                              LogIcon = Trash2;
                              iconColor = "text-red-500";
                              borderColor = "border-red-500/20";
                              glowColor = "group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                            } else if (isMove) {
                              LogIcon = LayoutPanelLeft;
                              iconColor = "text-accentPurple";
                              borderColor = "border-accentPurple/20";
                              glowColor = "group-hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]";
                            }

                            return (
                              <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{
                                  duration: 0.3,
                                  delay: idx * 0.05,
                                }}
                                className="relative pl-12 group"
                              >
                                <div
                                  className={`absolute left-0 top-0 w-8 h-8 rounded-xl border flex items-center justify-center bg-bgSurface transition-all duration-300 group-hover:scale-110 ${borderColor} ${glowColor} z-10`}
                                >
                                  <LogIcon size={14} className={iconColor} />
                                </div>

                                <motion.div className="flex flex-col bg-bgMain border border-borderSubtle rounded-2xl p-4 group-hover:bg-bgSurfaceHover group-hover:border-accentPurple/20 transition-all duration-300">
                                  <div className="flex items-center gap-3 mb-2">
                                    {log.userPhoto ? (
                                      <img
                                        src={log.userPhoto}
                                        alt=""
                                        className="w-5 h-5 rounded-full grayscale group-hover:grayscale-0 transition-all border border-borderSubtle"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-bgSurfaceHover flex items-center justify-center border border-borderSubtle">
                                        <User
                                          size={10}
                                          className="text-textSecondary"
                                        />
                                      </div>
                                    )}
                                    <span className="text-[12px] text-textPrimary font-bold tracking-wide">
                                      {log.userName}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-borderSubtle" />
                                    <span className="text-[10px] font-mono text-textSecondary uppercase tracking-widest group-hover:text-accentPurple transition-colors">
                                      {formatTime(log.timestamp)}
                                    </span>
                                  </div>

                                  <div className="text-[13px] text-textSecondary leading-relaxed pl-3 border-l-2 border-borderSubtle ml-1 mt-1 group-hover:border-accentPurple/30 transition-colors">
                                    {log.content}
                                  </div>
                                </motion.div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <Activity
                              size={32}
                              className="text-textSecondary mb-4"
                            />
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-textSecondary">
                              Nenhuma atividade recente
                            </span>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="h-12 bg-gradient-to-t from-bgMain to-transparent absolute bottom-0 left-0 right-0 pointer-events-none z-10" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </motion.main>
  );
}