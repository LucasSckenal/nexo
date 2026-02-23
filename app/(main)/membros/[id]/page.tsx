"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "../../../context/DataContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  CheckCircle2,
  Clock,
  Trophy,
  Github,
  Linkedin,
  Twitter,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeProject } = useData();

  const [member, setMember] = useState<any>(null);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar os dados (memoizada para evitar loops)
  const fetchProfileData = useCallback(async () => {
    if (!activeProject?.id || !id) return;

    try {
      setIsLoading(true);
      setError(null);
      const decodedId = decodeURIComponent(id as string);

      // 1. Localizar o membro no array do projeto
      const foundMember = activeProject.members?.find(
        (m: any) => m.email === decodedId || m.name === decodedId,
      );

      if (!foundMember) {
        setError("Membro não encontrado neste projeto.");
        setIsLoading(false);
        return;
      }

      setMember(foundMember);

      // 2. Buscar as tarefas reais do Firebase
      const tasksRef = collection(db, "projects", activeProject.id, "tasks");
      const q = query(tasksRef, where("assignee", "==", foundMember.name));

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserTasks(tasks);
    } catch (err: any) {
      console.error("Erro ao carregar perfil:", err);
      setError("Erro ao sincronizar com o banco de dados.");
    } finally {
      setIsLoading(false);
    }
  }, [id, activeProject?.id, activeProject?.members]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Formatação de data (Timestamp ou String)
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Data não disponível";
    const date = dateValue.seconds
      ? new Date(dateValue.seconds * 1000)
      : new Date(dateValue);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#050505]">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
        </div>
        <p className="mt-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
          Carregando Perfil
        </p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 text-center">
        <AlertCircle className="text-red-500/50 mb-4" size={48} />
        <h2 className="text-white font-bold text-lg mb-2">
          Usuário não encontrado
        </h2>
        <p className="text-zinc-500 text-sm mb-6 max-w-xs">
          {error || "O membro solicitado não faz parte deste projeto."}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-all"
        >
          Voltar para Equipe
        </button>
      </div>
    );
  }

  const completedTasks = userTasks.filter((t) => t.status === "done").length;
  const pendingTasks = userTasks.length - completedTasks;

  return (
    <main className="flex-1 bg-[#050505] relative overflow-y-auto custom-scrollbar h-full p-6 lg:p-10">
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-bold uppercase tracking-widest">
            Voltar
          </span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LADO ESQUERDO: INFO PESSOAL */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#080808]/60 border border-white/[0.05] rounded-[2.5rem] p-8 text-center backdrop-blur-md"
            >
              <div className="relative inline-block mb-6">
                <img
                  src={
                    member.photoURL ||
                    `https://ui-avatars.com/api/?name=${member.name}&background=6366f1&color=fff`
                  }
                  className="w-32 h-32 rounded-[2rem] object-cover border-2 border-indigo-500/20"
                  alt={member.name}
                />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#080808]" />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">
                {member.name}
              </h1>
              <p className="text-indigo-400 text-sm font-bold uppercase tracking-tighter mb-4">
                {member.role || "Membro"}
              </p>

              <div className="flex justify-center gap-2">
                <button className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-all">
                  <Github size={18} />
                </button>
                <button className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-all">
                  <Linkedin size={18} />
                </button>
              </div>
            </motion.div>

            <div className="bg-[#080808]/60 border border-white/[0.05] rounded-[2.5rem] p-6 space-y-4">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] px-2">
                Contato & Registro
              </h3>
              <div className="flex items-center gap-3 px-2 text-sm text-zinc-300">
                <Mail size={16} className="text-zinc-600" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-3 px-2 text-sm text-zinc-300">
                <Calendar size={16} className="text-zinc-600" />
                <span>Desde {formatDate(member.joinedAt)}</span>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: ESTATÍSTICAS E TASKS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                icon={<Trophy className="text-amber-400" />}
                value={completedTasks}
                label="Concluídas"
              />
              <StatsCard
                icon={<Clock className="text-indigo-400" />}
                value={pendingTasks}
                label="Pendentes"
              />
              <StatsCard
                icon={<Briefcase className="text-emerald-400" />}
                value={userTasks.length}
                label="Total de Tasks"
              />
            </div>

            <div className="bg-[#080808]/60 border border-white/[0.05] rounded-[2.5rem] overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Briefcase size={16} className="text-indigo-400" /> Tarefas
                  Atribuídas
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {userTasks.length === 0 ? (
                  <div className="p-12 text-center text-zinc-600 text-sm italic">
                    Nenhuma tarefa vinculada a este perfil.
                  </div>
                ) : (
                  userTasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-5 flex items-center justify-between group hover:bg-white/[0.01]"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${task.status === "done" ? "bg-emerald-500" : "bg-indigo-500"}`}
                        />
                        <div>
                          <p className="text-sm font-bold text-zinc-200">
                            {task.title}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase">
                            {task.taskKey}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${task.status === "done" ? "border-emerald-500/20 text-emerald-500" : "border-white/10 text-zinc-500"}`}
                      >
                        {task.status}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatsCard({ icon, value, label }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
      <div className="mb-4">{icon}</div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}
