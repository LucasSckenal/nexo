"use client";

import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
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
  Columns,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Smile,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Emojis Curados para o Kanban
const KANBAN_EMOJIS = [
  "📝",
  "📌",
  "🚀",
  "⏳",
  "👀",
  "✅",
  "🎉",
  "🛑",
  "🐛",
  "🔥",
  "📦",
  "🛠️",
  "🎯",
  "🧠",
  "💡",
  "⚡",
];

// Colunas padrão com Emojis
const DEFAULT_COLUMNS = [
  { id: "todo", title: "A Fazer", color: "zinc", limit: 0, emoji: "📝" },
  {
    id: "in-progress",
    title: "Em Curso",
    color: "indigo",
    limit: 4,
    emoji: "🚀",
  },
  { id: "review", title: "Revisão", color: "purple", limit: 3, emoji: "👀" },
  { id: "done", title: "Concluído", color: "emerald", limit: 0, emoji: "✅" },
];

const AVAILABLE_COLORS = [
  { name: "zinc", bg: "bg-zinc-500", label: "Cinza" },
  { name: "indigo", bg: "bg-indigo-500", label: "Índigo" },
  { name: "purple", bg: "bg-purple-500", label: "Roxo" },
  { name: "emerald", bg: "bg-emerald-500", label: "Verde" },
  { name: "red", bg: "bg-red-500", label: "Vermelho" },
  { name: "amber", bg: "bg-amber-500", label: "Amarelo" },
  { name: "blue", bg: "bg-blue-500", label: "Azul" },
];

