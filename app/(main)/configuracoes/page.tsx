"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import {
  Globe,
  Users,
  Shield,
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
} from "lucide-react";

export default function SettingsPage() {
  const { activeProject } = useData();
  const [activeTab, setActiveTab] = useState<"general" | "members">("general");

  // Estados de Formulário e UI
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">(
    "synced",
  );

  // Campos - Geral
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Campos - Membros
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedLink, setCopiedLink] = useState(false);

  // Link de convite dinâmico
  const inviteLink =
    typeof window !== "undefined" && activeProject
      ? `${window.location.origin}/convite/${activeProject.id}`
      : "";

  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name || "");
      setProjectKey(activeProject.key || "");
      setProjectDescription(activeProject.description || "");
      setIsDirty(false);
    }
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const hasChanges =
      projectName !== (activeProject.name || "") ||
      projectKey !== (activeProject.key || "") ||
      projectDescription !== (activeProject.description || "");

    setIsDirty(hasChanges);
  }, [projectName, projectKey, projectDescription, activeProject]);

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#09090B] h-full w-full">
        <Settings size={48} className="text-zinc-700 mb-4 animate-spin-slow" />
        <h2 className="text-xl font-bold text-white mb-2">
          Nenhum Projeto Selecionado
        </h2>
        <p className="text-zinc-500 text-sm">
          Selecione um projeto na barra lateral para ver as configurações.
        </p>
      </div>
    );
  }

  const handleDiscard = () => {
    setProjectName(activeProject.name || "");
    setProjectKey(activeProject.key || "");
    setProjectDescription(activeProject.description || "");
    setIsDirty(false);
  };

  const handleSaveGeneral = async () => {
    if (!projectName.trim() || !projectKey.trim()) return;
    setIsSaving(true);
    setSyncStatus("saving");

    try {
      await updateDoc(doc(db, "projects", activeProject.id), {
        name: projectName.trim(),
        key: projectKey.trim().toUpperCase(),
        description: projectDescription.trim(),
      });
      setIsDirty(false);
      setSyncStatus("synced");
    } catch (error) {
      console.error("Erro ao guardar:", error);
      setSyncStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- ACÇÕES: MEMBROS (Com Segurança) ---
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    setIsSaving(true);
    try {
      const currentMembers = activeProject.members || [];
      const currentMemberEmails = activeProject.memberEmails || [];

      const newMember = {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        photoURL: `https://ui-avatars.com/api/?name=${inviteName.trim()}&background=27272A&color=fff`,
        addedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "projects", activeProject.id), {
        members: [...currentMembers, newMember],
        memberEmails: [...currentMemberEmails, inviteEmail.trim()], // Array de segurança atualizado
      });

      setIsInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("member");
    } catch (error) {
      console.error("Erro ao convidar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (emailToRemove: string) => {
    if (!confirm("Tem a certeza que deseja remover este membro do projeto?"))
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
        memberEmails: updatedMemberEmails, // Array de segurança atualizado
      });
    } catch (error) {
      console.error("Erro ao remover:", error);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-full bg-[#09090B] text-zinc-200 p-8 pb-32 relative custom-scrollbar w-full">
      <div className="w-full max-w-[1600px] mx-auto mb-10 pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Configurações
          </h1>
          <p className="text-zinc-500 text-sm">
            Gerencie suas preferências e membros do projeto{" "}
            <strong className="text-zinc-300">{activeProject.name}</strong>.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shrink-0 ${
            syncStatus === "synced" && !isDirty
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : syncStatus === "saving"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : "bg-zinc-800 border-[#27272A] text-zinc-400"
          }`}
        >
          {syncStatus === "synced" && !isDirty && <Wifi size={14} />}
          {syncStatus === "saving" && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {isDirty && syncStatus !== "saving" && (
            <AlertTriangle size={14} className="text-amber-400" />
          )}
          {syncStatus === "saving"
            ? "A sincronizar..."
            : isDirty
              ? "Alterações pendentes"
              : "Sincronizado"}
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto flex flex-col md:flex-row gap-10">
        <nav className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          <SidebarItem
            icon={<Globe size={18} />}
            label="Geral"
            isActive={activeTab === "general"}
            onClick={() => setActiveTab("general")}
          />
          <SidebarItem
            icon={<Users size={18} />}
            label="Membros da Equipa"
            isActive={activeTab === "members"}
            onClick={() => setActiveTab("members")}
          />
          <SidebarItem
            icon={<Shield size={18} />}
            label="Permissões"
            isActive={false}
            onClick={() => {}}
          />
        </nav>

        <div className="flex-1 space-y-8 animate-in fade-in duration-300">
          {activeTab === "general" && (
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-8 border-b border-[#27272A]/50">
                <h2 className="text-xl font-bold text-white mb-1">Geral</h2>
                <p className="text-sm text-zinc-500">
                  Detalhes de identificação do seu projeto.
                </p>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">
                      Nome do Projeto
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
                      Chave do Projeto (ID)
                    </label>
                    <input
                      type="text"
                      value={projectKey}
                      onChange={(e) =>
                        setProjectKey(e.target.value.toUpperCase())
                      }
                      maxLength={5}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all uppercase font-mono"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Usado como prefixo nas tarefas (Ex: {projectKey || "NEX"}
                      -123).
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Descrição
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    placeholder="Qual é o objetivo principal desta equipa?"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-8 border-b border-[#27272A]/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Membros da Equipa
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Gerencie quem tem acesso a este projeto.
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>

              <div className="p-8">
                <div className="bg-[#09090B] border border-[#27272A] rounded-xl mb-8 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <LinkIcon size={16} className="text-zinc-400" /> Link de
                      Convite
                    </h4>
                    <p className="text-xs text-zinc-500 mb-3">
                      Envie este link para qualquer pessoa integrar a equipa
                      imediatamente.
                    </p>
                    <div className="flex items-center gap-2 bg-[#121214] border border-[#27272A] rounded-lg p-1.5 w-full">
                      <input
                        type="text"
                        readOnly
                        value={inviteLink}
                        className="flex-1 bg-transparent border-none text-xs text-zinc-400 px-2 focus:outline-none truncate"
                      />
                      <button
                        onClick={copyInviteLink}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${copiedLink ? "bg-emerald-500/20 text-emerald-400" : "bg-[#27272A] text-zinc-200 hover:bg-[#3F3F46]"}`}
                      >
                        {copiedLink ? <Check size={14} /> : <Copy size={14} />}{" "}
                        {copiedLink ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(activeProject.members || []).map(
                    (member: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#09090B] border border-[#27272A] p-4 rounded-xl group hover:border-[#3F3F46] transition-colors gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={member.photoURL}
                            alt={member.name}
                            className="w-12 h-12 rounded-full border border-[#27272A] object-cover"
                          />
                          <div>
                            <p className="text-sm font-bold text-white">
                              {member.name}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <select
                            className="flex-1 sm:flex-none bg-[#121214] border border-[#27272A] text-sm text-zinc-300 rounded-lg px-4 py-2 focus:outline-none appearance-none"
                            defaultValue={member.role}
                            disabled
                          >
                            <option value="admin">Administrador</option>
                            <option value="member">Membro Padrão</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.email)}
                            className="p-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-500/20 shrink-0"
                            title="Remover Membro"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                  {(!activeProject.members ||
                    activeProject.members.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed border-[#27272A] rounded-xl">
                      <Users size={32} className="mx-auto text-zinc-600 mb-3" />
                      <p className="text-zinc-400 font-medium">
                        Este projeto ainda não tem membros adicionais.
                      </p>
                      <p className="text-zinc-600 text-sm mt-1">
                        Clique em "Adicionar" ou partilhe o link de convite
                        acima.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isDirty && (
        <div className="fixed bottom-8 right-8 bg-[#1A1A1E] border border-[#3F3F46] shadow-2xl rounded-2xl p-2 pr-3 pl-5 flex items-center gap-6 animate-in slide-in-from-bottom-5 fade-in z-50">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Alterações não salvas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleSaveGeneral}
              disabled={isSaving}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}{" "}
              Salvar
            </button>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-[#27272A]">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-white">
                  Adicionar Membro
                </h2>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-[#27272A] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-zinc-500">
                Convide um colega para o projeto {activeProject.name}.
              </p>
            </div>
            <form
              onSubmit={handleInviteMember}
              className="p-6 space-y-6 bg-[#09090B]"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex: Ana Silva"
                  className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="ana@empresa.com"
                  className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Nível de Acesso
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setInviteRole("member")}
                    className={`p-4 rounded-xl border text-left transition-all ${inviteRole === "member" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.1)]" : "bg-[#121214] border-[#27272A] text-zinc-400 hover:border-[#3F3F46]"}`}
                  >
                    <span className="text-sm font-bold block mb-1">Membro</span>
                    <span className="text-xs leading-tight block opacity-80">
                      Pode criar e editar tarefas livremente.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("admin")}
                    className={`p-4 rounded-xl border text-left transition-all ${inviteRole === "admin" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.1)]" : "bg-[#121214] border-[#27272A] text-zinc-400 hover:border-[#3F3F46]"}`}
                  >
                    <span className="text-sm font-bold block mb-1">
                      Administrador
                    </span>
                    <span className="text-xs leading-tight block opacity-80">
                      Acesso total às configurações do projeto.
                    </span>
                  </button>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[#27272A]/50">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Enviar Convite"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-[#1A1A1E] text-indigo-400 border border-[#27272A] shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121214] border border-transparent"}`}
    >
      <div className={`${isActive ? "text-indigo-400" : "text-zinc-500"}`}>
        {icon}
      </div>
      {label}
    </button>
  );
}
