"use client";

import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Search,
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const { activeProject } = useData();
  const router = useRouter();

  // Estados para os dados do Firebase
  const [membersWithStats, setMembersWithStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Função para buscar a contagem de tarefas de cada membro
  const fetchTasksCount = async (membersList: any[]) => {
    if (!activeProject?.id) return;

    try {
      const updatedMembers = await Promise.all(
        membersList.map(async (member) => {
          // Busca tarefas no Firestore onde o 'assignee' é o nome do membro
          const q = query(
            collection(db, "projects", activeProject.id, "tasks"),
            where("assignee", "==", member.name),
          );
          const snapshot = await getDocs(q);

          return {
            ...member,
            taskCount: snapshot.size, // Quantidade real de tarefas do Firebase
          };
        }),
      );
      setMembersWithStats(updatedMembers);
    } catch (error) {
      console.error("Erro ao buscar estatísticas dos membros:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Listener em tempo real para a lista de membros do projeto
  useEffect(() => {
    if (!activeProject?.id) return;

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, "projects", activeProject.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const projectData = docSnap.data();
          const membersList = projectData.members || [];
          fetchTasksCount(membersList);
        } else {
          setIsLoading(false);
        }
      },
    );

    return () => unsubscribe();
  }, [activeProject?.id]);

  // Função para formatar a data de entrada (joinedAt)
  const formatJoinedDate = (date: any) => {
    if (!date) return "Data indefinida";
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Users size={48} className="mb-4 opacity-20" />
        <p>Selecione um projeto para ver a equipe.</p>
      </div>
    );
  }

  // Filtra os membros baseados na busca
  const filteredMembers = membersWithStats.filter(
    (m: any) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    alert(
      `Funcionalidade de convite real para ${inviteEmail} (Integração de Backend necessária)`,
    );
    setInviteEmail("");
  };

  // Dispara evento para o layout abrir o chat com o membro
  const openChatWithMember = (member: any) => {
    window.dispatchEvent(
      new CustomEvent("open-global-chat", { detail: member }),
    );
  };

  return (
    <main className="flex-1 p-6 lg:p-10 bg-[#050505] relative overflow-y-auto custom-scrollbar h-full">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Equipe
            </h1>
            <p className="text-zinc-500 text-sm font-medium">
              Gere os colaboradores de{" "}
              <span className="text-indigo-400">@{activeProject.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl flex items-center gap-6 backdrop-blur-md">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                  Total
                </p>
                <p className="text-lg font-bold text-white">
                  {membersWithStats.length}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                  Online
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-lg font-bold text-emerald-500">Live</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Invite & Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Procurar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080808]/60 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-indigo-500/50 transition-all backdrop-blur-md"
            />
          </div>

          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="relative flex-1">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                size={18}
              />
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full bg-[#080808]/60 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-indigo-500/50 transition-all backdrop-blur-md"
              />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
              <UserPlus size={20} />
            </button>
          </form>
        </div>

        {/* Members Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
              Sincronizando equipe...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((member: any, index: number) => (
                <motion.div
                  key={member.email || index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-[#080808]/40 border border-white/[0.05] rounded-[2rem] p-6 hover:bg-white/[0.02] hover:border-white/10 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        Ativo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <img
                        src={
                          member.photoURL ||
                          `https://ui-avatars.com/api/?name=${member.name}&background=6366f1&color=fff`
                        }
                        alt={member.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-[#050505] p-1 rounded-lg">
                        <div className="bg-indigo-500/20 p-1 rounded-md">
                          <Shield size={12} className="text-indigo-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-xs text-zinc-500 truncate mb-2">
                        {member.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                          {member.role || "Developer"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <button
                      onClick={() =>
                        router.push(
                          `/membros/${encodeURIComponent(member.email || member.name)}`,
                        )
                      }
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-all"
                    >
                      <ExternalLink size={14} /> Perfil
                    </button>

                    {/* BOTÃO MENSAGEM ATUALIZADO AQUI 👇 */}
                    <button
                      onClick={() => openChatWithMember(member)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-all"
                    >
                      <MessageCircle size={14} /> Mensagem
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> Entrou em{" "}
                      {formatJoinedDate(member.joinedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={10} /> {member.taskCount || 0} Tasks
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && filteredMembers.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
              <Users className="text-zinc-700" size={32} />
            </div>
            <h3 className="text-white font-bold">Nenhum membro encontrado</h3>
            <p className="text-zinc-500 text-sm">
              Tente ajustar a sua pesquisa ou convide alguém novo.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
