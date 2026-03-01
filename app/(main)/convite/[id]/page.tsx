"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  Users,
  AlertTriangle,
  ArrowRight,
  LogIn,
  Fingerprint,
  Sparkles,
} from "lucide-react";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<
    "loading" | "not-found" | "ready" | "joining" | "success" | "already-member"
  >("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!projectId) {
        setStatus("not-found");
        return;
      }

      try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          setProject(projectData);

          if (currentUser) {
            const isAlreadyMember = projectData.memberEmails?.includes(
              currentUser.email,
            );
            if (isAlreadyMember) {
              setStatus("already-member");
              return;
            }
          }
          setStatus("ready");
        } else {
          setStatus("not-found");
        }
      } catch (error) {
        console.error("Erro ao buscar projeto:", error);
        setStatus("not-found");
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleJoinProject = async () => {
    if (!user || !user.email || !project) return;
    setStatus("joining");

    try {
      const projectRef = doc(db, "projects", projectId);

      const newMember = {
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        role: "member",
        photoURL:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${user.email}&background=27272A&color=fff`,
        addedAt: new Date().toISOString(),
      };

      const currentMembers = project.members || [];
      const currentMemberEmails = project.memberEmails || [];

      await updateDoc(projectRef, {
        members: [...currentMembers, newMember],
        memberEmails: [...currentMemberEmails, user.email],
      });

      setStatus("success");

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Erro ao entrar no projeto:", error);
      setStatus("ready");
      alert("Ocorreu um erro ao tentar entrar no projeto. Tente novamente.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bgMain flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 size={48} className="text-indigo-500 animate-spin mb-6" />
          <p className="text-[10px] font-black uppercase tracking-widest text-textMuted animate-pulse">
            Verificando convite de acesso...
          </p>
        </div>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen bg-bgMain flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-bgPanel border border-borderSubtle p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black text-textPrimary tracking-tight mb-2">
            Convite Inválido
          </h2>
          <p className="text-textSecondary text-sm mb-8 leading-relaxed">
            Este projeto não existe ou o link de convite expirou. Solicite um novo acesso ao administrador.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-bgSurface hover:bg-bgSurfaceHover text-textPrimary py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-borderFocus"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeitos Visuais de Fundo */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-bgPanel border border-borderSubtle p-10 rounded-[3rem] max-w-lg w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* AVATAR DO PROJETO */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full" />
          {project?.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={`Logo de ${project.name}`}
              className="w-full h-full object-cover rounded-3xl border-2 border-borderFocus relative z-10 shadow-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black relative z-10 shadow-lg border border-white/20">
              {project?.key ? project.key.substring(0, 2) : <Users size={32} />}
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
            <Sparkles size={12} />
            Convite Exclusivo
          </div>
          <h1 className="text-3xl font-black text-textPrimary tracking-tighter mb-3 leading-tight">
            Você foi convidado(a) para a equipe!
          </h1>
          <p className="text-textSecondary text-sm font-medium leading-relaxed">
            Faça parte do projeto <strong className="text-textPrimary">{project?.name}</strong> e comece a colaborar instantaneamente.
          </p>
        </div>

        {/* ESTATÍSTICAS DO PROJETO EM GLASSMORPHISM */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-bgSurface border border-borderSubtle rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Fingerprint size={16} className="text-textMuted mb-2" />
            <span className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-1">
              Chave do Workspace
            </span>
            <span className="text-sm font-black text-textPrimary uppercase">
              {project?.key}
            </span>
          </div>
          <div className="bg-bgSurface border border-borderSubtle rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Users size={16} className="text-textMuted mb-2" />
            <span className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-1">
              Membros Atuais
            </span>
            <span className="text-sm font-black text-textPrimary">
              {project?.members?.length || 0} Integrantes
            </span>
          </div>
        </div>

        {/* ÁREA DE AÇÕES */}
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <p className="text-xs font-bold text-textMuted uppercase tracking-widest mb-4">
                Autenticação Necessária
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-textPrimary hover:opacity-90 text-bgMain py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <LogIn size={16} strokeWidth={3} /> Fazer Login
              </button>
            </motion.div>
          ) : status === "already-member" ? (
            <motion.div 
              key="already"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <div className="flex flex-col items-center justify-center gap-3 text-emerald-500 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Check size={24} />
                </div>
                <span className="font-bold text-sm">
                  Você já faz parte deste projeto!
                </span>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-bgSurface hover:bg-bgSurfaceHover text-textPrimary py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-borderFocus active:scale-95"
              >
                Acessar o Projeto <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : status === "success" ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-textPrimary tracking-tight mb-2">
                Sucesso Absoluto!
              </h3>
              <p className="text-sm font-medium text-textMuted">
                A preparar o seu ambiente de trabalho...
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleJoinProject}
              disabled={status === "joining"}
              className="w-full relative group bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              {status === "joining" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  Aceitar Convite e Entrar <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}