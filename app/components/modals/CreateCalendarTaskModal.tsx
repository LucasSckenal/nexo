"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import {
  X,
  Loader2,
  Calendar as CalendarIcon,
  AlignLeft,
  Flag,
  Briefcase,
  UserPlus,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";



// ==========================================
// MODAL PRINCIPAL
// ==========================================
interface CreateCalendarTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectKey: string;
  firstColumnId: string;
  clients: any[];
  members: any[];
  initialDate?: string;
}

export function CreateCalendarTaskModal({
  isOpen,
  onClose,
  projectId,
  projectKey,
  firstColumnId,
  clients,
  members,
  initialDate,
}: CreateCalendarTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [selectedClient, setSelectedClient] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialDate) {
      setDueDate(initialDate);
    } else if (isOpen && !initialDate) {
      setDueDate("");
    }
  }, [isOpen, initialDate]);

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
        status: firstColumnId || "todo",
        target: "sprint",
        priority: priority,
        taskKey: taskKey,
        clientId: selectedClient || null,
        assignees: selectedAssignees,
        checklist: [],
        dueDate: taskDueDate,
        attachmentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedClient("");
      setDueDate("");
      setSelectedAssignees([]);
      onClose();
    } catch (error) {
      console.error("Erro ao agendar tarefa:", error);
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
            className="bg-bgPanel border border-borderFocus rounded-[2.5rem] w-full max-w-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-visible relative flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="p-6 border-b border-borderSubtle relative shrink-0">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-1.5">
                    <CalendarIcon size={14} />
                    <span>Agendamento</span>
                  </div>
                  <h2 className="text-2xl font-black text-textPrimary tracking-tight">
                    Agendar Demanda
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
              className="p-6 space-y-6 relative flex-1 overflow-visible" // <--- Importante: overflow-visible para o popup do calendário não cortar
            >
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
                  placeholder="Ex: Reunião de Alinhamento, Entrega do Layout..."
                  className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-3.5 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <CalendarIcon size={12} /> Data do Evento/Entrega
                  </label>
                  {/* === NOSSO NOVO CUSTOM DATE PICKER === */}
                  <CustomDatePicker
                    value={dueDate}
                    onChange={(newDate) => setDueDate(newDate)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Flag size={12} /> Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className={`w-full bg-bgGlassHover border border-borderFocus rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer transition-colors
                      ${priority === "urgent" ? "text-red-500" : ""}
                      ${priority === "high" ? "text-rose-400" : ""}
                      ${priority === "medium" ? "text-amber-400" : ""}
                      ${priority === "low" ? "text-emerald-400" : ""}
                    `}
                  >
                    <option value="low" className="bg-bgPanel text-emerald-400">
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
                    <option value="urgent" className="bg-bgPanel text-red-500">
                      🔴 Urgente
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Sem cliente
                    </option>
                    {clients?.map((client) => (
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserPlus size={12} /> Responsáveis
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                      className="w-full bg-bgGlassHover border border-borderFocus rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm transition-all"
                    >
                      <span className="text-textPrimary truncate">
                        {selectedAssignees.length === 0
                          ? "Ninguém atribuído"
                          : `${selectedAssignees.length} membro(s)`}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isAssigneeOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-full right-0 mt-2 w-full bg-bgPanel border border-borderFocus rounded-2xl shadow-2xl z-50 p-2 max-h-48 overflow-y-auto custom-scrollbar"
                        >
                          {members?.map((member) => {
                            const isAssigned = selectedAssignees.some(
                              (a) => a.email === member.email,
                            );
                            return (
                              <button
                                key={member.email}
                                type="button"
                                onClick={() => toggleAssignee(member)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-sm transition-all ${
                                  isAssigned
                                    ? "bg-indigo-500/10 text-indigo-400"
                                    : "hover:bg-bgSurfaceHover text-textSecondary"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      member.photoURL ||
                                      member.photo ||
                                      `https://ui-avatars.com/api/?name=${member.name}`
                                    }
                                    className="w-6 h-6 rounded-full"
                                    alt=""
                                  />
                                  <span>{member.name}</span>
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1 flex items-center gap-2">
                  <AlignLeft size={12} /> Notas / Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Algum detalhe extra sobre essa entrega?"
                  className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint custom-scrollbar min-h-[100px] resize-none"
                />
              </div>
            </form>

            <div className="p-6 border-t border-borderSubtle flex items-center justify-between shrink-0 bg-bgPanel rounded-b-[2.5rem]">
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
                disabled={isLoading || !title.trim() || !dueDate}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(79,70,229,0.2)] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CalendarIcon size={16} />
                )}
                Agendar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
