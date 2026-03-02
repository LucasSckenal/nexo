// page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useData } from "../context/DataContext";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  FolderPlus,
  Activity,
  LayoutPanelLeft,
  Plus,
  Trash2,
  User,
  LogOut,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Link as LinkIcon,
  X,
  Check, // <-- Adicionado o ícone X para fechar o modal
} from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";

// ==========================================
// TIPAGENS
// ==========================================
interface Task {
  id: string;
  title: string;
  taskKey: string;
  priority: string;
  status: string;
  assignee: string;
  assigneePhoto?: string;
  epic?: string;
  points?: number;
  [key: string]: any;
}

interface ActivityLog {
  id: string;
  type: string;
  userName: string;
  userPhoto?: string;
  timestamp: any;
  content: string;
  taskId?: string;
}

// ==========================================
// CONSTANTES E FORMATADORES
// ==========================================
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const PRIORITY_STYLES: Record<string, any> = {
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

export default function DashboardPage() {
  const router = useRouter();
  const { activeProject } = useData();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const user = auth.currentUser;

  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    taskId: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => {
      // Deixamos de forçar o fecho do modal de filtros aqui, porque o modal
      // agora tem a sua própria lógica de fecho clicando no fundo escuro.
      setContextMenu(null);
    };
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

  const currentDate = useMemo(() => dateFormatter.format(new Date()), []);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Agora";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return timeFormatter.format(date);
    } catch (error) {
      return "Recente";
    }
  };

  const handleSignOut = () => signOut(auth).catch(console.error);

  useEffect(() => {
    if (!activeProject?.id) return;

    const qTasks = query(
      collection(db, "projects", activeProject.id, "tasks"),
      orderBy("createdAt", "desc"),
    );
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task),
      );
    });

    const qActivities = query(
      collection(db, "projects", activeProject.id, "activities"),
      orderBy("timestamp", "desc"),
      limit(20),
    );
    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      setActivities(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as ActivityLog,
        ),
      );
    });

    return () => {
      unsubTasks();
      unsubActivities();
    };
  }, [activeProject?.id]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks],
  );
  const criticalTasks = useMemo(
    () => activeTasks.filter((t) => t.priority === "critical"),
    [activeTasks],
  );
  const myTasksCount = useMemo(
    () => activeTasks.filter((t) => t.assignee === user?.displayName).length,
    [activeTasks, user],
  );

  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      const matchesSearch =
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskKey?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        selectedPriorities.length === 0 ||
        selectedPriorities.includes(task.priority?.toLowerCase());
      const matchesMine = !showOnlyMine || task.assignee === user?.displayName;
      return matchesSearch && matchesPriority && matchesMine;
    });
  }, [activeTasks, searchQuery, selectedPriorities, showOnlyMine, user]);

  const hasActiveFilters =
    selectedPriorities.length > 0 || searchQuery.trim() !== "";

  const dailyBriefing = useMemo(() => {
    if (criticalTasks.length > 0)
      return `Atenção: Você tem ${criticalTasks.length} tarefa(s) crítica(s) exigindo ação imediata.`;
    if (myTasksCount > 0)
      return `Foco total! Você tem ${myTasksCount} tarefa(s) atribuída(s) a você.`;
    if (activeTasks.length === 0)
      return `Tudo limpo! Não há tarefas ativas no momento.`;
    return `Você tem ${activeTasks.length} tarefas em andamento no projeto.`;
  }, [criticalTasks.length, myTasksCount, activeTasks.length]);

  const handleRightClick = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ taskId, x: e.clientX, y: e.clientY });
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!activeProject?.id) return;
    try {
      await updateDoc(doc(db, "projects", activeProject.id, "tasks", taskId), {
        status: "done",
        updatedAt: serverTimestamp(),
      });
      setContextMenu(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = (taskId: string) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/kanban?taskId=${taskId}`,
    );
    setContextMenu(null);
  };

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
                  {activeProject?.name || "Sistema Inativo"}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-textPrimary tracking-tighter mt-2">
                {getGreeting()}, {user?.displayName?.split(" ")[0] || "Usuário"}
                .
              </h1>
              <p className="text-sm font-medium text-textSecondary mt-3 tracking-wide">
                {dailyBriefing}
              </p>
            </motion.div>

            <div className="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto">
              <motion.button
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
              <div className="bg-bgSurface border border-borderSubtle p-2 pr-4 rounded-full flex items-center gap-4 w-full md:w-auto shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)]">
                <img
                  src={
                    user?.photoURL ||
                    `https://ui-avatars.com/api/?name=${user?.displayName}`
                  }
                  alt="Perfil"
                  className="w-12 h-12 rounded-full border-2 border-borderSubtle object-cover"
                />
                <div className="flex flex-col flex-1 min-w-[120px]">
                  <span className="text-[13px] font-bold text-textPrimary line-clamp-1">
                    {user?.displayName || "Agente"}
                  </span>
                  <span className="text-[10px] text-textSecondary font-mono truncate max-w-[150px]">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-bgSurfaceHover hover:bg-red-500/10 hover:text-red-500 text-textSecondary transition-all ml-2"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className=" border border-borderSubtle rounded-[2rem] flex flex-col h-[680px] shadow-[inset_0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden"
              >
                <div className="p-6 md:p-8 border-b border-borderSubtle flex items-center justify-between  shrink-0">
                  <h3 className="text-[11px] font-black text-textSecondary uppercase tracking-[0.2em]">
                    Monitor de Tarefas
                  </h3>
                  <Link
                    href="/kanban"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-accentPurple bg-accentPurple/5 border border-accentPurple/10 hover:bg-accentPurple/10 transition-colors uppercase tracking-widest"
                  >
                    Ver Kanban <ChevronRight size={12} />
                  </Link>
                </div>

                <div className="px-6 py-3 border-b border-borderSubtle bg-bgMain flex flex-wrap gap-4 items-center justify-between shrink-0">
                  <div className="relative flex-1 min-w-[200px] flex items-center group">
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowOnlyMine(!showOnlyMine)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${showOnlyMine ? "bg-accentPurple text-white" : "bg-bgSurface border border-borderSubtle text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceHover"}`}
                    >
                      Apenas Minhas
                    </button>

                    {/* Botão de Filtro que abre o Modal */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFilterOpen(true);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-lg ${hasActiveFilters ? "text-accentPurple bg-accentPurple/10" : "text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceHover"}`}
                    >
                      <Filter size={12} /> Filtros{" "}
                      {hasActiveFilters && (
                        <span className="ml-1 w-2 h-2 rounded-full bg-accentPurple" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-bgMain relative z-10 min-h-0">
                  <div className="space-y-4 pb-4">
                    <AnimatePresence mode="popLayout">
                      {filteredTasks.length > 0 ? (
                        filteredTasks.map((task, idx) => {
                          const pStyle =
                            PRIORITY_STYLES[
                              task.priority?.toLowerCase() || "default"
                            ];

                          return (
                            <motion.div
                              key={task.id}
                              layout
                              onClick={() =>
                                router.push(`/kanban?taskId=${task.id}`)
                              }
                              onContextMenu={(e) =>
                                handleRightClick(e, task.id)
                              }
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
                              <div
                                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${pStyle.gradient} to-transparent pointer-events-none`}
                              />
                              <div
                                className={`absolute left-0 top-0 bottom-0 w-[3px] ${pStyle.line} opacity-30 group-hover:opacity-100 transition-all duration-500`}
                              />

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

                              <div className="flex items-center gap-4 sm:gap-6 pl-14 sm:pl-0 relative z-10">
                                {task.epic && (
                                  <span className="hidden lg:inline-flex text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 bg-bgSurfaceHover text-textSecondary group-hover:text-textPrimary rounded-lg border border-borderSubtle transition-all truncate max-w-[100px]">
                                    {task.epic}
                                  </span>
                                )}
                                <div className="hidden sm:block w-px h-6 bg-borderSubtle" />
                                <img
                                  src={
                                    task.assigneePhoto ||
                                    `https://ui-avatars.com/api/?name=${task.assignee || "U"}&background=0D0D0D&color=fff`
                                  }
                                  className="w-8 h-8 rounded-full border-2 border-bgSurface group-hover:border-accentPurple/50 transition-all duration-500 object-cover"
                                  alt=""
                                  title={task.assignee}
                                />
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
                            Nenhuma tarefa encontrada
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
                className="border border-indigo-500/20 rounded-[2rem] p-6 flex flex-col relative overflow-hidden group shadow-[inset_0_2px_20px_rgba(88,101,242,0.05)] shrink-0"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#5865F2] rounded-full blur-[80px] pointer-events-none opacity-20" />
                <div className="flex justify-between items-start mb-4 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/30">
                      <MessageSquare size={20} className="text-[#5865F2]" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-textPrimary uppercase tracking-[0.1em]">
                        Bot do Discord
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border border-borderSubtle rounded-[2rem] flex flex-col flex-1 min-h-[460px] max-h-[550px] overflow-hidden relative"
              >
                <div className="p-6 md:p-8 border-b border-borderSubtle flex items-center justify-between sticky top-0 z-20 backdrop-blur-md shrink-0">
                  <h3 className="text-[11px] font-black text-textSecondary uppercase tracking-[0.2em]">
                    Histórico de Logs
                  </h3>
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-accentPurple/10 border border-accentPurple/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-accentPurple animate-pulse" />
                    <span className="text-[9px] font-mono text-accentPurple uppercase tracking-widest">
                      Ao Vivo
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 min-h-0 bg-bgMain relative z-0">
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

                    <div className="space-y-6 relative z-10 pb-16">
                      <AnimatePresence mode="popLayout">
                        {activities.length > 0 ? (
                          activities.map((log, idx) => {
                            const isCreate = log.type === "create";
                            const isDelete = log.type === "delete";
                            const isMove = log.type === "move";
                            let LogIcon = Activity;
                            let iconColor = "text-blue-500";
                            let borderColor = "border-blue-500/20";
                            if (isCreate) {
                              LogIcon = Plus;
                              iconColor = "text-emerald-500";
                              borderColor = "border-emerald-500/20";
                            } else if (isDelete) {
                              LogIcon = Trash2;
                              iconColor = "text-red-500";
                              borderColor = "border-red-500/20";
                            } else if (isMove) {
                              LogIcon = LayoutPanelLeft;
                              iconColor = "text-accentPurple";
                              borderColor = "border-accentPurple/20";
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
                                  className={`absolute left-0 top-0 w-8 h-8 rounded-xl border flex items-center justify-center bg-bgSurface transition-all duration-300 group-hover:scale-110 ${borderColor} z-10`}
                                >
                                  <LogIcon size={14} className={iconColor} />
                                </div>
                                <div
                                  onClick={() =>
                                    log.taskId
                                      ? router.push(
                                          `/kanban?taskId=${log.taskId}`,
                                        )
                                      : null
                                  }
                                  className={`flex flex-col bg-bgMain border border-borderSubtle rounded-2xl p-4 transition-all duration-300 ${log.taskId ? "cursor-pointer hover:bg-bgSurfaceHover hover:border-accentPurple/20" : ""}`}
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <img
                                      src={
                                        log.userPhoto ||
                                        `https://ui-avatars.com/api/?name=${log.userName}`
                                      }
                                      alt=""
                                      className="w-5 h-5 rounded-full grayscale group-hover:grayscale-0 transition-all border border-borderSubtle object-cover"
                                    />
                                    <span className="text-[12px] text-textPrimary font-bold tracking-wide">
                                      {log.userName}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-borderSubtle" />
                                    <span className="text-[10px] font-mono text-textSecondary uppercase tracking-widest">
                                      {formatTime(log.timestamp)}
                                    </span>
                                  </div>
                                  <div className="text-[13px] text-textSecondary leading-relaxed pl-3 border-l-2 border-borderSubtle ml-1 mt-1 group-hover:border-accentPurple/30 transition-colors">
                                    {log.content}
                                  </div>
                                </div>
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

      {/* RENDERIZAÇÃO DO MODAL DE FILTROS APRIMORADO */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-bgSurface border border-borderSubtle rounded-[2rem] shadow-2xl p-6 z-[201] flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-borderSubtle pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accentPurple/10 flex items-center justify-center border border-accentPurple/20">
                    <Filter size={18} className="text-accentPurple" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-textPrimary uppercase tracking-widest">
                      Filtros Avançados
                    </h3>
                    <p className="text-[10px] text-textSecondary mt-1">
                      Personaliza a tua visualização
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-textSecondary hover:text-textPrimary p-2 rounded-xl hover:bg-bgSurfaceHover transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-widest text-textSecondary">
                      Prioridade
                    </span>
                    {selectedPriorities.length > 0 && (
                      <button
                        onClick={() => setSelectedPriorities([])}
                        className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["low", "medium", "high", "critical"].map((p) => {
                      const isSelected = selectedPriorities.includes(p);
                      const priorityNames: Record<string, string> = {
                        low: "Baixa",
                        medium: "Média",
                        high: "Alta",
                        critical: "Crítica",
                      };

                      return (
                        <button
                          key={p}
                          onClick={() =>
                            setSelectedPriorities((prev) =>
                              prev.includes(p)
                                ? prev.filter((x) => x !== p)
                                : [...prev, p],
                            )
                          }
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-300 ${isSelected ? "bg-accentPurple/10 border-accentPurple/50 text-accentPurple" : "bg-bgMain border-borderSubtle text-textSecondary hover:border-textSecondary/50 hover:bg-bgSurfaceHover"}`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            {priorityNames[p]}
                          </span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedPriorities([]);
                    setSearchQuery("");
                    setIsFilterOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl border border-borderSubtle text-textSecondary hover:bg-bgSurfaceHover hover:text-textPrimary text-[11px] font-bold uppercase tracking-widest transition-colors"
                >
                  Resetar
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3 bg-accentPurple hover:bg-purple-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all"
                >
                  Aplicar Filtros
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, type: "spring", stiffness: 300 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-bgSurface/90 backdrop-blur-xl border border-borderSubtle rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] overflow-hidden z-[9999] min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex flex-col p-1.5 gap-0.5">
              <button
                onClick={() => handleCompleteTask(contextMenu.taskId)}
                className="flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold text-textSecondary hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all text-left"
              >
                <CheckCircle2 size={16} /> Concluir Tarefa
              </button>
              <button
                onClick={() => handleCopyLink(contextMenu.taskId)}
                className="flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold text-textSecondary hover:text-accentPurple hover:bg-accentPurple/10 rounded-lg transition-all text-left"
              >
                <LinkIcon size={16} /> Copiar Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </motion.main>
  );
}
