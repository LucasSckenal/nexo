"use client";

import { useState, useEffect, useRef } from "react";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import { useTheme } from "../../context/ThemeContext"; // Importado o hook do tema
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

const DEFAULT_COLUMNS = [
  {
    id: "todo",
    title: "A Fazer",
    color: "zinc",
    limit: 0,
    emoji: "📝",
    bannerUrl: "",
  },
  {
    id: "in-progress",
    title: "Em Curso",
    color: "indigo",
    limit: 4,
    emoji: "🚀",
    bannerUrl: "",
  },
  {
    id: "review",
    title: "Revisão",
    color: "purple",
    limit: 3,
    emoji: "👀",
    bannerUrl: "",
  },
  {
    id: "done",
    title: "Concluído",
    color: "emerald",
    limit: 0,
    emoji: "✅",
    bannerUrl: "",
  },
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
  const { theme } = useTheme(); // Uso do tema
  const [activeTab, setActiveTab] = useState<
    "general" | "board" | "members" | "integrations"
  >("general");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
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
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [iconType, setIconType] = useState<"image" | "emoji">("image");
  const [projectEmoji, setProjectEmoji] = useState("✨");

  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [boardColumns, setBoardColumns] = useState<any[]>([]);

  const [activeEmojiDropdown, setActiveEmojiDropdown] = useState<number | null>(
    null,
  );
  const [uploadingBannerIndex, setUploadingBannerIndex] = useState<
    number | null
  >(null);
  const [columnToDelete, setColumnToDelete] = useState<number | null>(null);

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
    if (!activeProject) return;
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

  const handleDeleteProject = async () => {
    if (!activeProject) return;

    if (deleteConfirmationText !== activeProject.name) {
      showToast("O nome do projeto não coincide.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "projects", activeProject.id));
      showToast("Projeto eliminado com sucesso!");
      window.location.href = "/";
    } catch (error) {
      showToast("Erro ao eliminar projeto.", "error");
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!projectName.trim() || !projectKey.trim() || !activeProject) return;
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
    if (!file || !activeProject) return;
    if (file.size > 2000000) {
      showToast("Máximo de 2MB para a imagem.", "error");
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
        showToast("Logótipo atualizado!");
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
      showToast("O banner deve ter menos de 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newCols = [...boardColumns];
      newCols[uploadingBannerIndex] = {
        ...newCols[uploadingBannerIndex],
        bannerUrl: reader.result as string,
      };
      setBoardColumns(newCols);
      setUploadingBannerIndex(null);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim() || !activeProject) return;
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

  const handleConfirmRemoveMember = async () => {
    if (!activeProject || !memberToRemove) return;
    setIsSaving(true);
    try {
      const updatedMembers = (activeProject.members || []).filter(
        (m: any) => m.email !== memberToRemove,
      );
      const updatedMemberEmails = (activeProject.memberEmails || []).filter(
        (email: string) => email !== memberToRemove,
      );
      await updateDoc(doc(db, "projects", activeProject.id), {
        members: updatedMembers,
        memberEmails: updatedMemberEmails,
      });
      showToast("Membro removido do projeto.");
    } catch (error) {
      showToast("Erro ao remover membro.", "error");
    } finally {
      setIsSaving(false);
      setMemberToRemove(null); // Fecha o modal no final
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  const confirmDeleteColumn = (index: number) => setColumnToDelete(index);

  const handleExecuteDelete = () => {
    if (columnToDelete !== null) {
      const newCols = [...boardColumns];
      newCols.splice(columnToDelete, 1);
      setBoardColumns(newCols);
      setColumnToDelete(null);
      showToast("Coluna removida do quadro.");
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

  const handleDisconnectGithub = async () => {
    if (
      !activeProject ||
      !confirm("Tem a certeza que deseja desconectar o GitHub?")
    )
      return;
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

  if (!activeProject) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-bgMain text-textPrimary relative overflow-hidden transition-colors duration-300">
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div
              className={`flex items-center gap-3 px-6 py-3 rounded-full border shadow-2xl backdrop-blur-md ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
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

      {/* Luzes de Fundo (Glow Effect) adaptáveis ao tema */}
      <div
        className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none blur-[120px] transition-all duration-700 ${theme === "dark" ? "bg-indigo-600/10" : "bg-indigo-500/5"}`}
      />
      <div
        className={`absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none blur-[100px] transition-all duration-700 ${theme === "dark" ? "bg-purple-600/5" : "bg-purple-500/5"}`}
      />

      {/* HEADER */}
      <header className="shrink-0 border-b border-borderSubtle bg-bgMain/60 backdrop-blur-xl px-10 py-8 flex items-center justify-between z-20 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2 text-accentPurple font-bold text-[10px] uppercase tracking-[0.4em] mb-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Settings size={12} />
            </motion.div>
            <span>Project Settings</span>
          </div>
          <h1 className="text-4xl font-black text-textPrimary tracking-tighter">
            Configurações
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 bg-bgSurface border border-borderSubtle rounded-full ${syncStatus === "saving" ? "text-accentPurple" : isDirty ? "text-amber-500" : "text-textMuted"}`}
          >
            {syncStatus === "synced" && !isDirty && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {syncStatus === "saving" && (
              <Loader2 size={12} className="animate-spin" />
            )}
            {isDirty && syncStatus !== "saving" && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {syncStatus === "saving"
                ? "A guardar..."
                : isDirty
                  ? "Alterações pendentes"
                  : "Sincronizado"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden z-10">
        {/* SIDEBAR DE NAVEGAÇÃO */}
        <aside className="w-80 border-r border-borderSubtle p-8 space-y-2 bg-bgSurface/40 transition-colors duration-300">
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
            label="Membros e Equipa"
            isActive={activeTab === "members"}
            onClick={() => setActiveTab("members")}
          />
          <SidebarItem
            icon={<Github size={18} />}
            label="Integrações"
            isActive={activeTab === "integrations"}
            onClick={() => setActiveTab("integrations")}
          />
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
          <div className="max-w-4xl space-y-12 pb-32">
            {/* ABA GERAL */}
            {activeTab === "general" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <section className="bg-bgCard border border-borderSubtle rounded-[2rem] p-8 space-y-6 shadow-sm transition-colors duration-300">
                  <h3 className="text-lg font-black text-textPrimary tracking-tight">
                    Identidade do Projeto
                  </h3>

                  <div className="flex items-center gap-6">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                      accept="image/*"
                    />

                    <div className="w-20 h-20 shrink-0 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg relative overflow-hidden border-2 border-borderSubtle bg-bgDeep">
                      {isUploadingLogo ? (
                        <Loader2
                          size={24}
                          className="animate-spin text-textMuted"
                        />
                      ) : iconType === "emoji" ? (
                        <div className="w-full h-full bg-gradient-to-br from-bgGlass to-transparent flex items-center justify-center">
                          <span className="drop-shadow-xl scale-110 transform transition-transform hover:scale-125">
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
                          <span className="text-accentPurple drop-shadow-md text-xl">
                            {projectKey.substring(0, 2) || "PR"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div>
                        <h3 className="text-xs font-bold text-textPrimary mb-1">
                          Ícone Personalizado
                        </h3>
                        <p className="text-[11px] text-textMuted leading-relaxed max-w-xs">
                          Escolha uma imagem ou um emoji elegante.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-bgSurface p-1 rounded-xl border border-borderSubtle w-fit">
                        <button
                          onClick={() => {
                            if (!activeProject.imageUrl)
                              fileInputRef.current?.click();
                            else setIconType("image");
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${iconType === "image" ? "bg-accentPurple/10 text-accentPurple border border-accentPurple/30 shadow-sm" : "text-textSecondary hover:bg-bgSurfaceHover border border-transparent"}`}
                        >
                          <ImageIcon size={12} /> Imagem
                        </button>
                        <div className="w-px h-4 bg-borderSubtle" />
                        <div
                          className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold transition-all border ${iconType === "emoji" ? "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-sm" : "text-textSecondary border-transparent hover:bg-bgSurfaceHover focus-within:border-borderSubtle"}`}
                        >
                          <Smile
                            size={12}
                            className={
                              iconType === "emoji"
                                ? "text-amber-500"
                                : "text-textMuted"
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
                            className="bg-transparent w-6 text-center outline-none placeholder:text-textFaint text-textPrimary focus:w-8 transition-all"
                            placeholder="😀"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-borderSubtle">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-textMuted uppercase tracking-widest ml-1">
                        Nome do Projeto
                      </label>
                      <input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-bgSurface border border-borderSubtle rounded-xl px-4 py-3 text-sm text-textPrimary focus:border-accentPurple outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-textMuted uppercase tracking-widest ml-1">
                        Chave (ID)
                      </label>
                      <input
                        value={projectKey}
                        onChange={(e) =>
                          setProjectKey(e.target.value.toUpperCase())
                        }
                        maxLength={5}
                        className="w-full bg-bgSurface border border-borderSubtle rounded-xl px-4 py-3 text-sm text-accentPurple font-mono font-bold focus:border-accentPurple outline-none transition-all uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-textMuted uppercase tracking-widest ml-1">
                      Descrição
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={2} // <-- Reduzido de 3 para 2 linhas
                      className="w-full bg-bgSurface border border-borderSubtle rounded-xl px-4 py-3 text-sm text-textPrimary focus:border-accentPurple outline-none transition-all resize-none custom-scrollbar"
                    />
                  </div>
                </section>

                {/* ZONA DE PERIGO (DANGER ZONE) - AGORA HORIZONTAL */}
                <section className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-base font-black text-red-500 tracking-tight mb-1">
                      Zona de Perigo
                    </h3>
                    <p className="text-xs text-textMuted max-w-md">
                      A eliminação do projeto apagará permanentemente todos os
                      dados, tarefas e integrações.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                  >
                    Eliminar Projeto
                  </button>
                </section>
              </motion.div>
            )}

            {/* ABA QUADRO KANBAN */}
            {activeTab === "board" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <section className="bg-bgCard border border-borderSubtle rounded-[2.5rem] p-10 space-y-8 shadow-sm">
                  <div className="flex items-center justify-between border-b border-borderSubtle pb-8">
                    <div>
                      <h3 className="text-xl font-black text-textPrimary tracking-tight mb-2">
                        Capa das Colunas
                      </h3>
                      <p className="text-sm text-textMuted">
                        Faça o upload de banners ou selecione Emojis para o topo
                        das colunas do Kanban.
                      </p>
                    </div>
                    <button
                      onClick={addColumn}
                      className="bg-bgSurface hover:bg-bgSurfaceHover border border-borderSubtle text-textPrimary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> Nova Coluna
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerUpload}
                    className="hidden"
                    accept="image/*"
                  />

                  <div className="grid gap-6">
                    {boardColumns.map((col, idx) => (
                      <div
                        key={idx}
                        className="bg-bgElement border border-borderSubtle rounded-[2rem] overflow-hidden group transition-all hover:border-borderFocus"
                      >
                        {/* ÁREA DE CAPA (BANNER) */}
                        <div className="h-28 w-full relative bg-bgGlass border-b border-borderSubtle flex items-center justify-center overflow-hidden">
                          {col.bannerUrl ? (
                            <>
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                  backgroundImage: `url(${col.bannerUrl})`,
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                <button
                                  onClick={() => {
                                    setUploadingBannerIndex(idx);
                                    bannerInputRef.current?.click();
                                  }}
                                  className="bg-white text-black px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg hover:bg-zinc-200"
                                >
                                  Alterar Capa
                                </button>
                                <button
                                  onClick={() =>
                                    updateColumn(idx, "bannerUrl", "")
                                  }
                                  className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg hover:bg-red-600"
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
                              className="flex items-center gap-2 text-textMuted hover:text-textPrimary transition-colors text-xs font-bold"
                            >
                              <ImageIcon size={16} /> Adicionar Banner de Capa
                            </button>
                          )}
                        </div>

                        {/* CONTROLOS INFERIORES */}
                        <div className="p-6 flex items-center gap-6">
                          <div className="flex flex-col gap-1 text-textMuted">
                            <button
                              type="button"
                              onClick={() => moveColumn(idx, "up")}
                              disabled={idx === 0}
                              className="hover:text-textPrimary disabled:opacity-30 transition-colors p-1"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveColumn(idx, "down")}
                              disabled={idx === boardColumns.length - 1}
                              className="hover:text-textPrimary disabled:opacity-30 transition-colors p-1"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>

                          {/* EMOJI PICKER */}
                          <div className="shrink-0 relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEmojiDropdown(
                                  activeEmojiDropdown === idx ? null : idx,
                                );
                              }}
                              className="w-14 h-14 bg-bgSurface border border-borderSubtle rounded-2xl text-center text-2xl hover:bg-bgSurfaceHover transition-colors flex items-center justify-center"
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
                                  className="absolute top-full left-0 mt-3 bg-bgPanel border border-borderSubtle rounded-[1.5rem] p-4 shadow-2xl z-50 w-72 grid grid-cols-4 gap-2"
                                >
                                  {KANBAN_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        updateColumn(idx, "emoji", emoji);
                                        setActiveEmojiDropdown(null);
                                      }}
                                      className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-bgSurfaceHover rounded-xl transition-all hover:scale-110"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="flex-1">
                            <label className="text-[10px] font-black text-textMuted uppercase tracking-widest block mb-2">
                              Nome da Coluna
                            </label>
                            <input
                              type="text"
                              value={col.title}
                              onChange={(e) =>
                                updateColumn(idx, "title", e.target.value)
                              }
                              className="w-full bg-transparent text-lg text-textPrimary font-bold border-b border-transparent focus:border-accentPurple outline-none transition-colors pb-1"
                            />
                          </div>

                          <div className="w-40 shrink-0 hidden md:block border-l border-borderSubtle pl-6">
                            <label className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-2 block">
                              Cor Base
                            </label>
                            <div className="flex items-center gap-2">
                              {AVAILABLE_COLORS.slice(0, 5).map(
                                (colorOption) => (
                                  <button
                                    key={colorOption.name}
                                    type="button"
                                    title={colorOption.label}
                                    onClick={() =>
                                      updateColumn(
                                        idx,
                                        "color",
                                        colorOption.name,
                                      )
                                    }
                                    className={`w-5 h-5 rounded-full ${colorOption.bg} border-2 transition-all ${col.color === colorOption.name ? "border-textPrimary scale-125 shadow-md" : "border-transparent opacity-40 hover:opacity-100"}`}
                                  />
                                ),
                              )}
                            </div>
                          </div>

                          <div className="pl-6 border-l border-borderSubtle flex items-center">
                            <button
                              onClick={() => confirmDeleteColumn(idx)}
                              className="text-textMuted hover:text-red-500 p-3 rounded-2xl hover:bg-red-500/10 transition-all"
                              title="Apagar Coluna"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {/* ABA MEMBROS */}
            {activeTab === "members" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <section className="bg-bgCard border border-borderSubtle p-10 rounded-[2.5rem] space-y-8 shadow-sm">
                  <div className="flex justify-between items-center border-b border-borderSubtle pb-8">
                    <div>
                      <h3 className="text-xl font-black text-textPrimary tracking-tight mb-2">
                        Equipa do Projeto
                      </h3>
                      <p className="text-sm text-textMuted">
                        Gere quem tem acesso a este workspace.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="bg-textPrimary text-bgMain hover:opacity-80 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl"
                    >
                      <Plus size={16} strokeWidth={3} /> Convidar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(activeProject.members || []).map(
                      (member: any, idx: number) => {
                        const isUserOwner =
                          member.email === auth.currentUser?.email;
                        const isAdmin = member.role === "admin";
                        return (
                          <div
                            key={idx}
                            className="bg-bgElement border border-borderSubtle p-6 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-borderFocus transition-all"
                          >
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <img
                                  src={member.photoURL}
                                  className="w-14 h-14 rounded-2xl object-cover"
                                />
                                {isAdmin && (
                                  <div className="absolute -top-2 -right-2 bg-accentPurple p-1 rounded-lg border-4 border-bgElement">
                                    <Crown size={10} className="text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-textPrimary font-bold">
                                  {member.name}
                                </h4>
                                <p className="text-xs text-textMuted">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 sm:ml-auto">
                              <div
                                className={`px-4 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-widest ${isAdmin ? "bg-accentPurple/10 border-accentPurple/20 text-accentPurple" : "bg-bgSurface border-borderSubtle text-textSecondary"}`}
                              >
                                {isAdmin ? "Administrador" : "Membro"}
                              </div>
                              {!isUserOwner && (
                                <button
                                  onClick={() =>
                                    setMemberToRemove(member.email)
                                  }
                                  className="text-textMuted hover:text-red-500 p-2 rounded-xl hover:bg-red-500/10 transition-all"
                                >
                                  <LogOut size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {/* ABA INTEGRAÇÕES */}
            {activeTab === "integrations" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <section className="bg-bgCard border border-borderSubtle p-10 rounded-[2.5rem] shadow-sm">
                  <div className="border-b border-borderSubtle pb-8 mb-8">
                    <h3 className="text-xl font-black text-textPrimary tracking-tight mb-2">
                      Integrações
                    </h3>
                    <p className="text-sm text-textMuted">
                      Conecte ferramentas externas para automatizar o seu fluxo.
                    </p>
                  </div>
                  <div
                    className={`border rounded-[2rem] p-8 transition-all relative overflow-hidden ${activeProject.githubRepo ? "bg-accentPurple/5 border-accentPurple/20" : "bg-bgElement border-borderSubtle"}`}
                  >
                    {activeProject.githubRepo && (
                      <div className="absolute top-0 right-0 w-64 h-64 bg-accentPurple/10 blur-[100px] rounded-full pointer-events-none" />
                    )}

                    <div className="flex items-center justify-between border-b border-borderSubtle pb-6 mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="bg-bgSurface p-4 rounded-2xl border border-borderSubtle">
                          <Github className="text-textPrimary" size={28} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-textPrimary">
                            GitHub
                          </h3>
                          <p className="text-xs text-textSecondary mt-1">
                            Sincronização de Código e Branches
                          </p>
                        </div>
                      </div>
                      {activeProject.githubRepo && (
                        <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                          <Check size={14} /> Conectado
                        </span>
                      )}
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                          Repositório GitHub
                        </label>
                        <input
                          value={githubRepo}
                          onChange={(e) => setGithubRepo(e.target.value)}
                          placeholder="Ex: Utilizador/Nome-do-Repo"
                          className="w-full bg-bgSurface border border-borderSubtle rounded-2xl px-6 py-4 text-sm text-textPrimary focus:border-accentPurple outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                          <KeyRound size={12} /> Personal Access Token (Classic)
                        </label>
                        <input
                          type="password"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full bg-bgSurface border border-borderSubtle rounded-2xl px-6 py-4 text-sm text-textPrimary focus:border-accentPurple outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {activeProject.githubRepo && (
                      <div className="mt-8 pt-6 border-t border-borderSubtle flex items-center justify-between relative z-10">
                        <a
                          href={`https://github.com/${activeProject.githubRepo}`}
                          target="_blank"
                          className="text-xs font-black uppercase tracking-widest text-accentPurple hover:opacity-80 transition-colors flex items-center gap-2"
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
                </section>
              </motion.div>
            )}
          </div>

          {/* FLOAT SAVE BAR */}
          <AnimatePresence>
            {isDirty && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-bgPanel border border-borderSubtle shadow-2xl rounded-3xl p-4 pl-8 flex items-center justify-between gap-12 z-50 w-max"
              >
                <div className="flex items-center gap-4 text-amber-500">
                  <AlertTriangle size={24} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-textPrimary">
                      Alterações Pendentes
                    </span>
                    <span className="text-[11px] text-amber-500/70">
                      Tem modificações por guardar.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDiscard}
                    className="px-6 py-4 text-[10px] font-black text-textMuted hover:text-textPrimary uppercase tracking-widest transition-colors"
                  >
                    Reverter
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-textPrimary text-bgMain hover:opacity-80 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}{" "}
                    Salvar Configurações
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* MODAL DE CONVITE PREMIUM */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-bgPanel border border-borderSubtle rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-accentPurple/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="p-10 border-b border-borderSubtle relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-accentPurple font-bold text-[10px] uppercase tracking-[0.3em] mb-3">
                      <Users size={14} />
                      <span>Colaboração</span>
                    </div>
                    <h2 className="text-3xl font-black text-textPrimary tracking-tight">
                      Novo Membro
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-textMuted hover:text-textPrimary bg-bgSurface hover:bg-bgSurfaceHover p-2.5 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleInviteMember}
                className="p-10 space-y-8 relative"
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-bgSurface border border-borderSubtle text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-accentPurple outline-none transition-all placeholder:text-textFaint"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                      Endereço de Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="joao@empresa.com"
                      className="w-full bg-bgSurface border border-borderSubtle text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-accentPurple outline-none transition-all placeholder:text-textFaint"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                    Nível de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setInviteRole("member")}
                      className={`group p-5 rounded-[1.5rem] border text-left transition-all relative overflow-hidden ${inviteRole === "member" ? "bg-accentPurple/10 border-accentPurple ring-1 ring-accentPurple/50" : "bg-bgSurface border-borderSubtle text-textMuted hover:bg-bgSurfaceHover"}`}
                    >
                      <div
                        className={`mb-3 p-2 rounded-lg w-fit transition-colors ${inviteRole === "member" ? "bg-accentPurple text-white" : "bg-bgSurfaceHover text-textMuted group-hover:text-textPrimary"}`}
                      >
                        <Users size={16} />
                      </div>
                      <span
                        className={`text-sm font-bold block mb-1 ${inviteRole === "member" ? "text-textPrimary" : "group-hover:text-textPrimary"}`}
                      >
                        Membro
                      </span>
                      <span className="text-[10px] leading-snug block opacity-60 font-medium">
                        Lê e edita tarefas.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole("admin")}
                      className={`group p-5 rounded-[1.5rem] border text-left transition-all relative overflow-hidden ${inviteRole === "admin" ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/50" : "bg-bgSurface border-borderSubtle text-textMuted hover:bg-bgSurfaceHover"}`}
                    >
                      <div
                        className={`mb-3 p-2 rounded-lg w-fit transition-colors ${inviteRole === "admin" ? "bg-purple-500 text-white shadow-lg" : "bg-bgSurfaceHover text-textMuted group-hover:text-textPrimary"}`}
                      >
                        <Crown size={16} />
                      </div>
                      <span
                        className={`text-sm font-bold block mb-1 ${inviteRole === "admin" ? "text-textPrimary" : "group-hover:text-textPrimary"}`}
                      >
                        Admin
                      </span>
                      <span className="text-[10px] leading-snug block opacity-60 font-medium">
                        Controlo total do projeto.
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-borderSubtle flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textPrimary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-textPrimary text-bgMain hover:opacity-80 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} strokeWidth={3} />
                    )}{" "}
                    Enviar Convite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE EXCLUSÃO DE COLUNA */}
      <AnimatePresence>
        {columnToDelete !== null && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-bgPanel border border-red-500/20 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-textPrimary tracking-tight mb-3">
                  Eliminar Coluna?
                </h2>
                <p className="text-sm text-textMuted leading-relaxed mb-8">
                  Tem certeza que deseja apagar a coluna{" "}
                  <span className="text-textPrimary font-bold">
                    "{boardColumns[columnToDelete]?.title}"
                  </span>
                  ? As tarefas não serão apagadas, mas deixarão de estar
                  visíveis neste quadro.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleExecuteDelete}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-500/20"
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    onClick={() => setColumnToDelete(null)}
                    className="w-full bg-bgSurface hover:bg-bgSurfaceHover text-textMuted hover:text-textPrimary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* MODAL DE REMOÇÃO DE MEMBRO */}
      <AnimatePresence>
        {memberToRemove !== null && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-bgPanel border border-red-500/20 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <LogOut size={32} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-textPrimary tracking-tight mb-3">
                  Remover Membro?
                </h2>
                <p className="text-sm text-textMuted leading-relaxed mb-8">
                  Tem certeza que deseja remover{" "}
                  <span className="text-textPrimary font-bold">
                    {activeProject?.members?.find(
                      (m: any) => m.email === memberToRemove,
                    )?.name || memberToRemove}
                  </span>{" "}
                  da equipa? Este utilizador perderá o acesso a este projeto
                  imediatamente.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmRemoveMember}
                    disabled={isSaving}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Confirmar Remoção"
                    )}
                  </button>
                  <button
                    onClick={() => setMemberToRemove(null)}
                    disabled={isSaving}
                    className="w-full bg-bgSurface hover:bg-bgSurfaceHover text-textMuted hover:text-textPrimary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* MODAL DE ELIMINAR PROJETO */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0D0D0F] border border-red-500/20 rounded-[2.5rem] w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="p-10 text-center relative">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                  Eliminar Projeto?
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                  Esta ação é irreversível. Por favor, escreva{" "}
                  <span className="text-white font-bold select-all">
                    {activeProject?.name}
                  </span>{" "}
                  para confirmar.
                </p>

                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder={activeProject?.name}
                  className="w-full bg-white/[0.03] border border-red-500/20 text-white rounded-2xl px-5 py-4 text-sm focus:border-red-500 outline-none transition-all placeholder:text-zinc-600 mb-6 text-center font-bold"
                />

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDeleteProject}
                    disabled={
                      isSaving || deleteConfirmationText !== activeProject?.name
                    }
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Confirmar Exclusão"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeleteConfirmationText("");
                    }}
                    disabled={isSaving}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
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
      className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] text-sm font-bold transition-all relative ${
        isActive
          ? "bg-bgSurfaceActive text-textPrimary border border-borderSubtle shadow-sm"
          : "text-textMuted hover:text-textPrimary hover:bg-bgSurfaceHover"
      }`}
    >
      <span className={`${isActive ? "text-accentPurple" : "text-textMuted"}`}>
        {icon}
      </span>
      {label}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-2 w-1 h-6 bg-accentPurple rounded-full"
        />
      )}
    </button>
  );
}
