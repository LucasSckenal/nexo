"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  X,
  Plus,
  Loader2,
  Target,
  AlignLeft,
  Flag,
  Briefcase,
  ListChecks,
  Trash2,
  Image as ImageIcon,
  UserPlus,
  Check,
} from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectKey: string;
  firstColumnId: string;
  clients: any[];
  members: any[];
}

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  projectKey,
  firstColumnId,
  clients,
  members,
}: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [selectedClient, setSelectedClient] = useState("");

  const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

  const [subtasks, setSubtasks] = useState<
    { id: string; title: string; completed: boolean }[]
  >([]);
  const [newSubtask, setNewSubtask] = useState("");

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const toggleAssignee = (member: any) => {
    const isAssigned = selectedAssignees.some((a) => a.email === member.email);
    if (isAssigned) {
      setSelectedAssignees(
        selectedAssignees.filter((a) => a.email !== member.email),
      );
    } else {
      setSelectedAssignees([
        ...selectedAssignees,
        {
          name: member.name,
          photo: member.photoURL || member.photo,
          email: member.email,
        },
      ]);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false },
    ]);
    setNewSubtask("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3000000) {
      alert("A imagem de capa não pode ultrapassar 3MB.");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }

    setIsUploadingCover(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(reader.result as string);
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setIsLoading(true);
    try {
      const taskKey = `${projectKey}-${Math.floor(Math.random() * 1000) + 100}`;

      await addDoc(collection(db, "projects", projectId, "tasks"), {
        title: title.trim(),
        description: description.trim(),
        status: firstColumnId,
        target: "sprint",
        priority: priority,
        taskKey: taskKey,
        clientId: selectedClient || null,
        assignees: selectedAssignees,
        checklist: subtasks,
        coverImage: coverImage,
        attachmentsCount: coverImage ? 1 : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedClient("");
      setSelectedAssignees([]);
      setIsAssigneeOpen(false);
      setSubtasks([]);
      setCoverImage(null);
      onClose();
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-bgPanel border border-borderFocus rounded-[2.5rem] w-full max-w-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col max-h-[90vh]"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="p-6 border-b border-borderSubtle relative shrink-0">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-1.5">
                    <Target size={14} />
                    <span>Nova Demanda</span>
                  </div>
                  <h2 className="text-2xl font-black text-textPrimary tracking-tight">
                    Criar Cartão Visual
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-textMuted hover:text-textPrimary bg-bgGlass hover:bg-bgGlassHover p-2.5 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleCreateTask}
              className="p-6 space-y-6 relative flex-1 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    O que precisa ser feito? *
                  </label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Layout da Landing Page..."
                    className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-3.5 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Briefcase size={12} /> Cliente Associado
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-4 py-3.5 text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-bgPanel">
                      Sem cliente associado
                    </option>
                    {clients.map((client) => (
                      <option
                        key={client.id}
                        value={client.id}
                        className="bg-bgPanel"
                      >
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bgGlass border border-borderSubtle p-4 rounded-[1.5rem]">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Flag size={12} /> Prioridade
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["low", "medium", "high", "urgent"] as const).map((p) => {
                      const labels = {
                        low: "Baixa",
                        medium: "Normal",
                        high: "Alta",
                        urgent: "Urgente",
                      };
                      const colors = {
                        low: "hover:border-emerald-500/50 text-emerald-400",
                        medium: "hover:border-amber-500/50 text-amber-400",
                        high: "hover:border-rose-500/50 text-rose-400",
                        urgent: "hover:border-red-500/50 text-red-500",
                      };
                      const activeColors = {
                        low: "border-emerald-500/50 bg-emerald-500/10",
                        medium: "border-amber-500/50 bg-amber-500/10",
                        high: "border-rose-500/50 bg-rose-500/10",
                        urgent: "border-red-500/50 bg-red-500/10",
                      };

                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            priority === p
                              ? activeColors[p]
                              : `border-borderSubtle bg-bgGlassHover text-textMuted ${colors[p]}`
                          }`}
                        >
                          {labels[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserPlus size={12} /> Responsáveis
                  </label>
                  <div className="flex items-center gap-3 bg-bgSurface border border-borderFocus p-2.5 rounded-2xl h-[52px]">
                    <div className="flex -space-x-2 overflow-hidden px-2 flex-1">
                      {selectedAssignees.length === 0 && (
                        <span className="text-xs text-textMuted italic py-1">
                          Nenhum responsável
                        </span>
                      )}
                      {selectedAssignees.map((a, i) => (
                        <img
                          key={i}
                          src={a.photo}
                          className="w-7 h-7 rounded-full border-2 border-bgSurface object-cover"
                          title={a.name}
                          alt=""
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                      className="flex items-center justify-center w-8 h-8 rounded-xl bg-bgGlassHover hover:bg-indigo-500/20 hover:text-indigo-400 text-textMuted transition-colors shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isAssigneeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-2 right-0 w-64 bg-bgSurface border border-borderFocus rounded-2xl shadow-2xl p-2 z-[310] backdrop-blur-xl"
                      >
                        <div className="text-[9px] font-bold text-textMuted p-3 uppercase tracking-widest border-b border-borderSubtle mb-2">
                          Atribuir à Equipe
                        </div>
                        {members.map((member: any) => (
                          <button
                            type="button"
                            key={member.email}
                            onClick={() => toggleAssignee(member)}
                            className="w-full flex items-center justify-between p-3 hover:bg-bgGlassHover rounded-xl transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={member.photoURL || member.photo}
                                className="w-7 h-7 rounded-lg object-cover"
                                alt=""
                              />
                              <span className="text-xs text-textSecondary font-bold">
                                {member.name}
                              </span>
                            </div>
                            {selectedAssignees.some(
                              (a: any) => a.email === member.email,
                            ) && (
                              <Check size={14} className="text-indigo-500" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2 bg-bgGlass border border-borderSubtle p-4 rounded-[1.5rem]">
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2 mb-2">
                  <ImageIcon size={12} /> Imagem de Capa do Cartão (Opcional)
                </label>

                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                  accept="image/*"
                  className="hidden"
                />

                {coverImage ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-borderFocus group">
                    <img
                      src={coverImage}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setCoverImage(null)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Remover Capa
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-borderSubtle hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl flex flex-col items-center justify-center gap-2 text-textMuted hover:text-indigo-400 transition-all"
                  >
                    {isUploadingCover ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <ImageIcon size={24} className="opacity-50" />
                    )}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Clique para anexar imagem
                      </span>
                      <span className="text-[9px] opacity-60">
                        Recomendado para visualização no Kanban (Máx 3MB)
                      </span>
                    </div>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                  <AlignLeft size={12} /> Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione os detalhes completos, briefing ou requisitos da tarefa..."
                  rows={2}
                  className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-3.5 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint resize-none custom-scrollbar"
                />
              </div>

              <div className="space-y-2 bg-bgGlass border border-borderSubtle p-4 rounded-[1.5rem]">
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2 mb-2">
                  <ListChecks size={12} /> Subtarefas / Checklist
                </label>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Ex: Pesquisar referências..."
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddSubtask())
                    }
                    className="flex-1 bg-bgSurface border border-borderFocus text-textPrimary rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="bg-bgGlassHover hover:bg-bgSurfaceActive text-textPrimary p-2.5 rounded-xl transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between bg-bgGlassHover border border-borderSubtle px-3 py-2.5 rounded-xl group"
                      >
                        <span className="text-[13px] text-textSecondary">
                          {st.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-textMuted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="p-6 border-t border-borderSubtle flex items-center justify-between shrink-0 bg-bgPanel">
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textPrimary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                disabled={isLoading || !title.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(79,70,229,0.2)] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} strokeWidth={3} />
                )}{" "}
                Criar Cartão
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}