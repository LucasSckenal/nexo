"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
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

  // Sincronização com o Firebase
  useEffect(() => {
    if (!activeProject?.id) return;

    const q = query(
      collection(db, "projects", activeProject.id, "tasks")
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

  // Cálculo funcional das estatísticas
  const stats = useMemo(() => {
    const total = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === "done" || t.status === "concluido"
    );
    const completed = completedTasks.length;
    
    const inProgress = tasks.filter(
      (t) => t.status === "in-progress" || t.status === "review"
    ).length;
    
    // Consideramos "bugs" como tarefas não concluídas de prioridade crítica
    const bugs = tasks.filter(
      (t) => t.priority === "critical" && t.status !== "done"
    ).length;
    
    const totalPoints = tasks.reduce(
      (acc, t) => acc + (Number(t.points) || 0),
      0
    );
    
    const donePoints = completedTasks.reduce(
      (acc, t) => acc + (Number(t.points) || 0),
      0
    );
    
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

  // Cálculo funcional do gráfico (Velocidade dos últimos 5 dias)
  const chartData = useMemo(() => {
    const data = [];
    // Gerar os últimos 5 dias
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        name: d.toLocaleDateString("pt-BR", { weekday: "short" }),
        val: 0,
        dateKey: d.toDateString(),
      });
    }

    // Distribuir as tarefas concluídas pelos dias correspondentes
    tasks.forEach((t) => {
      if (t.status === "done" || t.status === "concluido") {
        const dateValue = t.updatedAt || t.createdAt;
        if (!dateValue) return;
        
        const tDate = dateValue.toDate
          ? dateValue.toDate()
          : new Date(dateValue);
          
        if (!isNaN(tDate.getTime())) {
          const match = data.find((d) => d.dateKey === tDate.toDateString());
          if (match) {
            match.val += Number(t.points) || 1; // Soma os pontos ou 1 se não tiver
          }
        }
      }
    });

    return data;
  }, [tasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col p-4 md:p-6 max-w-[1600px] mx-auto w-full gap-4 md:gap-6 overflow-hidden"
    >
      {/* Header Estilizado - Ajustado para ocupar menos espaço vertical */}
      <header className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Activity size={16} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">
              Analytics Dashboard
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-textPrimary tracking-tighter">
            DATA <span className="text-indigo-600">CENTER</span>
          </h1>
          <p className="text-textSecondary text-xs font-medium">
            Monitorizando{" "}
            <span className="text-textPrimary border-b border-indigo-500/50">
              {activeProject?.name || "Projeto não selecionado"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-bgPanel border border-borderSubtle p-1.5 rounded-2xl shadow-xl">
          <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-500/10">
            <TrendingUp size={14} />
            <span className="text-[10px] font-black tracking-widest uppercase">
              On Track
            </span>
          </div>
        </div>
      </header>

      {/* Grid de Cards com Glassmorphism - Reduzido paddings */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Seção Central de Gráficos - Flex-1 para preencher tela e min-h-0 para evitar scroll */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Container do Gráfico */}
        <div className="lg:col-span-2 bg-bgPanel border border-borderSubtle rounded-[2rem] p-6 flex flex-col relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-6 pointer-events-none">
            <Layout size={80} className="text-textPrimary opacity-5" />
          </div>

          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="text-xl font-black text-textPrimary tracking-tight">
                Fluxo de Velocidade
              </h3>
              <p className="text-textSecondary text-xs mt-1">
                Story points concluídos nos últimos 5 dias
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
          </div>

          <div className="flex-1 min-h-0 w-full mt-2">
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
                  stroke="var(--border-subtle)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 800 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ stroke: "#6366f1", strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: "var(--bg-panel)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "12px",
                  }}
                  itemStyle={{
                    color: "var(--text-primary)",
                    fontWeight: 900,
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorVal)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card de Saúde lateral */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2rem] p-6 lg:p-8 text-white flex flex-col justify-between shadow-[0_20px_50px_rgba(99,102,241,0.2)]">
          <div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4 border border-white/10">
              <Sparkles size={24} />
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-none mb-3">
              MÉTRICA DE
              <br />
              ENTREGA
            </h3>
            <p className="text-indigo-100/80 text-xs font-medium leading-relaxed">
              O projeto está a avançar a um ritmo de {stats.percent}% de
              conclusão. Faltam aproximadamente {stats.total - stats.completed}{" "}
              tarefas para fechar a Milestone atual.
            </p>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Status Geral
              </span>
              <span className="text-3xl lg:text-4xl font-black tracking-tighter">
                {stats.percent}%
              </span>
            </div>
            <div className="h-4 lg:h-5 bg-black/20 rounded-xl p-1 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.percent}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-white rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              />
            </div>
            <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 group">
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
      whileHover={{ y: -4, scale: 1.01 }}
      className={`p-5 rounded-[1.5rem] border ${themes[color]} bg-bgPanel transition-all duration-300 relative group overflow-hidden shadow-lg flex flex-col justify-between`}
    >
      <div className="absolute -right-2 -top-2 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 rotate-12 scale-150">
        {icon}
      </div>

      <div
        className={`w-10 h-10 rounded-xl bg-bgSurface border border-borderSubtle flex items-center justify-center mb-4 shadow-inner`}
      >
        {React.cloneElement(icon, { size: 20 })}
      </div>

      <div className="space-y-0.5 relative z-10">
        <p className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em]">
          {title}
        </p>
        <h4 className="text-2xl lg:text-3xl font-black text-textPrimary tracking-tighter leading-none">
          {value}
        </h4>
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-1 h-1 rounded-full bg-current opacity-50" />
          <p className="text-[9px] text-textSecondary font-bold uppercase tracking-widest line-clamp-1">
            {subValue}
          </p>
        </div>
      </div>
    </motion.div>
  );
}