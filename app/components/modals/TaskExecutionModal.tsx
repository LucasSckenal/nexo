"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Paperclip,
  Send,
  Plus,
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
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const updateTask = async (data: any) => {
    await updateDoc(
      doc(db, "projects", activeProjectId, "tasks", localTask.id),
      data,
    );
  };

  const handleOpenDeleteModal = () => setIsDeleteModalOpen(true);
  const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

  const confirmDeleteTask = async () => {
    try {
      await deleteDoc(
        doc(db, "projects", activeProjectId, "tasks", localTask.id),
      );
      handleCloseDeleteModal();
      onClose();
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 850000) {
      alert("Arquivo muito grande. Máximo 800KB.");
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
      await updateTask({
        assignees: localTask.assignees.filter(
          (a: any) => a.email !== member.email,
        ),
      });
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
    <>
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDeleteModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bgPanel border border-borderFocus rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-8 items-center text-center"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none z-0" />
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full mb-6 text-red-400">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-textPrimary tracking-tighter mb-4">
                Confirmar Exclusão
              </h3>
              <p className="text-textSecondary text-sm leading-relaxed font-medium mb-10">
                Tem certeza de que deseja excluir este cartão? Esta ação é
                irreversível.
              </p>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={handleCloseDeleteModal}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textPrimary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteTask}
                  className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-colors shadow-lg"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl h-[90vh] bg-bgPanel border border-borderFocus rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

              <div className="px-10 py-8 border-b border-borderSubtle relative z-50 shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-[0.2em]">
                        {localTask.taskKey}
                      </span>
                      {localTask.branch && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bgGlass border border-borderSubtle text-textSecondary">
                          <GitBranch size={12} className="text-indigo-500" />
                          <span className="text-[10px] font-mono lowercase italic">
                            {localTask.branch}
                          </span>
                        </div>
                      )}
                      <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest ml-2">
                        • Detalhes da Tarefa
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-textPrimary tracking-tighter mt-1">
                      {localTask.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenDeleteModal}
                      className="p-3 bg-bgGlass text-textMuted border border-transparent hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all shadow-sm"
                      title="Excluir Cartão"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-3 bg-bgGlass border border-transparent hover:border-borderFocus hover:bg-bgGlassHover rounded-2xl text-textMuted hover:text-textPrimary transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex-1 flex gap-4 text-textSecondary bg-bgGlass p-5 rounded-[1.5rem] border border-borderSubtle">
                    <AlignLeft
                      size={18}
                      className="mt-0.5 shrink-0 text-indigo-500"
                    />
                    <p className="text-sm leading-relaxed font-medium">
                      {localTask.description || "Sem descrição de escopo."}
                    </p>
                  </div>

                  <div className="min-w-[240px] space-y-3 bg-bgGlassHover p-5 rounded-[1.5rem] border border-borderSubtle">
                    <span className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em]">
                      Equipe Responsável
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {localTask.assignees?.map((a: any, i: number) => (
                          <img
                            key={i}
                            src={a.photo}
                            className="h-10 w-10 rounded-xl ring-4 ring-bgPanel border border-borderFocus object-cover"
                            title={a.name}
                          />
                        ))}
                      </div>
                      <div className="relative z-20">
                        <button
                          onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                          className="w-10 h-10 rounded-xl border border-dashed border-borderFocus flex items-center justify-center text-textMuted hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all"
                        >
                          <UserPlus size={18} />
                        </button>
                        <AnimatePresence>
                          {isAssigneeOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 mt-4 w-64 bg-bgSurface border border-borderFocus rounded-2xl shadow-2xl p-2 z-[310] backdrop-blur-xl"
                            >
                              <div className="text-[9px] font-bold text-textMuted p-3 uppercase tracking-widest border-b border-borderSubtle mb-2">
                                Membros do Projeto
                              </div>
                              {projectMembers.map((member: any) => (
                                <button
                                  key={member.email}
                                  onClick={() => toggleAssignee(member)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-bgSurfaceHover rounded-xl transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={member.photoURL}
                                      className="w-7 h-7 rounded-lg"
                                      alt=""
                                    />
                                    <span className="text-xs text-textSecondary font-bold">
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

              <div className="flex-1 flex overflow-hidden lg:flex-row flex-col relative z-10">
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                      <Layout size={14} className="text-indigo-500" /> Checklist
                      de Trabalho
                    </div>
                    <div className="space-y-2.5">
                      {localTask.checklist?.map((item: any) => (
                        <div
                          key={item.id}
                          className="group flex items-center gap-4 p-4 rounded-2xl bg-bgGlass border border-borderSubtle transition-all hover:bg-bgGlassHover"
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
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${item.completed ? "bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "border-borderFocus hover:border-textMuted"}`}
                          >
                            {item.completed && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium flex-1 transition-colors ${item.completed ? "text-textFaint line-through" : "text-textPrimary"}`}
                          >
                            {item.title}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center gap-3">
                        <input
                          placeholder="Adicionar nova subtarefa..."
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
                          className="w-full bg-bgGlass border border-borderSubtle rounded-2xl py-4 px-5 text-sm text-textPrimary focus:border-indigo-500/50 outline-none transition-all placeholder:text-textMuted"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                      <Paperclip size={14} className="text-indigo-500" /> Ativos
                      e Documentação
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {localTask.attachments?.map((item: any) => (
                        <div
                          key={item.id}
                          className="group relative aspect-video rounded-2xl overflow-hidden border border-borderFocus bg-bgSurface flex flex-col items-center justify-center"
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
                                PDF
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
                                className="p-2 bg-indigo-600 rounded-xl text-white hover:scale-105 transition-transform"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button
                                onClick={() =>
                                  updateTask({ attachments: arrayRemove(item) })
                                }
                                className="p-2 bg-red-600 rounded-xl text-white hover:scale-105 transition-transform"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video rounded-2xl border border-dashed border-borderFocus flex flex-col items-center justify-center gap-2 hover:bg-bgGlassHover hover:border-indigo-500/50 transition-all text-textMuted group"
                      >
                        {isUploading ? (
                          <Loader2
                            size={24}
                            className="animate-spin text-indigo-500"
                          />
                        ) : (
                          <UploadCloud
                            size={24}
                            className="group-hover:text-indigo-400"
                          />
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest group-hover:text-indigo-400">
                          Arquivo / Imagem
                        </span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,application/pdf"
                        />
                      </button>
                      <button
                        onClick={() => setIsAddingLink(true)}
                        className="aspect-video rounded-2xl border border-dashed border-borderFocus flex flex-col items-center justify-center gap-2 hover:bg-bgGlassHover hover:border-indigo-500/50 transition-all text-textMuted group"
                      >
                        <LinkIcon
                          size={24}
                          className="group-hover:text-indigo-400"
                        />
                        <span className="text-[9px] font-black uppercase tracking-widest group-hover:text-indigo-400">
                          Vincular URL
                        </span>
                      </button>
                    </div>
                    {isAddingLink && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-[1.5rem] bg-indigo-500/5 border border-indigo-500/20 space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            placeholder="Nome do recurso"
                            value={linkData.name}
                            onChange={(e) =>
                              setLinkData({ ...linkData, name: e.target.value })
                            }
                            className="bg-bgSurface border border-borderFocus rounded-xl px-4 py-3 text-xs text-textPrimary focus:border-indigo-500 outline-none"
                          />
                          <input
                            placeholder="https://..."
                            value={linkData.url}
                            onChange={(e) =>
                              setLinkData({ ...linkData, url: e.target.value })
                            }
                            className="bg-bgSurface border border-borderFocus rounded-xl px-4 py-3 text-xs text-textPrimary focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setIsAddingLink(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textPrimary"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleAddLink}
                            className="bg-indigo-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-600 transition-colors"
                          >
                            Confirmar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </section>
                </div>
                <div className="w-full lg:w-[420px] border-l border-borderSubtle bg-bgSurface flex flex-col">
                  <div className="p-6 border-b border-borderSubtle">
                    <h3 className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
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
                            className="w-6 h-6 rounded-lg object-cover border border-borderFocus"
                            alt=""
                          />
                          <span className="text-[11px] font-bold text-textPrimary">
                            {msg.userName}
                          </span>
                          <span className="text-[9px] text-textMuted ml-auto">
                            Agora
                          </span>
                        </div>
                        <div className="bg-bgGlassHover p-4 rounded-2xl rounded-tl-none text-[13px] text-textSecondary border border-borderSubtle leading-relaxed">
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-bgPanel border-t border-borderSubtle">
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
                        placeholder="Adicionar comentário..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-bgGlassHover border border-borderFocus rounded-2xl py-4 pl-5 pr-14 text-sm text-textPrimary focus:border-indigo-500/50 outline-none transition-all placeholder:text-textMuted"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-indigo-500 rounded-xl text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-600 transition-all"
                      >
                        <Send size={16} className="ml-1" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}