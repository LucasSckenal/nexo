"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase"; // Ajuste o caminho se necessário
import { onAuthStateChanged } from "firebase/auth";
import {
  Check,
  Loader2,
  Users,
  AlertTriangle,
  ArrowRight,
  LogIn,
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

      // Adiciona ao array visual e ao array de segurança (memberEmails)
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
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center">
        <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Verificando convite...</p>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-4">
        <div className="bg-[#121214] border border-[#27272A] p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Convite Inválido
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Este projeto não existe ou o link expirou.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#1A1A1E] hover:bg-[#27272A] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all w-full"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#27272A] p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
        {/* AVATAR DO PROJETO - MOSTRA A IMAGEM SE EXISTIR */}
        {project?.imageUrl ? (
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden border border-white/5 shadow-lg shadow-indigo-500/20">
            <img
              src={project.imageUrl}
              alt={`Logo de ${project.name}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white text-2xl font-black">
            {project?.key ? project.key.substring(0, 2) : <Users size={32} />}
          </div>
        )}

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Convite para Projeto
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-8">
          Você foi convidado(a) para integrar a equipe do projeto{" "}
          <strong className="text-zinc-200">{project?.name}</strong>.
        </p>

        <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase">
              Chave
            </span>
            <span className="text-xs font-mono font-bold text-zinc-300 bg-[#1A1A1E] px-2 py-0.5 rounded">
              {project?.key}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase">
              Equipe
            </span>
            <span className="text-xs font-medium text-zinc-300">
              {project?.members?.length || 0} membros
            </span>
          </div>
        </div>

        {!user ? (
          <div className="text-center">
            <p className="text-sm text-zinc-500 mb-4">
              Faça login com a sua conta para aceitar este convite.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Fazer Login
            </button>
          </div>
        ) : status === "already-member" ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-500 mb-4">
              <Check size={20} />
              <span className="font-semibold">
                Você já é membro deste projeto!
              </span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-[#1A1A1E] hover:bg-[#27272A] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-[#3F3F46]"
            >
              Acessar o Projeto <ArrowRight size={16} />
            </button>
          </div>
        ) : status === "success" ? (
          <div className="text-center animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Bem-vindo à equipe!
            </h3>
            <p className="text-sm text-zinc-500">
              Redirecionando para o dashboard...
            </p>
          </div>
        ) : (
          <button
            onClick={handleJoinProject}
            disabled={status === "joining"}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === "joining" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Aceitar Convite e Entrar"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