export default function SettingsPage() {
  const { activeProject } = useData();
  const [activeTab, setActiveTab] = useState<
    "general" | "members" | "integrations" | "board"
  >("general");

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Campos - Identidade do Projeto
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Ícone Figma-like (Emoji ou Imagem)
  const [iconType, setIconType] = useState<"image" | "emoji">("image");
  const [projectEmoji, setProjectEmoji] = useState("✨");

  // Integrações e Quadro
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [boardColumns, setBoardColumns] = useState<any[]>([]);

  // Estados de UI do Quadro
  const [activeEmojiDropdown, setActiveEmojiDropdown] = useState<number | null>(
    null,
  );
  const [uploadingBannerIndex, setUploadingBannerIndex] = useState<
    number | null
  >(null);

  // Membros
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink =
    typeof window !== "undefined" && activeProject
      ? `${window.location.origin}/convite/${activeProject.id}`
      : "";

  // Fechar dropdown de emojis ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setActiveEmojiDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name || "");
      setProjectKey(activeProject.key || "");
      setProjectDescription(activeProject.description || "");
      setGithubRepo(activeProject.githubRepo || "");
      setGithubToken(activeProject.githubToken || "");
      setBoardColumns(activeProject.boardColumns || DEFAULT_COLUMNS);
      setIconType(
        activeProject.iconType || (activeProject.imageUrl ? "image" : "emoji"),
      );
      setProjectEmoji(activeProject.projectEmoji || "✨");
      setIsDirty(false);
    }
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const currentColsStr = JSON.stringify(boardColumns);
    const savedColsStr = JSON.stringify(
      activeProject.boardColumns || DEFAULT_COLUMNS,
    );
    const hasChanges =
      projectName !== (activeProject.name || "") ||
      projectKey !== (activeProject.key || "") ||
      projectDescription !== (activeProject.description || "") ||
      githubRepo !== (activeProject.githubRepo || "") ||
      githubToken !== (activeProject.githubToken || "") ||
      iconType !==
        (activeProject.iconType ||
          (activeProject.imageUrl ? "image" : "emoji")) ||
      projectEmoji !== (activeProject.projectEmoji || "✨") ||
      currentColsStr !== savedColsStr;
    setIsDirty(hasChanges);
  }, [
    projectName,
    projectKey,
    projectDescription,
    githubRepo,
    githubToken,
    boardColumns,
    iconType,
    projectEmoji,
    activeProject,
  ]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
  };

  const handleDiscard = () => {
    setProjectName(activeProject.name || "");
    setProjectKey(activeProject.key || "");
    setProjectDescription(activeProject.description || "");
    setGithubRepo(activeProject.githubRepo || "");
    setGithubToken(activeProject.githubToken || "");
    setBoardColumns(activeProject.boardColumns || DEFAULT_COLUMNS);
    setIconType(
      activeProject.iconType || (activeProject.imageUrl ? "image" : "emoji"),
    );
    setProjectEmoji(activeProject.projectEmoji || "✨");
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
        boardColumns: boardColumns,
        iconType: iconType,
        projectEmoji: projectEmoji,
      });
      setGithubRepo(cleanRepoSlug);
      setIsDirty(false);
      setSyncStatus("synced");
      showToast("Configurações guardadas com sucesso!");
    } catch (error) {
      setSyncStatus("error");
      showToast("Erro ao guardar alterações.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2000000) {
      showToast("Máximo de 2MB para a imagem.", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateDoc(doc(db, "projects", activeProject.id), {
          imageUrl: reader.result as string,
          iconType: "image",
        });
        setIconType("image");
        showToast("Logótipo atualizado com sucesso!");
      } catch (error) {
        showToast("Erro ao atualizar o logótipo.", "error");
      } finally {
        setIsUploadingLogo(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingBannerIndex === null) return;
    if (file.size > 2000000) {
      showToast("Máximo de 2MB para o banner.", "error");
      if (bannerInputRef.current) bannerInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newCols = [...boardColumns];
      newCols[uploadingBannerIndex].bannerUrl = reader.result as string;
      setBoardColumns(newCols);
      setUploadingBannerIndex(null);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
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

  // Funções do Quadro Kanban
  const addColumn = () => {
    const newCol = {
      id: `col-${Date.now()}`,
      title: "Nova Coluna",
      color: "zinc",
      limit: 0,
      emoji: "✨",
      bannerUrl: "",
    };
    setBoardColumns([...boardColumns, newCol]);
  };

  const updateColumn = (index: number, field: string, value: string) => {
    const newCols = [...boardColumns];
    newCols[index] = { ...newCols[index], [field]: value };
    setBoardColumns(newCols);
  };

  const removeColumn = (index: number) => {
    if (
      confirm(
        "Tem a certeza que deseja remover esta coluna? As tarefas não serão apagadas, mas deixarão de aparecer.",
      )
    ) {
      const newCols = [...boardColumns];
      newCols.splice(index, 1);
      setBoardColumns(newCols);
    }
  };

  const moveColumn = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === boardColumns.length - 1) return;
    const newCols = [...boardColumns];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;
    setBoardColumns(newCols);
  };

  if (!activeProject) return null;

  return (
    <div className="min-h-full bg-[#050505] text-zinc-200 p-8 pb-32 relative custom-scrollbar w-full">
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
        <nav className="w-full md:w-56 shrink-0 flex flex-col gap-1.5">
          <SidebarItem
            icon={<Globe size={18} />}
            label="Geral"
            isActive={activeTab === "general"}
            onClick={() => setActiveTab("general")}
          />
          <SidebarItem
            icon={<Columns size={18} />}
            label="Quadro Kanban"
            isActive={activeTab === "board"}
            onClick={() => setActiveTab("board")}
          />
          <SidebarItem
            icon={<Users size={18} />}
            label="Equipa"
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
                    O nome, a chave e o ícone são usados em toda a sua área de
                    trabalho.
                  </p>
                </div>
                <div className="p-8 space-y-10">
                  {/* SEÇÃO FIGMA-LIKE DO ÍCONE */}
                  <div className="flex items-center gap-8">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                      accept="image/*"
                    />

                    {/* Visualização do Avatar/Ícone */}
                    <div className="w-28 h-28 shrink-0 rounded-[2rem] flex items-center justify-center text-5xl font-black shadow-2xl relative overflow-hidden border-2 border-white/10 bg-[#121212]">
                      {isUploadingLogo ? (
                        <Loader2
                          size={32}
                          className="animate-spin text-zinc-500"
                        />
                      ) : iconType === "emoji" ? (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                          <span className="drop-shadow-xl scale-125 transform transition-transform hover:scale-150">
                            {projectEmoji || "✨"}
                          </span>
                        </div>
                      ) : activeProject.imageUrl ? (
                        <img
                          src={activeProject.imageUrl}
                          alt="Logo"
                          className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                          <span className="text-indigo-400 drop-shadow-md">
                            {projectKey.substring(0, 2) || "PR"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Controlos do Ícone (Imagem vs Emoji) */}
                    <div className="space-y-3 flex-1">
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1">
                          Ícone Personalizado
                        </h3>
                        <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                          Escolha entre fazer upload de uma imagem quadrada
                          (Máx. 2MB) ou usar um emoji elegante (Estilo Figma).
                        </p>
                      </div>

                      <div className="flex items-center gap-3 bg-white/[0.02] p-1.5 rounded-xl border border-white/5 w-fit">
                        {/* Botão de Imagem */}
                        <button
                          onClick={() => {
                            if (!activeProject.imageUrl) {
                              fileInputRef.current?.click();
                            } else {
                              setIconType("image");
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${iconType === "image" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm" : "text-zinc-400 hover:bg-white/5 border border-transparent"}`}
                        >
                          <ImageIcon size={14} /> Imagem
                        </button>

                        <div className="w-px h-5 bg-white/10" />

                        {/* Input de Emoji */}
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${iconType === "emoji" ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm" : "text-zinc-400 border-transparent hover:bg-white/5 focus-within:border-white/20"}`}
                        >
                          <Smile
                            size={14}
                            className={
                              iconType === "emoji"
                                ? "text-amber-400"
                                : "text-zinc-500"
                            }
                          />
                          <input
                            type="text"
                            value={projectEmoji}
                            onChange={(e) => {
                              setProjectEmoji(e.target.value);
                              setIconType("emoji");
                            }}
                            onFocus={() => setIconType("emoji")}
                            maxLength={2}
                            className="bg-transparent w-10 text-center outline-none placeholder:text-zinc-600 focus:w-12 transition-all"
                            placeholder="😀"
                          />
                        </div>
                      </div>

                      {iconType === "image" && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-white transition-colors"
                        >
                          Fazer upload de nova imagem
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
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
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA QUADRO KANBAN (COM BANNERS DESTACADOS) */}
          {activeTab === "board" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Capa das Colunas
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Faça o upload de banners ou selecione Emojis para o topo das
                    colunas.
                  </p>
                </div>
                <button
                  onClick={addColumn}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Nova Coluna
                </button>
              </div>

              {/* Input escondido para Banners */}
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                className="hidden"
                accept="image/*"
              />

              <div className="p-8 space-y-6">
                {boardColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className="bg-[#050505] border border-white/5 rounded-2xl overflow-hidden group transition-all hover:border-white/20"
                  >
                    {/* ÁREA DE CAPA (BANNER) */}
                    <div className="h-20 w-full relative bg-white/[0.02] border-b border-white/5 flex items-center justify-center overflow-hidden">
                      {col.bannerUrl ? (
                        <>
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${col.bannerUrl})` }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                            <button
                              onClick={() => {
                                setUploadingBannerIndex(idx);
                                bannerInputRef.current?.click();
                              }}
                              className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold shadow-lg"
                            >
                              Alterar Capa
                            </button>
                            <button
                              onClick={() => updateColumn(idx, "bannerUrl", "")}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg"
                            >
                              Remover
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setUploadingBannerIndex(idx);
                            bannerInputRef.current?.click();
                          }}
                          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold"
                        >
                          <ImageIcon size={16} /> Adicionar Banner de Capa
                        </button>
                      )}
                    </div>

                    {/* CONTROLOS INFERIORES */}
                    <div className="p-4 flex items-center gap-4">
                      <div className="flex flex-col gap-1 text-zinc-600">
                        <button
                          type="button"
                          onClick={() => moveColumn(idx, "up")}
                          disabled={idx === 0}
                          className="hover:text-white disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveColumn(idx, "down")}
                          disabled={idx === boardColumns.length - 1}
                          className="hover:text-white disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      {/* EMOJI PICKER (Figma Style) */}
                      <div className="shrink-0 relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEmojiDropdown(
                              activeEmojiDropdown === idx ? null : idx,
                            );
                          }}
                          className="w-12 h-10 bg-white/5 rounded-xl text-center text-lg hover:bg-white/10 transition-colors border border-white/5"
                        >
                          {col.emoji || "✨"}
                        </button>

                        <AnimatePresence>
                          {activeEmojiDropdown === idx && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-full left-0 mt-2 bg-[#1A1A1E] border border-white/10 rounded-2xl p-3 shadow-2xl z-50 w-64 grid grid-cols-4 gap-2"
                            >
                              {KANBAN_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    updateColumn(idx, "emoji", emoji);
                                    setActiveEmojiDropdown(null);
                                  }}
                                  className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-all hover:scale-110"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* NOME DA COLUNA */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={col.title}
                          onChange={(e) =>
                            updateColumn(idx, "title", e.target.value)
                          }
                          className="w-full bg-transparent text-sm text-white font-bold border-b border-transparent focus:border-indigo-500 outline-none transition-colors pb-1 h-10"
                        />
                      </div>

                      {/* COR */}
                      <div className="w-36 shrink-0 hidden md:block">
                        <div className="flex items-center gap-1.5 h-10">
                          {AVAILABLE_COLORS.slice(0, 5).map((colorOption) => (
                            <button
                              key={colorOption.name}
                              type="button"
                              title={colorOption.label}
                              onClick={() =>
                                updateColumn(idx, "color", colorOption.name)
                              }
                              className={`w-4 h-4 rounded-full ${colorOption.bg} border-2 transition-all ${col.color === colorOption.name ? "border-white scale-125 shadow-[0_0_8px_currentColor]" : "border-transparent opacity-40 hover:opacity-100"}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="pl-4 border-l border-white/5 h-10 flex items-center">
                        <button
                          onClick={() => removeColumn(idx)}
                          className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-all"
                          title="Apagar Coluna"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                                className="w-8 h-8 rounded-full border border-white/10 object-cover"
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
      {/* MODAL DE CONVITE PREMIUM */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0D0D0F] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden relative"
            >
              {/* Efeito de Brilho de Fundo */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="p-10 border-b border-white/[0.05] relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-3">
                      <Users size={14} />
                      <span>Colaboração</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      Novo Membro
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Adicione um novo talento ao projeto{" "}
                  <span className="text-white font-semibold">
                    {activeProject.name}
                  </span>
                  .
                </p>
              </div>

              <form
                onSubmit={handleInviteMember}
                className="p-10 space-y-8 relative"
              >
                <div className="grid grid-cols-1 gap-6">
                  {/* Campo Nome */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Nome Completo
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        required
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl px-5 py-4 text-sm focus:border-indigo-500/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Campo Email */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Endereço de Email
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="joao@empresa.com"
                        className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl px-5 py-4 text-sm focus:border-indigo-500/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Seleção de Role - Estilo Cards */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                    Nível de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setInviteRole("member")}
                      className={`group p-5 rounded-[1.5rem] border text-left transition-all relative overflow-hidden ${inviteRole === "member" ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50" : "bg-white/[0.02] border-white/5 text-zinc-500 hover:bg-white/[0.04]"}`}
                    >
                      <div
                        className={`mb-3 p-2 rounded-lg w-fit transition-colors ${inviteRole === "member" ? "bg-indigo-500 text-white" : "bg-white/5 text-zinc-500 group-hover:text-zinc-300"}`}
                      >
                        <Users size={16} />
                      </div>
                      <span
                        className={`text-sm font-bold block mb-1 ${inviteRole === "member" ? "text-white" : "group-hover:text-zinc-300"}`}
                      >
                        Membro
                      </span>
                      <span className="text-[10px] leading-snug block opacity-60 font-medium">
                        Pode criar e editar tarefas no quadro.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteRole("admin")}
                      className={`group p-5 rounded-[1.5rem] border text-left transition-all relative overflow-hidden ${inviteRole === "admin" ? "bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/50" : "bg-white/[0.02] border-white/5 text-zinc-500 hover:bg-white/[0.04]"}`}
                    >
                      <div
                        className={`mb-3 p-2 rounded-lg w-fit transition-colors ${inviteRole === "admin" ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "bg-white/5 text-zinc-500 group-hover:text-zinc-300"}`}
                      >
                        <Crown size={16} />
                      </div>
                      <span
                        className={`text-sm font-bold block mb-1 ${inviteRole === "admin" ? "text-white" : "group-hover:text-zinc-300"}`}
                      >
                        Admin
                      </span>
                      <span className="text-[10px] leading-snug block opacity-60 font-medium">
                        Controlo total sobre o projeto e equipa.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Rodapé do Modal */}
                <div className="pt-6 mt-4 border-t border-white/[0.05] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-white text-black hover:bg-zinc-200 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 disabled:opacity-50 shadow-[0_10px_20px_rgba(255,255,255,0.1)] active:scale-95"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} strokeWidth={3} />
                    )}
                    Enviar Convite
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
