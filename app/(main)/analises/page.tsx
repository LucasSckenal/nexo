"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Activity,
  Sparkles,
} from "lucide-react";

export default function AnalisesPage() {
  const { activeProject } = useData();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!activeProject?.id) return;

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", activeProject.id),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [activeProject?.id]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const bugs = tasks.filter(
      (t) => t.type === "bug" && t.status !== "done",
    ).length;
    const totalPoints = tasks.reduce(
      (acc, t) => acc + (Number(t.points) || 0),
      0,
    );
    const donePoints = tasks
      .filter((t) => t.status === "done")
      .reduce((acc, t) => acc + (Number(t.points) || 0), 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      bugs,
      totalPoints,
      donePoints,
      percent,
    };
  }, [tasks]);

  const chartData = [
    { name: "Seg", val: stats.percent * 0.3 },
    { name: "Ter", val: stats.percent * 0.45 },
    { name: "Qua", val: stats.percent * 0.4 },
    { name: "Qui", val: stats.percent * 0.75 },
    { name: "Hoje", val: stats.percent },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10"
    >
      {/* Header Estilizado */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <Activity size={20} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              Analytics Dashboard
            </span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">
            DATA <span className="text-indigo-600">CENTER</span>
          </h1>
          <p className="text-zinc-500 font-medium">
            Monitorizando{" "}
            <span className="text-white border-b border-indigo-500/50">
              {activeProject?.name || "Projeto não selecionado"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0A0A0C] border border-white/5 p-2 rounded-2xl shadow-2xl">
          <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-500/10">
            <TrendingUp size={14} />
            <span className="text-xs font-black tracking-widest uppercase">
              On Track
            </span>
          </div>
        </div>
      </header>

      {/* Grid de Cards com Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Progresso Final"
          value={`${stats.percent}%`}
          icon={<Zap />}
          color="indigo"
          subValue={`${stats.completed} concluídas`}
        />
        <StatCard
          title="Story Points"
          value={`${stats.donePoints}/${stats.totalPoints}`}
          icon={<Target />}
          color="purple"
          subValue="Fibonacci Estimativa"
        />
        <StatCard
          title="Em Sprint"
          value={stats.inProgress.toString()}
          icon={<Clock />}
          color="amber"
          subValue="Tasks ativas agora"
        />
        <StatCard
          title="Critical Bugs"
          value={stats.bugs.toString()}
          icon={<AlertCircle />}
          color="red"
          subValue="Aguardando fix"
        />
      </div>

      {/* Seção Central de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Container do Gráfico */}
        <div className="lg:col-span-2 bg-[#0A0A0C] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 pointer-events-none">
            <Layout size={120} className="text-white/[0.02]" />
          </div>

          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Fluxo de Velocidade
              </h3>
              <p className="text-zinc-500 text-sm mt-1">
                Desempenho da equipa nos últimos 5 dias
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="0"
                  vertical={false}
                  stroke="#ffffff05"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#52525b", fontSize: 11, fontWeight: 800 }}
                  dy={20}
                />
                <Tooltip
                  cursor={{ stroke: "#6366f1", strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: "#0F0F12",
                    border: "1px solid #ffffff10",
                    borderRadius: "20px",
                    padding: "15px",
                  }}
                  itemStyle={{
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: "14px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#6366f1"
                  strokeWidth={6}
                  fillOpacity={1}
                  fill="url(#colorVal)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card de Saúde lateral */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-[0_20px_50px_rgba(99,102,241,0.2)]">
          <div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/10">
              <Sparkles size={28} />
            </div>
            <h3 className="text-3xl font-black tracking-tighter leading-none mb-4">
              MÉTRICA DE
              <br />
              ENTREGA
            </h3>
            <p className="text-indigo-100/70 text-sm font-medium leading-relaxed">
              O projeto está a avançar a um ritmo de {stats.percent}% de
              conclusão. Faltam aproximadamente {stats.total - stats.completed}{" "}
              tarefas para fechar a Milestone atual.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">
                Status Geral
              </span>
              <span className="text-4xl font-black tracking-tighter">
                {stats.percent}%
              </span>
            </div>
            <div className="h-6 bg-black/20 rounded-2xl p-1 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.percent}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              />
            </div>
            <button className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 group">
              Exportar Relatório{" "}
              <ChevronRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, color, subValue }: any) {
  const themes: any = {
    indigo: "border-indigo-500/10 bg-indigo-500/5 text-indigo-500",
    purple: "border-purple-500/10 bg-purple-500/5 text-purple-400",
    amber: "border-amber-500/10 bg-amber-500/5 text-amber-500",
    red: "border-red-500/10 bg-red-500/5 text-red-500",
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`p-8 rounded-[2.5rem] border ${themes[color]} bg-[#0A0A0C] transition-all duration-300 relative group overflow-hidden shadow-xl`}
    >
      <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 rotate-12 scale-150">
        {icon}
      </div>

      <div
        className={`w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center mb-8 shadow-inner`}
      >
        {React.cloneElement(icon, { size: 28 })}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
          {title}
        </p>
        <h4 className="text-4xl font-black text-white tracking-tighter">
          {value}
        </h4>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1 h-1 rounded-full bg-current opacity-50" />
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {subValue}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
