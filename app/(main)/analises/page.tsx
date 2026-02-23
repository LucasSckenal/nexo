"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Zap,
  Target,
  Clock,
  Layout,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// Dados visuais para o gráfico de fluxo (mantidos para o design premium)
const performanceData = [
  { name: "Seg", progresso: 45, sprint: 30 },
  { name: "Ter", progresso: 52, sprint: 40 },
  { name: "Qua", progresso: 48, sprint: 45 },
  { name: "Qui", progresso: 70, sprint: 50 },
  { name: "Sex", progresso: 85, sprint: 65 },
  { name: "Sáb", progresso: 75, sprint: 80 },
  { name: "Dom", progresso: 95, sprint: 85 },
];

export default function AnalisesPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<"7 Dias" | "30 Dias" | "Total">(
    "Total",
  );

  // Busca as tarefas em tempo real do projeto ativo
  useEffect(() => {
    if (!activeProject?.id) return;

    const q = query(collection(db, "projects", activeProject.id, "tasks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(fetchedTasks);
    });

    return () => unsubscribe();
  }, [activeProject?.id]);

  // ---- FILTRO DE TEMPO ----
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (timeFilter === "Total") return true;

      // Pega a data da tarefa (createdAt). Se não existir, assume como antiga (ou ajusta conforme sua estrutura)
      const taskDate = task.createdAt?.toDate
        ? task.createdAt.toDate()
        : new Date(task.createdAt || 0);

      if (timeFilter === "7 Dias") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return taskDate >= sevenDaysAgo;
      }

      if (timeFilter === "30 Dias") {
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        return taskDate >= thirtyDaysAgo;
      }

      return true;
    });
  }, [tasks, timeFilter]);

  // ---- CÁLCULOS DINÂMICOS (Usando as tarefas filtradas) ----
  const totalTasks = filteredTasks.length || 1; // Previne divisão por zero
  const todoCount = filteredTasks.filter((t) => t.status === "todo").length;
  const inProgressCount = filteredTasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const reviewCount = filteredTasks.filter((t) => t.status === "review").length;
  const doneCount = filteredTasks.filter((t) => t.status === "done").length;

  const efficiency = Math.round((doneCount / totalTasks) * 100);

  // Array de distribuição de tarefas abastecido com dados reais
  const taskDistribution = [
    {
      name: "Backlog",
      value: todoCount,
      color: "#3f3f46",
      gradient: "from-zinc-500/20 to-zinc-500/5",
    },
    {
      name: "Em Curso",
      value: inProgressCount,
      color: "#a855f7",
      gradient: "from-purple-500/20 to-purple-500/5",
    },
    {
      name: "Revisão",
      value: reviewCount,
      color: "#6366f1",
      gradient: "from-indigo-500/20 to-indigo-500/5",
    },
    {
      name: "Concluído",
      value: doneCount,
      color: "#22c55e",
      gradient: "from-emerald-500/20 to-emerald-500/5",
    },
  ];

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-6 lg:p-10 bg-[#050505] overflow-y-auto custom-scrollbar relative"
    >
      {/* Background Decorativo Superior */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto space-y-10 relative z-10">
        {/* HEADER MINIMALISTA */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-[10px] uppercase tracking-[0.4em]">
              <Sparkles size={14} className="animate-pulse" />
              <span>Motor Analítico</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">
              Análises{" "}
              <span className="text-zinc-500 italic font-light">Gerais</span>
            </h1>
          </div>

          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-md">
            {(["7 Dias", "30 Dias", "Total"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all ${timeFilter === tab ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* MÉTRICAS COM GLASSMORPHISM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total de Tarefas"
            value={filteredTasks.length.toString()}
            sub={`No período: ${timeFilter}`}
            icon={<Zap size={20} />}
            color="purple"
          />
          <StatCard
            label="Tempo de Ciclo"
            value="2.4d"
            sub="Média por tarefa"
            icon={<Clock size={20} />}
            color="indigo"
          />
          <StatCard
            label="Produtividade"
            value={doneCount.toString()}
            sub="Tarefas concluídas"
            icon={<Layout size={20} />}
            color="emerald"
          />
          <StatCard
            label="Eficiência"
            value={`${filteredTasks.length > 0 ? efficiency : 0}%`}
            sub="Saúde do projeto"
            icon={<Target size={20} />}
            color="amber"
          />
        </div>

        {/* DASHBOARD PRINCIPAL */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* GRÁFICO DE PERFORMANCE */}
          <div className="xl:col-span-2 bg-[#080808]/50 border border-white/[0.05] rounded-[2.5rem] p-8 backdrop-blur-sm relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="flex justify-between items-center mb-10">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">
                  Fluxo de Desempenho
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Progresso semanal vs base
                </p>
              </div>
              <div className="flex gap-4">
                <LegendItem color="bg-purple-500" label="Atual" />
                <LegendItem color="bg-zinc-800" label="Base" />
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke="#ffffff03"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#3f3f46"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={15}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: "#a855f7",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sprint"
                    stroke="#ffffff10"
                    fill="transparent"
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="progresso"
                    stroke="#a855f7"
                    strokeWidth={4}
                    fill="url(#purpleGlow)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DISTRIBUIÇÃO DE TAREFAS */}
          <div className="bg-[#080808]/50 border border-white/[0.05] rounded-[2.5rem] p-8 backdrop-blur-sm flex flex-col h-full">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-10">
              Distribuição de Tarefas
            </h3>

            <div className="flex-1 space-y-8">
              {taskDistribution.map((item, idx) => {
                const percentage =
                  totalTasks > 0 ? (item.value / totalTasks) * 100 : 0;

                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={item.name}
                    className="group cursor-default"
                  >
                    <div className="flex justify-between items-end mb-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">
                          {item.name}
                        </span>
                        <p className="text-[11px] text-zinc-600 font-medium">
                          Volume por status
                        </p>
                      </div>
                      <span className="text-lg font-black text-white tabular-nums tracking-tighter">
                        {item.value}
                        <span className="text-[10px] text-zinc-500 ml-1">
                          tarefas
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full bg-gradient-to-r ${item.gradient} relative`}
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/40 shadow-[0_0_8px_white]" />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button className="mt-10 group flex items-center justify-center gap-2 w-full py-4 bg-white text-black rounded-2xl font-bold text-xs hover:bg-purple-500 hover:text-white transition-all duration-300">
              Baixar Relatório
              <ChevronRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </motion.main>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-2xl font-black text-white tracking-tighter">
          {payload[0].value}%
        </p>
        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-1">
          Nível de Eficiência
        </p>
      </div>
    );
  }
  return null;
}

function StatCard({ label, value, sub, icon, color }: any) {
  const colors: any = {
    purple:
      "from-purple-500/20 to-transparent border-purple-500/20 text-purple-400",
    indigo:
      "from-indigo-500/20 to-transparent border-indigo-500/20 text-indigo-400",
    emerald:
      "from-emerald-500/20 to-transparent border-emerald-500/20 text-emerald-400",
    amber:
      "from-amber-500/20 to-transparent border-amber-500/20 text-amber-400",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${colors[color]} border p-6 rounded-[2rem] relative overflow-hidden group transition-all duration-500`}
    >
      <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 group-hover:scale-150 transform">
        {icon}
      </div>

      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          {label}
        </p>
        <h4 className="text-4xl font-black text-white tracking-tighter">
          {value}
        </h4>
        <div className="flex items-center gap-2 mt-2">
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
            <p className="text-[9px] text-zinc-400 font-bold uppercase">
              {sub}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
