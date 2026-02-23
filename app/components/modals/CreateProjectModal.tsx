"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import {
  X,
  FolderPlus,
  Loader2,
  Hash,
  AlignLeft,
  Palette,
  LayoutDashboard,
  ImagePlus,
  Trash2,
} from "lucide-react";

// Cores pré-definidas para o utilizador escolher (caso não use imagem)
const PROJECT_COLORS = [
  { name: "Indigo", value: "#6366f1", bg: "bg-[#6366f1]" },
  { name: "Purple", value: "#a855f7", bg: "bg-[#a855f7]" },
  { name: "Pink", value: "#ec4899", bg: "bg-[#ec4899]" },
  { name: "Red", value: "#ef4444", bg: "bg-[#ef4444]" },
  { name: "Orange", value: "#f97316", bg: "bg-[#f97316]" },
  { name: "Emerald", value: "#10b981", bg: "bg-[#10b981]" },
  { name: "Blue", value: "#3b82f6", bg: "bg-[#3b82f6]" },
];

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  // Novos estados para a Imagem
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gerador Automático da Sigla do Projeto (Project Key)
  useEffect(() => {
    if (name && !projectKey) {
      const words = name.trim().split(/\s+/);
      let generatedKey = "";
      if (words.length > 1) {
        generatedKey = words
          .slice(0, 3)
          .map((w) => w[0])
          .join("");
      } else {
        generatedKey = name.substring(0, 3);
      }
      setProjectKey(generatedKey.toUpperCase());
    }
  }, [name]);

  useEffect(() => {
    if (name.length === 0) setProjectKey("");
  }, [name]);

  if (!isOpen) return null;

  // Lógica para processar a escolha da imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica se o ficheiro é muito grande (Ex: limite de 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem é demasiado grande. O limite é de 2MB.");
      return;
    }

    // Cria a pré-visualização da imagem (Base64)
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!projectKey.trim()) {
      setError("A sigla do projeto é obrigatória.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("Precisa de estar com o login feito para criar um projeto.");
      return;
    }

    setLoading(true);

    try {
      // Cria o documento no Firestore
      await addDoc(collection(db, "projects"), {
        name: name.trim(),
        key: projectKey.trim().toUpperCase(),
        description: description.trim(),
        color: selectedColor.value,
        imageUrl: imagePreview, // Guarda a string Base64 da imagem
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        status: "active",

        // === NOVA LÓGICA DE SEGURANÇA E MEMBROS ===
        members: [
          {
            name: user.displayName || user.email.split("@")[0],
            email: user.email,
            role: "admin",
            photoURL:
              user.photoURL ||
              `https://ui-avatars.com/api/?name=${user.email}&background=27272A&color=fff`,
            addedAt: new Date().toISOString(),
          },
        ],
        memberEmails: [user.email],
        // ==========================================
      });

      // Resetar form
      setName("");
      setProjectKey("");
      setDescription("");
      setSelectedColor(PROJECT_COLORS[0]);
      setImagePreview(null);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Erro ao criar o projeto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#09090B] border border-[#27272A] w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#27272A] bg-[#09090B]">
          <div className="flex items-center gap-3">
            {/* Ícone Dinâmico: Mostra a Imagem se existir, senão mostra a cor escolhida */}
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Logo do Projeto"
                className="w-10 h-10 rounded-xl object-cover border border-[#27272A] shadow-inner"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-colors duration-300"
                style={{
                  backgroundColor: `${selectedColor.value}15`,
                  borderColor: `${selectedColor.value}30`,
                }}
              >
                <FolderPlus size={20} style={{ color: selectedColor.value }} />
              </div>
            )}

            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Criar Novo Projeto
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Configure o seu novo espaço de trabalho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#27272A]"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY / FORMULARIO */}
        <form onSubmit={handleCreateProject} className="flex-1 flex flex-col">
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
                <X size={14} className="shrink-0" /> {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Nome do Projeto
                </label>
                <div className="relative group">
                  <LayoutDashboard
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
                  />
                  <input
                    type="text"
                    autoFocus
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 shadow-inner"
                    placeholder="Ex: App iOS V2"
                  />
                </div>
              </div>

              <div className="w-full sm:w-32 space-y-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Sigla (Key)
                </label>
                <div className="relative group">
                  <Hash
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    value={projectKey}
                    onChange={(e) =>
                      setProjectKey(e.target.value.toUpperCase())
                    }
                    maxLength={5}
                    className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 shadow-inner uppercase font-mono"
                    placeholder="APP"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                Descrição{" "}
                <span className="text-zinc-600 lowercase font-normal">
                  (opcional)
                </span>
              </label>
              <div className="relative group">
                <AlignLeft
                  size={16}
                  className="absolute left-3.5 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 resize-none shadow-inner"
                  placeholder="Qual o objetivo principal deste projeto?..."
                />
              </div>
            </div>

            {/* SECÇÃO VISUAL: IMAGEM E COR */}
            <div className="pt-4 border-t border-[#27272A] grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* UPLOAD DE IMAGEM */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  <ImagePlus size={14} /> Logo do Projeto
                </label>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />

                {!imagePreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-16 rounded-xl border-2 border-dashed border-[#27272A] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-indigo-400 group"
                  >
                    <ImagePlus
                      size={18}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs font-medium">Fazer upload</span>
                  </button>
                ) : (
                  <div className="relative w-max group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[#27272A] shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 hover:scale-110"
                      title="Remover imagem"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* SELETOR DE COR */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  <Palette size={14} /> Cor Destaque
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        selectedColor.name === color.name
                          ? "ring-2 ring-offset-2 ring-offset-[#09090B] scale-110"
                          : "hover:scale-110 opacity-70 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: color.value,
                        ringColor: color.value,
                      }}
                      title={color.name}
                    >
                      {selectedColor.name === color.name && (
                        <div className="w-2 h-2 bg-white rounded-full opacity-80" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-5 border-t border-[#27272A] bg-[#121214] flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Criar Projeto"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
