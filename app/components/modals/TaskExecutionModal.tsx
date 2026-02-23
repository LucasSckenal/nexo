"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Send,
  Plus,
  FileText,
  Globe,
  UserPlus,
  AlignLeft,
  Layout,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  UploadCloud,
  Loader2,
  FileSearch,
  Check,
  GitBranch,
} from "lucide-react";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  activeProjectId: string;
}

export function TaskExecutionModal({
  isOpen,
  onClose,
  task,
  activeProjectId,
}: Props) {
  const [localTask, setLocalTask] = useState<any>(task);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkData, setLinkData] = useState({ name: "", url: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Sync em Tempo Real e Carregamento de Membros
  useEffect(() => {
    if (!isOpen || !task?.id || !activeProjectId) return;

    const taskRef = doc(db, "projects", activeProjectId, "tasks", task.id);
    const unsubscribe = onSnapshot(taskRef, (docSnap) => {
      if (docSnap.exists()) setLocalTask({ id: docSnap.id, ...docSnap.data() });
    });

    const projectRef = doc(db, "projects", activeProjectId);
    getDoc(projectRef).then((docSnap) => {
      if (docSnap.exists()) setProjectMembers(docSnap.data().members || []);
    });

    return () => unsubscribe();
  }, [isOpen, task?.id, activeProjectId]);

  if (!localTask) return null;

  // --- FUNÇÕES DE ATUALIZAÇÃO ---
  const updateTask = async (data: any) => {
    const taskRef = doc(db, "projects", activeProjectId, "tasks", localTask.id);
    await updateDoc(taskRef, data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite recomendado para Base64 no Firestore (~800KB)
    if (file.size > 850000) {
      alert("Ficheiro muito grande. Máximo 800KB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const fileType = file.type.includes("image")
        ? "image"
        : file.type.includes("pdf")
          ? "pdf"
          : "file";

      await updateTask({
        attachments: arrayUnion({
          id: Date.now().toString(),
          name: file.name,
          url: base64String,
          type: fileType,
          addedAt: new Date().toISOString(),
        }),
        attachmentsCount: (localTask.attachmentsCount || 0) + 1,
      });
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleAddLink = async () => {
    if (!linkData.name || !linkData.url) return;
    const url = linkData.url.startsWith("http")
      ? linkData.url
      : `https://${linkData.url}`;
    await updateTask({
      attachments: arrayUnion({
        id: Date.now().toString(),
        name: linkData.name,
        url,
        type: "link",
      }),
      attachmentsCount: (localTask.attachmentsCount || 0) + 1,
    });
    setLinkData({ name: "", url: "" });
    setIsAddingLink(false);
  };

  const toggleAssignee = async (member: any) => {
    const isAssigned = localTask.assignees?.some(
      (a: any) => a.email === member.email,
    );
    if (isAssigned) {
      const updated = localTask.assignees.filter(
        (a: any) => a.email !== member.email,
      );
      await updateTask({ assignees: updated });
    } else {
      await updateTask({
        assignees: arrayUnion({
          name: member.name,
          photo: member.photoURL,
          email: member.email,
        }),
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-full max-w-6xl h-[90vh] bg-[#080808] border border-white/[0.05] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* --- HEADER --- */}
            <div className="px-10 py-8 border-b border-white/[0.05]">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-[0.2em]">
                      {localTask.taskKey}
                    </span>
                    {/* --- EXIBIÇÃO DA BRANCH --- */}
                    {localTask.branch && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10">
                        <GitBranch size={10} className="text-indigo-500" />
                        <span className="text-[10px] font-mono text-zinc-400 lowercase italic">
                          {localTask.branch}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                      • Modo Execução
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">
                    {localTask.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1 flex gap-3 text-zinc-500 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.03]">
                  <AlignLeft
                    size={18}
                    className="mt-1 shrink-0 text-indigo-500"
                  />
                  <p className="text-[13.5px] leading-relaxed font-medium italic">
                    {localTask.description || "Sem descrição de escopo."}
                  </p>
                </div>

                <div className="min-w-[240px] space-y-3">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">
                    Equipa Responsável
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {localTask.assignees?.map((a: any, i: number) => (
                        <img
                          key={i}
                          src={a.photo}
                          className="h-10 w-10 rounded-full ring-4 ring-[#080808] border border-white/10 object-cover"
                          title={a.name}
                        />
                      ))}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                        className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/50 bg-white/[0.02] transition-all"
                      >
                        <UserPlus size={18} />
                      </button>

                      <AnimatePresence>
                        {isAssigneeOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-4 w-64 bg-[#0D0D0F] border border-white/10 rounded-2xl shadow-2xl p-2 z-[310] backdrop-blur-xl"
                          >
                            <div className="text-[9px] font-bold text-zinc-600 p-3 uppercase tracking-widest border-b border-white/5 mb-2">
                              Membros do Projeto
                            </div>
                            {projectMembers.map((member: any) => (
                              <button
                                key={member.email}
                                onClick={() => toggleAssignee(member)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={member.photoURL}
                                    className="w-7 h-7 rounded-full"
                                    alt=""
                                  />
                                  <span className="text-xs text-zinc-300 font-bold">
                                    {member.name}
                                  </span>
                                </div>
                                {localTask.assignees?.some(
                                  (a: any) => a.email === member.email,
                                ) && (
                                  <Check
                                    size={14}
                                    className="text-indigo-500"
                                  />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden lg:flex-row flex-col">
              {/* --- COLUNA ESQUERDA: CHECKLIST E MEDIA --- */}
              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                {/* Subtasks */}
                <section className="space-y-5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <Layout size={14} className="text-indigo-500" /> Checklist
                    de Trabalho
                  </div>
                  <div className="space-y-2.5">
                    {localTask.checklist?.map((item: any) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-all"
                      >
                        <div
                          onClick={async () => {
                            const updated = localTask.checklist.map(
                              (it: any) =>
                                it.id === item.id
                                  ? { ...it, completed: !it.completed }
                                  : it,
                            );
                            await updateTask({ checklist: updated });
                          }}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${item.completed ? "bg-indigo-500 border-indigo-500" : "border-zinc-700"}`}
                        >
                          {item.completed && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium flex-1 ${item.completed ? "text-zinc-600 line-through" : "text-zinc-300"}`}
                        >
                          {item.title}
                        </span>
                      </div>
                    ))}
                    <input
                      placeholder="Adicionar passo de execução... (Enter)"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && newSubtask.trim()) {
                          await updateTask({
                            checklist: arrayUnion({
                              id: Date.now().toString(),
                              title: newSubtask,
                              completed: false,
                            }),
                          });
                          setNewSubtask("");
                        }
                      }}
                      className="w-full bg-transparent border border-dashed border-white/10 rounded-2xl py-4 px-6 text-sm text-zinc-500 focus:border-indigo-500/50 outline-none transition-all"
                    />
                  </div>
                </section>

                {/* --- SEÇÃO DE ANEXOS (IMAGENS, PDF E LINKS) --- */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <Paperclip size={14} className="text-indigo-500" /> Ativos &
                    Documentação
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {localTask.attachments?.map((item: any) => (
                      <div
                        key={item.id}
                        className="group relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center"
                      >
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : item.type === "pdf" ? (
                          <div className="flex flex-col items-center gap-2 text-red-400">
                            <FileSearch size={32} />
                            <span className="text-[9px] font-black uppercase">
                              Documento PDF
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-indigo-400">
                            <LinkIcon size={32} />
                            <span className="text-[9px] font-black uppercase">
                              Link Externo
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4">
                          <p className="text-[10px] text-white font-bold mb-3 truncate w-full text-center px-4">
                            {item.name}
                          </p>
                          <div className="flex gap-2">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-indigo-600 rounded-full text-white hover:scale-110 transition-transform"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              onClick={() =>
                                updateTask({ attachments: arrayRemove(item) })
                              }
                              className="p-2 bg-red-600 rounded-full text-white hover:scale-110 transition-transform"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Botão Upload (Img/PDF) */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] transition-all text-zinc-600 group"
                    >
                      {isUploading ? (
                        <Loader2
                          size={24}
                          className="animate-spin text-indigo-500"
                        />
                      ) : (
                        <UploadCloud
                          size={24}
                          className="group-hover:text-indigo-500"
                        />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Ficheiro / Imagem
                      </span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,application/pdf"
                      />
                    </button>

                    {/* Botão Adicionar Link */}
                    <button
                      onClick={() => setIsAddingLink(true)}
                      className="aspect-video rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] transition-all text-zinc-600 group"
                    >
                      <Globe
                        size={24}
                        className="group-hover:text-indigo-500"
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Vincular URL
                      </span>
                    </button>
                  </div>

                  {/* Form Link (Condicional) */}
                  {isAddingLink && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          placeholder="Nome do recurso"
                          value={linkData.name}
                          onChange={(e) =>
                            setLinkData({ ...linkData, name: e.target.value })
                          }
                          className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none"
                        />
                        <input
                          placeholder="https://..."
                          value={linkData.url}
                          onChange={(e) =>
                            setLinkData({ ...linkData, url: e.target.value })
                          }
                          className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setIsAddingLink(false)}
                          className="text-xs text-zinc-500 font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleAddLink}
                          className="bg-indigo-600 px-5 py-2 rounded-lg text-xs font-black text-white uppercase"
                        >
                          Confirmar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </section>
              </div>

              {/* --- COLUNA DIREITA: FEED DE ATIVIDADE --- */}
              <div className="w-full lg:w-[420px] border-l border-white/[0.05] bg-black/20 flex flex-col">
                <div className="p-6 border-b border-white/[0.05] bg-white/[0.01]">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-500" />{" "}
                    Histórico de Execução
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {localTask.comments?.map((msg: any) => (
                    <div
                      key={msg.id}
                      className="animate-in fade-in slide-in-from-right-2"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={msg.userPhoto}
                          className="w-6 h-6 rounded-full border border-white/10"
                          alt=""
                        />
                        <span className="text-[11px] font-bold text-zinc-300">
                          {msg.userName}
                        </span>
                        <span className="text-[9px] text-zinc-600 ml-auto">
                          Agora
                        </span>
                      </div>
                      <div className="bg-white/[0.04] p-4 rounded-2xl rounded-tl-none text-[12.5px] text-zinc-400 border border-white/[0.05] leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Chat */}
                <div className="p-6 bg-[#080808] border-t border-white/[0.05]">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!comment.trim() || !auth.currentUser) return;
                      await updateTask({
                        comments: arrayUnion({
                          id: Date.now().toString(),
                          text: comment,
                          userName: auth.currentUser.displayName || "Membro",
                          userPhoto: auth.currentUser.photoURL || "",
                          createdAt: new Date().toISOString(),
                        }),
                      });
                      setComment("");
                    }}
                    className="relative"
                  >
                    <input
                      placeholder="Relatar progresso..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-indigo-600 rounded-xl text-white shadow-lg hover:bg-indigo-500 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
