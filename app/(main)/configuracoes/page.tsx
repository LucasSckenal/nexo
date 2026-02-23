"use client";

import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import {
  Globe,
  Users,
  Save,
  AlertTriangle,
  Wifi,
  Settings,
  Loader2,
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  Link as LinkIcon,
  Github,
  KeyRound,
  ExternalLink,
  Crown,
  Camera,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { activeProject } = useData();
  const [activeTab, setActiveTab] = useState<
    "general" | "members" | "integrations"
  >("general");

  // Estados de Formulário e UI
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">(
    "synced",
  );
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  // Referência para o input de ficheiro oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Campos - Geral & Integrações
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");

  // Campos - Membros
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink =
    typeof window !== "undefined" && activeProject
      ? `${window.location.origin}/convite/${activeProject.id}`
      : "";

  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name || "");
      setProjectKey(activeProject.key || "");
      setProjectDescription(activeProject.description || "");
      setGithubRepo(activeProject.githubRepo || "");
      setGithubToken(activeProject.githubToken || "");
      setIsDirty(false);
    }
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const hasChanges =
      projectName !== (activeProject.name || "") ||
      projectKey !== (activeProject.key || "") ||
      projectDescription !== (activeProject.description || "") ||
      githubRepo !== (activeProject.githubRepo || "") ||
      githubToken !== (activeProject.githubToken || "");

    setIsDirty(hasChanges);
  }, [
    projectName,
    projectKey,
    projectDescription,
    githubRepo,
    githubToken,
    activeProject,
  ]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] h-full w-full">
        <Settings size={48} className="text-zinc-800 mb-4 animate-spin-slow" />
        <h2 className="text-xl font-bold text-white mb-2">
          Nenhum Projeto Selecionado
        </h2>
        <p className="text-zinc-500 text-sm">
          Selecione um projeto na barra lateral para configurar.
        </p>
      </div>
    );
  }

  const isOwner = auth.currentUser?.uid === activeProject.ownerId;

  const handleDiscard = () => {
    setProjectName(activeProject.name || "");
    setProjectKey(activeProject.key || "");
    setProjectDescription(activeProject.description || "");
    setGithubRepo(activeProject.githubRepo || "");
    setGithubToken(activeProject.githubToken || "");
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!projectName.trim() || !projectKey.trim()) return;
    setIsSaving(true);
    setSyncStatus("saving");

    const cleanRepoSlug = githubRepo
      .replace("https://github.com/", "")
      .replace(".git", "");

    try {
      await updateDoc(doc(db, "projects", activeProject.id), {
        name: projectName.trim(),
        key: projectKey.trim().toUpperCase(),
        description: projectDescription.trim(),
        githubRepo: cleanRepoSlug,
        githubToken: githubToken.trim(),
      });
      setGithubRepo(cleanRepoSlug);
      setIsDirty(false);
      setSyncStatus("synced");
      showToast("Configurações guardadas com sucesso!");
    } catch (error) {
      console.error(error);
      setSyncStatus("error");
      showToast("Erro ao guardar alterações.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FUNÇÃO PARA UPLOAD DO AVATAR ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limitar tamanho a 2MB
    if (file.size > 2000000) {
      showToast("O ficheiro é demasiado grande. Máximo de 2MB.", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64String = reader.result as string;

      try {
        await updateDoc(doc(db, "projects", activeProject.id), {
          imageUrl: base64String,
        });
        showToast("Logótipo atualizado com sucesso!");
      } catch (error) {
        console.error("Erro no upload do logótipo:", error);
        showToast("Erro ao atualizar o logótipo.", "error");
      } finally {
        setIsUploadingLogo(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDisconnectGithub = async () => {
    if (!confirm("Tem a certeza que deseja desconectar o GitHub?")) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "projects", activeProject.id), {
        githubRepo: "",
        githubToken: "",
      });
      setGithubRepo("");
      setGithubToken("");
      showToast("Integração do GitHub removida.");
    } catch (error) {
      showToast("Erro ao desconectar GitHub.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    setIsSaving(true);
    try {
      const currentMembers = activeProject.members || [];
      const currentMemberEmails = activeProject.memberEmails || [];

      if (currentMemberEmails.includes(inviteEmail.trim())) {
        showToast("Este utilizador já faz parte do projeto.", "error");
        setIsSaving(false);
        return;
      }

      const newMember = {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        photoURL: `https://ui-avatars.com/api/?name=${inviteName.trim()}&background=0D0D0D&color=fff`,
        addedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "projects", activeProject.id), {
        members: [...currentMembers, newMember],
        memberEmails: [...currentMemberEmails, inviteEmail.trim()],
      });

      setIsInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("member");
      showToast("Membro convidado com sucesso!");
    } catch (error) {
      showToast("Erro ao adicionar membro.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (emailToRemove: string) => {
    if (!confirm("Tem certeza que deseja remover este membro da equipe?"))
      return;
    try {
      const updatedMembers = (activeProject.members || []).filter(
        (m: any) => m.email !== emailToRemove,
      );
      const updatedMemberEmails = (activeProject.memberEmails || []).filter(
        (email: string) => email !== emailToRemove,
      );

      await updateDoc(doc(db, "projects", activeProject.id), {
        members: updatedMembers,
        memberEmails: updatedMemberEmails,
      });
      showToast("Membro removido do projeto.");
    } catch (error) {
      showToast("Erro ao remover membro.", "error");
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-full bg-[#050505] text-zinc-200 p-8 pb-32 relative custom-scrollbar w-full">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div
              className={`flex items-center gap-3 px-6 py-3 rounded-full border shadow-2xl backdrop-blur-md ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span className="text-sm font-bold tracking-wide">
                {toast.msg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="w-full max-w-[1000px] mx-auto mb-10 pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Configurações do Projeto
          </h1>
          <p className="text-zinc-500 text-sm">
            Gerencie o projeto{" "}
            <strong className="text-white">{activeProject.name}</strong> e as
            suas preferências.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-sm shrink-0 ${syncStatus === "synced" && !isDirty ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : syncStatus === "saving" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-white/[0.02] border-white/10 text-zinc-400"}`}
        >
          {syncStatus === "synced" && !isDirty && <Wifi size={14} />}
          {syncStatus === "saving" && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {isDirty && syncStatus !== "saving" && (
            <AlertTriangle size={14} className="text-amber-400" />
          )}
          {syncStatus === "saving"
            ? "A guardar..."
            : isDirty
              ? "Alterações pendentes"
              : "Sincronizado"}
        </div>
      </div>

      <div className="w-full max-w-[1000px] mx-auto flex flex-col md:flex-row gap-10">
        {/* MENU LATERAL */}
        <nav className="w-full md:w-56 shrink-0 flex flex-col gap-1.5">
          <SidebarItem
            icon={<Globe size={18} />}
            label="Geral"
            isActive={activeTab === "general"}
            onClick={() => setActiveTab("general")}
          />
          <SidebarItem
            icon={<Users size={18} />}
            label="equipe"
            isActive={activeTab === "members"}
            onClick={() => setActiveTab("members")}
          />
          <SidebarItem
            icon={<Github size={18} />}
            label="Integrações"
            isActive={activeTab === "integrations"}
            onClick={() => setActiveTab("integrations")}
          />
        </nav>

        {/* CONTEÚDO */}
        <div className="flex-1 space-y-8">
          {/* ABA GERAL */}
          {activeTab === "general" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Identidade do Projeto
                  </h2>
                  <p className="text-sm text-zinc-500">
                    O nome e a chave são usados para gerar os IDs das tarefas.
                  </p>
                </div>

                <div className="p-8 space-y-8">
                  {/* Avatar Section - COM UPLOAD REAL */}
                  <div className="flex items-center gap-6">
                    {/* Input Ficheiro Oculto */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                      accept="image/*"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20 relative group cursor-pointer overflow-hidden border border-white/5 bg-gradient-to-br from-indigo-500 to-purple-600"
                    >
                      {isUploadingLogo ? (
                        <Loader2
                          size={24}
                          className="animate-spin text-white"
                        />
                      ) : activeProject.imageUrl ? (
                        <img
                          src={activeProject.imageUrl}
                          alt="Logo do Projeto"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{projectKey.substring(0, 2) || "PR"}</span>
                      )}

                      {!isUploadingLogo && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <Camera size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">
                        Logótipo do Projeto
                      </h3>
                      <p className="text-xs text-zinc-500 mb-3">
                        Clique para enviar uma imagem quadrada (Máx: 2MB).
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                      >
                        {isUploadingLogo ? "A processar..." : "Alterar Avatar"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                        Nome do Projeto
                      </label>
                      <input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                        Chave (ID Base)
                      </label>
                      <input
                        value={projectKey}
                        onChange={(e) =>
                          setProjectKey(e.target.value.toUpperCase())
                        }
                        maxLength={5}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-indigo-400 font-mono font-bold focus:border-indigo-500 outline-none transition-all uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                      Descrição
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* DANGER ZONE */}
              {isOwner && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-red-500/20 transition-all duration-700" />
                  <h3 className="text-lg font-black text-red-500 mb-2 flex items-center gap-2 relative z-10">
                    <AlertTriangle size={20} /> Zona de Perigo
                  </h3>
                  <p className="text-sm text-red-400/70 mb-6 relative z-10">
                    Esta ação irá apagar permanentemente o projeto, todas as
                    tarefas, sprints e anexos. Isto não pode ser revertido.
                  </p>
                  <button className="relative z-10 bg-[#050505] text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/10">
                    Apagar Projeto
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ABA MEMBROS */}
          {activeTab === "members" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Membros do Projeto
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Gerencie acessos e convide novos colaboradores para a
                    equipe.
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Plus size={16} strokeWidth={3} /> Convidar
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Link Rápido */}
                <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <LinkIcon size={16} className="text-indigo-400" /> Convite
                      Rápido
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Envie este link para convidar membros diretamente.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-1.5 w-full md:w-auto md:min-w-[300px]">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-transparent text-xs text-zinc-400 px-3 outline-none font-mono truncate"
                    />
                    <button
                      onClick={copyInviteLink}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${copiedLink ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-300 hover:bg-white/10"}`}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}{" "}
                      {copiedLink ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* Lista de Membros */}
                <div className="border border-white/5 rounded-2xl overflow-hidden">
                  <div className="bg-white/[0.02] grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <div className="col-span-6 md:col-span-5">Utilizador</div>
                    <div className="col-span-3 hidden md:block">Status</div>
                    <div className="col-span-4 md:col-span-3">Função</div>
                    <div className="col-span-2 md:col-span-1 text-right">
                      Ações
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {(activeProject.members || []).map(
                      (member: any, idx: number) => {
                        const isUserOwner =
                          member.email === auth.currentUser?.email;
                        const isAdmin = member.role === "admin";
                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.01] transition-colors"
                          >
                            <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                              <img
                                src={member.photoURL}
                                alt=""
                                className="w-8 h-8 rounded-full border border-white/10"
                              />
                              <div className="truncate">
                                <p className="text-sm font-bold text-white truncate">
                                  {member.name}
                                </p>
                                <p className="text-[11px] text-zinc-500 truncate">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                            <div className="col-span-3 hidden md:flex items-center">
                              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
                                Ativo
                              </span>
                            </div>
                            <div className="col-span-4 md:col-span-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${isAdmin ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-zinc-400"}`}
                              >
                                {isAdmin && <Crown size={12} />}{" "}
                                {isAdmin ? "Administrador" : "Membro"}
                              </span>
                            </div>
                            <div className="col-span-2 md:col-span-1 flex justify-end">
                              {!isUserOwner ? (
                                <button
                                  onClick={() =>
                                    handleRemoveMember(member.email)
                                  }
                                  className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all"
                                  title="Remover"
                                >
                                  <LogOut size={16} />
                                </button>
                              ) : (
                                <div className="w-8" />
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA INTEGRAÇÕES */}
          {activeTab === "integrations" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5">
                <h2 className="text-lg font-bold text-white mb-1">
                  Integrações de Pipeline
                </h2>
                <p className="text-sm text-zinc-500">
                  Conecte repositórios para visualizar commits e pull requests.
                </p>
              </div>

              <div className="p-8">
                <div
                  className={`border rounded-3xl p-8 transition-all relative overflow-hidden ${activeProject.githubRepo ? "bg-indigo-500/5 border-indigo-500/20" : "bg-[#050505] border-white/10"}`}
                >
                  {activeProject.githubRepo && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                  )}

                  <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <Github className="text-white" size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">
                          GitHub
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Sincronização de Código e Branches
                        </p>
                      </div>
                    </div>
                    {activeProject.githubRepo && (
                      <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                        <Check size={14} /> Conectado
                      </span>
                    )}
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Repositório GitHub
                      </label>
                      <input
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="Ex: Utilizador/Nome-do-Repo"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <KeyRound size={12} /> Personal Access Token (Classic)
                      </label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {activeProject.githubRepo && (
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                      <a
                        href={`https://github.com/${activeProject.githubRepo}`}
                        target="_blank"
                        className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2"
                      >
                        Abrir Repositório <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={handleDisconnectGithub}
                        className="text-[10px] uppercase tracking-widest text-red-500 hover:text-white font-black px-4 py-2 rounded-lg hover:bg-red-500 border border-red-500/20 transition-all"
                      >
                        Desconectar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* FLOAT SAVE BAR */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 left-8 md:left-auto bg-[#0A0A0A] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-2xl p-3 pl-6 flex flex-col sm:flex-row items-center justify-between gap-6 z-50"
          >
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle size={20} />
              <div className="flex flex-col">
                <span className="text-sm font-bold">Alterações Pendentes</span>
                <span className="text-[11px] text-amber-400/70">
                  Salve para aplicar as configurações.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDiscard}
                className="flex-1 sm:flex-none px-4 py-3 text-xs font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
              >
                Reverter
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}{" "}
                Salvar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONVITE */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Convidar Membro
                  </h2>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm text-zinc-500">
                  Adicione novas pessoas ao projeto{" "}
                  <strong className="text-white">{activeProject.name}</strong>.
                </p>
              </div>

              <form onSubmit={handleInviteMember} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="joao@exemplo.com"
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                    Nível de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInviteRole("member")}
                      className={`p-4 rounded-2xl border text-left transition-all ${inviteRole === "member" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-[#050505] border-white/5 text-zinc-500 hover:border-white/20"}`}
                    >
                      <span className="text-sm font-black block mb-1">
                        Membro
                      </span>
                      <span className="text-[10px] leading-relaxed block font-medium">
                        Ler e edita tarefas.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole("admin")}
                      className={`p-4 rounded-2xl border text-left transition-all ${inviteRole === "admin" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-[#050505] border-white/5 text-zinc-500 hover:border-white/20"}`}
                    >
                      <span className="text-sm font-black flex items-center gap-1.5 mb-1">
                        <Crown size={14} /> Admin
                      </span>
                      <span className="text-[10px] leading-relaxed block font-medium">
                        Acesso total.
                      </span>
                    </button>
                  </div>
                </div>
                <div className="pt-4 mt-6 border-t border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Convidar"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"}`}
    >
      <div className={`${isActive ? "text-indigo-400" : "text-zinc-500"}`}>
        {icon}
      </div>
      {label}
    </button>
  );
}
