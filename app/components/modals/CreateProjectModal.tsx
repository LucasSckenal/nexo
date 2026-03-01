"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Code2,
  Palette,
  FolderPlus,
  Image as ImageIcon,
  Smile,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  // Estados Básicos
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"programming" | "design">(
    "programming",
  );
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Ícone
  const [iconType, setIconType] = useState<"emoji" | "image">("emoji");
  const [projectEmoji, setProjectEmoji] = useState("✨");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (name && !key) {
      const suggestedKey = name
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 3)
        .toUpperCase();
      setKey(suggestedKey);
    }
  }, [name]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2000000) {
      alert("A imagem não pode ultrapassar 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      setIconType("image");
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim() || !auth.currentUser) return;

    setIsLoading(true);

    try {
      const user = auth.currentUser;

      await addDoc(collection(db, "projects"), {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        category: category,
        iconType: iconType,
        projectEmoji: projectEmoji,
        imageUrl: imageUrl || "",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        members: [
          {
            name: user.displayName || "Proprietário",
            email: user.email,
            role: "admin",
            photoURL:
              user.photoURL ||
              `https://ui-avatars.com/api/?name=${user.displayName}&background=0D0D0D&color=fff`,
            addedAt: new Date().toISOString(),
          },
        ],
        memberEmails: [user.email],
      });

      setName("");
      setKey("");
      setDescription("");
      setCategory("programming");
      setIconType("emoji");
      setProjectEmoji("✨");
      setImageUrl(null);
      onClose();
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
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
            className="bg-bgPanel border border-borderFocus rounded-[2.5rem] w-full max-w-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="px-8 pt-8 pb-6 border-b border-borderSubtle relative shrink-0">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
                    <FolderPlus size={14} />
                    <span>Workspace</span>
                  </div>
                  <h2 className="text-2xl font-black text-textPrimary tracking-tight">
                    Inicializar Projeto
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-textMuted hover:text-textPrimary bg-bgGlass hover:bg-bgGlassHover p-2 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-textSecondary leading-relaxed mt-1">
                Configure os detalhes base do novo espaço e defina o fluxo
                operacional.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="px-8 py-6 space-y-6 relative flex-1"
            >
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-bgGlass border border-borderSubtle rounded-[1.5rem]">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*"
                />

                <div className="w-20 h-20 shrink-0 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl relative overflow-hidden border border-borderFocus bg-bgSurface">
                  {isUploadingLogo ? (
                    <Loader2 size={20} className="animate-spin text-textMuted" />
                  ) : iconType === "emoji" ? (
                    <div className="w-full h-full bg-gradient-to-br from-bgGlassHover to-bgGlass flex items-center justify-center">
                      <span className="drop-shadow-lg scale-110 transform transition-transform hover:scale-125">
                        {projectEmoji || "✨"}
                      </span>
                    </div>
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Logo"
                      className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-indigo-400 drop-shadow-md text-base">
                        {key.substring(0, 2) || "PR"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 flex-1 text-center sm:text-left">
                  <div>
                    <h3 className="text-sm font-bold text-textPrimary mb-0.5">
                      Ícone Personalizado
                    </h3>
                    <p className="text-[10px] text-textMuted">
                      Faça upload de imagem ou escolha um emoji.
                    </p>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2.5 bg-bgGlassHover p-1.5 rounded-xl border border-borderSubtle w-fit mx-auto sm:mx-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (!imageUrl) fileInputRef.current?.click();
                        else setIconType("image");
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${iconType === "image" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm" : "text-textMuted hover:bg-bgGlassHover border border-transparent"}`}
                    >
                      <ImageIcon size={14} /> Imagem
                    </button>
                    <div className="w-px h-4 bg-borderFocus" />
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${iconType === "emoji" ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm" : "text-textMuted border-transparent hover:bg-bgGlassHover focus-within:border-borderFocus"}`}
                    >
                      <Smile
                        size={14}
                        className={
                          iconType === "emoji"
                            ? "text-amber-400"
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
                        className="bg-transparent w-8 text-center outline-none placeholder:text-textFaint focus:w-10 transition-all text-textPrimary"
                        placeholder="😀"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-textMuted uppercase tracking-widest ml-1">
                  Objetivo / Categoria
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCategory("programming")}
                    className={`group p-4 rounded-[1.5rem] border text-left transition-all relative overflow-hidden ${
                      category === "programming"
                        ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        : "bg-bgGlass border-borderSubtle text-textMuted hover:bg-bgGlassHover"
                    }`}
                  >
                    <div
                      className={`mb-3 p-2.5 rounded-xl w-fit transition-colors ${category === "programming" ? "bg-indigo-500 text-white shadow-md" : "bg-bgGlassHover text-textMuted group-hover:text-textSecondary"}`}
                    >
                      <Code2 size={16} />
                    </div>
                    <span
                      className={`text-sm font-black block mb-0.5 ${category === "programming" ? "text-textPrimary" : "group-hover:text-textSecondary"}`}
                    >
                      Engenharia & Software
                    </span>
                    <span className="text-[10px] leading-relaxed block opacity-60 font-medium">
                      Fluxo com Backlog e Sprints.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("design")}
                    className={`group p-4 rounded-[1.5rem] border text-left transition-all relative overflow-hidden ${
                      category === "design"
                        ? "bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "bg-bgGlass border-borderSubtle text-textMuted hover:bg-bgGlassHover"
                    }`}
                  >
                    <div
                      className={`mb-3 p-2.5 rounded-xl w-fit transition-colors ${category === "design" ? "bg-purple-500 text-white shadow-md" : "bg-bgGlassHover text-textMuted group-hover:text-textSecondary"}`}
                    >
                      <Palette size={16} />
                    </div>
                    <span
                      className={`text-sm font-black block mb-0.5 ${category === "design" ? "text-textPrimary" : "group-hover:text-textSecondary"}`}
                    >
                      Design & Criatividade
                    </span>
                    <span className="text-[10px] leading-relaxed block opacity-60 font-medium">
                      Fluxo contínuo e flexível.
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[9px] font-black text-textMuted uppercase tracking-widest ml-1">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: App de Gestão"
                    className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-textMuted uppercase tracking-widest ml-1">
                    Chave (ID)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="Ex: APPGF"
                    className="w-full bg-bgGlassHover border border-borderFocus text-indigo-400 font-black rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-textMuted uppercase tracking-widest ml-1">
                  Descrição Breve
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Qual o propósito principal deste projeto?"
                  rows={2}
                  className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-textFaint resize-none custom-scrollbar"
                />
              </div>
            </form>

            <div className="px-8 py-6 border-t border-borderSubtle flex items-center justify-between shrink-0 bg-bgPanel">
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textPrimary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="bg-textPrimary text-bgMain hover:opacity-90 px-8 py-3.5 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2.5 disabled:opacity-50 shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FolderPlus size={16} strokeWidth={2.5} />
                )}
                Criar Projeto
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}