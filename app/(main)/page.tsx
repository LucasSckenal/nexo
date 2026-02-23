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
  Settings,
  Users,
  FolderPlus,
  Activity,
  LayoutPanelLeft,
  Plus,
  Trash2,
  Circle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const user = auth.currentUser;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    if (hour >= 18 && hour < 22) return "Boa noite";
    return "Boa madrugada";
  };

  const currentDate = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Agora";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return "Recente";
    }
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

  return (
    <motion.main
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex-1 bg-[#050505] text-zinc-400 overflow-y-auto custom-scrollbar p-10 font-sans"
    >
      <div className="max-w-[1600px] mx-auto space-y-10">
        {/* HEADER */}
        <section className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="flex items-center gap-3 text-zinc-600 font-bold text-[10px] uppercase tracking-[0.3em]">
              <Calendar size={12} />
              <span>{currentDate}</span>
              <span className="text-zinc-800">/</span>
              <span className="text-indigo-500/70">
                {activeProject?.name || "System Idle"}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mt-2">
              {getGreeting()}, {user?.displayName?.split(" ")[0] || "User"}.
            </h1>
          </motion.div>

          <motion.button
            whileHover={{
              scale: 1.05,
              backgroundColor: "#ffffff",
              color: "#000000",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsProjectModalOpen(true)}
            className="h-[60px] px-8 border border-white/10 text-white/50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-3">
              <FolderPlus size={16} /> Inicializar Projeto
            </span>
            <div className="absolute inset-0 h-full w-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </motion.button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* MESA DE TRABALHO - VISOR CENTRAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-[#080808] border border-white/[0.03] rounded-[2rem] flex flex-col h-[500px] overflow-hidden shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]"
            >
              <div className="p-8 border-b border-white/[0.02] flex items-center justify-between bg-black/20">
                <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                  Monitor de Tarefas
                </h3>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                  />
                  <span className="text-[9px] font-mono text-indigo-500/50 uppercase italic">
                    Live Data
                  </span>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-[#050505]/50">
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activeTasks.length > 0 ? (
                      activeTasks.map((task, idx) => {
                        const priorityColors: Record<string, string> = {
                          critical:
                            "bg-red-500/10 text-red-400 border-red-500/20",
                          high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                          medium:
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                          low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                          default:
                            "bg-zinc-800/30 text-zinc-400 border-zinc-700/30",
                        };
                        const priorityKey = task.priority
                          ? task.priority.toLowerCase()
                          : "default";
                        const pColor =
                          priorityColors[priorityKey] || priorityColors.default;

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }} // Efeito Cascata direto
                            whileHover={{
                              scale: 1.02,
                              backgroundColor: "rgba(99, 102, 241, 0.03)",
                            }}
                            className="group relative bg-[#0A0A0A] border border-white/[0.04] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] overflow-hidden cursor-pointer z-10"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="flex items-start sm:items-center gap-4">
                              <div className="mt-0.5 sm:mt-0">
                                <Circle
                                  size={18}
                                  className="text-zinc-700 group-hover:text-indigo-400 transition-colors"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors line-clamp-1">
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${pColor}`}
                                  >
                                    {task.priority || "Normal"}
                                  </span>
                                  {task.assignee && (
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                      <Users size={10} /> {task.assignee}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 pl-9 sm:pl-0">
                              <div className="bg-black/40 border border-white/[0.05] px-3 py-1.5 rounded-lg group-hover:border-indigo-500/20 transition-colors">
                                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-indigo-300 tracking-widest">
                                  {task.taskKey}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center opacity-50 space-y-4 py-20"
                      >
                        <CheckSquare size={32} className="text-zinc-800" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">
                          Sem tarefas ativas
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* PAINEL DE INSTRUMENTOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -5 }}
                className="bg-[#080808] border border-red-900/30 rounded-[2rem] p-8 flex flex-col justify-between h-48 group shadow-[0_0_15px_rgba(127,29,29,0.1)] hover:shadow-[0_0_25px_rgba(127,29,29,0.2)] transition-all cursor-pointer relative overflow-hidden"
              >
                <motion.div
                  animate={{ opacity: [0, 0.1, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-red-600/20 blur-3xl -z-10"
                />
                <AlertTriangle
                  size={18}
                  className="text-red-500 group-hover:text-red-400 transition-colors"
                />
                <div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.6 }}
                    className="text-4xl font-light text-red-500 group-hover:text-red-400 transition-colors font-mono block"
                  >
                    {criticalTasks.length}
                  </motion.span>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2 tracking-widest group-hover:text-zinc-400">
                    Alerta Crítico
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="col-span-2 bg-[#080808] border border-white/[0.03] rounded-[2rem] p-4 flex items-center justify-around shadow-[inset_0_2px_20px_rgba(255,255,255,0.01)]"
              >
                <QuickAction
                  icon={<Users size={20} />}
                  label="Equipe"
                  href="#"
                  color="cyan"
                  delay={0.7}
                />
                <QuickAction
                  icon={<LayoutPanelLeft size={20} />}
                  label="Kanban"
                  href="/quadros"
                  color="indigo"
                  delay={0.8}
                />
                <QuickAction
                  icon={<Settings size={20} />}
                  label="Configurações"
                  href="/configuracoes"
                  color="orange"
                  delay={0.9}
                />
              </motion.div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* DISCORD BOT CARD */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, type: "spring" }}
              whileHover={{ scale: 1.01 }}
              className="bg-[#080808] border border-[#5865F2]/20 rounded-[2rem] p-6 flex flex-col relative overflow-hidden group shadow-[inset_0_2px_20px_rgba(88,101,242,0.05)]"
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
                    <MessageSquare size={20} className="text-[#5865F2]" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.1em]">
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
                      <span className="text-[9px] font-mono text-emerald-500/90 uppercase tracking-widest">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">
                  24ms
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 z-10 leading-relaxed">
                Sincronização de tarefas e logs de eventos ativas no servidor.
              </p>
            </motion.div>

            {/* RADAR DE EVENTOS (TIMELINE PROFISSIONAL) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#080808] border border-white/[0.03] rounded-[2rem] flex flex-col flex-1 min-h-[500px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/[0.02] bg-black/20">
                <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                  Histórico de Logs
                </h3>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#050505]/30">
                <div className="relative ml-4 h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{
                      duration: 1.5,
                      delay: 0.8,
                      ease: "easeInOut",
                    }}
                    className="absolute left-0 top-0 w-[2px] bg-zinc-800/30"
                  />

                  <div className="space-y-8 relative z-10">
                    <AnimatePresence mode="popLayout">
                      {activities.map((log, idx) => {
                        const isCreate = log.type === "create";
                        const isDelete = log.type === "delete";

                        let LogIcon = Activity;
                        let iconColor = "text-blue-400";
                        let borderColor = "border-blue-500/20";

                        if (isCreate) {
                          LogIcon = Plus;
                          iconColor = "text-emerald-400";
                          borderColor = "border-emerald-500/20";
                        } else if (isDelete) {
                          LogIcon = Trash2;
                          iconColor = "text-red-400";
                          borderColor = "border-red-500/20";
                        }

                        return (
                          <motion.div
                            key={log.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }} // Efeito cascata corrigido
                            className="relative pl-8 group"
                          >
                            <div
                              className={`absolute -left-[17px] -top-1 w-8 h-8 rounded-xl border flex items-center justify-center bg-[#050505] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${borderColor}`}
                            >
                              <LogIcon size={14} className={iconColor} />
                            </div>

                            <motion.div
                              whileHover={{ x: 5 }}
                              className="flex flex-col"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[12px] text-zinc-200 font-semibold tracking-wide">
                                  {log.userName}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                  {formatTime(log.timestamp)}
                                </span>
                              </div>

                              <div className="bg-white/[0.01] border border-white/[0.02] rounded-xl p-3 text-[13px] text-zinc-400 leading-relaxed group-hover:bg-white/[0.03] group-hover:border-white/[0.05] transition-colors">
                                {log.content}
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
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

function QuickAction({
  icon,
  label,
  href,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  href: string;
  color: "cyan" | "indigo" | "orange";
  delay?: number;
}) {
  const themes = {
    cyan: "text-cyan-400 border-cyan-400/30 bg-cyan-400/[0.05] shadow-[0_0_15px_rgba(34,211,238,0.05)] group-hover:bg-cyan-400/[0.15] group-hover:border-cyan-400/60 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.2)]",
    indigo:
      "text-indigo-400 border-indigo-400/30 bg-indigo-400/[0.05] shadow-[0_0_15px_rgba(99,102,241,0.05)] group-hover:bg-indigo-400/[0.15] group-hover:border-indigo-400/60 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.2)]",
    orange:
      "text-orange-400 border-orange-400/30 bg-orange-400/[0.05] shadow-[0_0_15px_rgba(249,115,22,0.05)] group-hover:bg-orange-400/[0.15] group-hover:border-orange-400/60 group-hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring" }}
    >
      <Link
        href={href}
        className="flex flex-col items-center gap-4 group px-6 py-4 transition-all"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className={`
          w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
          border ${themes[color]}
        `}
        >
          <div>{icon}</div>
        </motion.div>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] group-hover:text-zinc-200 transition-colors">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
