"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { RichTextEditor } from "../ui/RichTextEditor";
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ==========================================
// MODAL PRINCIPAL
// ==========================================
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
  const [dueDate, setDueDate] = useState(""); // Estado para Data de Entrega

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

      let taskDueDate = null;
      if (dueDate) {
        taskDueDate = new Date(`${dueDate}T12:00:00`);
      }

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
        dueDate: taskDueDate,
        attachmentsCount: coverImage ? 1 : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedClient("");
      setDueDate("");
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
            className="bg-bgPanel border border-borderFocus rounded-[2.5rem] w-full max-w-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-visible relative flex flex-col max-h-[90vh]"
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
              className="p-6 space-y-6 relative flex-1 overflow-y-visible sm:overflow-y-auto custom-scrollbar pb-32"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-bgGlass border border-borderSubtle p-4 rounded-[1.5rem]">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Flag size={12} /> Prioridade
                  </label>
                  <div className="flex flex-col gap-2">
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className={`w-full bg-bgGlassHover border border-borderSubtle rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer transition-colors
                        ${priority === "urgent" ? "text-red-500 bg-red-500/5 border-red-500/20" : ""}
                        ${priority === "high" ? "text-rose-400 bg-rose-500/5 border-rose-500/20" : ""}
                        ${priority === "medium" ? "text-amber-400 bg-amber-500/5 border-amber-500/20" : ""}
                        ${priority === "low" ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" : ""}
                      `}
                    >
                      <option
                        value="low"
                        className="bg-bgPanel text-emerald-400"
                      >
                        🟢 Baixa
                      </option>
                      <option
                        value="medium"
                        className="bg-bgPanel text-amber-400"
                      >
                        🟡 Normal
                      </option>
                      <option value="high" className="bg-bgPanel text-rose-400">
                        🟠 Alta
                      </option>
                      <option
                        value="urgent"
                        className="bg-bgPanel text-red-500"
                      >
                        🔴 Urgente
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <CalendarIcon size={12} /> Data de Entrega
                  </label>
                  <CustomDatePicker
                    value={dueDate}
                    onChange={(newDate) => setDueDate(newDate)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserPlus size={12} /> Atribuir a
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                      className="w-full bg-bgGlassHover border border-borderSubtle rounded-xl p-2 flex items-center gap-2 hover:border-indigo-500/30 transition-all text-left"
                    >
                      <div className="flex -space-x-2 shrink-0">
                        {selectedAssignees.length > 0 ? (
                          selectedAssignees
                            .slice(0, 3)
                            .map((a, i) => (
                              <img
                                key={i}
                                src={
                                  a.photo ||
                                  `https://ui-avatars.com/api/?name=${a.name}`
                                }
                                className="w-8 h-8 rounded-full border-2 border-bgPanel object-cover"
                                alt={a.name}
                              />
                            ))
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-bgPanel bg-bgSurfaceActive flex items-center justify-center">
                            <UserPlus size={12} className="text-textMuted" />
                          </div>
                        )}
                        {selectedAssignees.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-bgPanel bg-bgSurfaceActive flex items-center justify-center text-[10px] font-bold text-textPrimary">
                            +{selectedAssignees.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        {selectedAssignees.length === 0 ? (
                          <span className="text-xs text-textMuted">
                            Ninguém atribuído
                          </span>
                        ) : (
                          <span className="text-xs text-textPrimary font-medium truncate block">
                            {selectedAssignees.length} membro(s)
                          </span>
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isAssigneeOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-full right-0 mt-2 w-64 bg-bgPanel border border-borderFocus rounded-2xl shadow-2xl z-50 p-2 max-h-48 overflow-y-auto custom-scrollbar"
                        >
                          {members.map((member) => {
                            const isAssigned = selectedAssignees.some(
                              (a) => a.email === member.email,
                            );
                            return (
                              <button
                                key={member.email}
                                type="button"
                                onClick={() => toggleAssignee(member)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-sm transition-all group ${isAssigned ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-bgSurfaceHover text-textSecondary"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      member.photoURL ||
                                      member.photo ||
                                      `https://ui-avatars.com/api/?name=${member.name}`
                                    }
                                    className="w-6 h-6 rounded-full border border-borderSubtle"
                                    alt=""
                                  />
                                  <span className="truncate max-w-[130px] font-medium">
                                    {member.name}
                                  </span>
                                </div>
                                {isAssigned && (
                                  <Check
                                    size={14}
                                    className="text-indigo-400"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="space-y-3 w-full min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bgGlass flex items-center justify-center shrink-0 border border-borderSubtle">
                    <AlignLeft size={14} className="text-textMuted" />
                  </div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-textMuted">
                    Detalhes da Demanda
                  </label>
                </div>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Escreve os detalhes, links, referências..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ListChecks size={12} /> Subtarefas Iniciais
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      placeholder="Nova subtarefa... (Prima Enter)"
                      className="flex-1 bg-bgGlassHover border border-borderSubtle text-textPrimary rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="bg-bgSurfaceActive hover:bg-bgSurface border border-borderSubtle text-textSecondary p-2.5 rounded-xl transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {subtasks.length > 0 && (
                    <div className="bg-bgGlass border border-borderSubtle rounded-2xl p-2 space-y-1">
                      {subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between px-3 py-2 bg-bgSurfaceActive rounded-xl text-sm group"
                        >
                          <span className="text-textSecondary">{st.title}</span>
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

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ImageIcon size={12} /> Capa do Cartão (Opcional)
                  </label>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className={`w-full h-[120px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden relative ${
                      coverImage
                        ? "border-indigo-500/50 bg-indigo-500/5"
                        : "border-borderFocus hover:border-indigo-500/50 bg-bgGlassHover"
                    }`}
                  >
                    {isUploadingCover ? (
                      <Loader2
                        size={24}
                        className="animate-spin text-indigo-400"
                      />
                    ) : coverImage ? (
                      <>
                        <img
                          src={coverImage}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                          alt="Cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-bgPanel px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl border border-borderSubtle">
                            Trocar Capa
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-bgSurfaceActive flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <ImageIcon size={16} className="text-textMuted" />
                        </div>
                        <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest text-center px-4">
                          Clique para anexar imagem
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverUpload}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif, image/webp"
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-borderSubtle flex items-center justify-between shrink-0 bg-bgPanel z-20">
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
