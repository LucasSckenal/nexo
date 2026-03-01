"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; 
import { Briefcase, X, Plus, Loader2, Image as ImageIcon } from "lucide-react";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit: any | null;
  projectId: string;
  currentClients: any[];
}

export function ClientModal({
  isOpen,
  onClose,
  clientToEdit,
  projectId,
  currentClients,
}: ClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Formulário
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [clientStatus, setClientStatus] = useState<
    "lead" | "ativo" | "inativo"
  >("ativo");
  const [clientNotes, setClientNotes] = useState("");
  const [clientLogo, setClientLogo] = useState<string | null>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setClientName(clientToEdit.name || "");
        setClientEmail(clientToEdit.email || "");
        setClientPhone(clientToEdit.phone || "");
        setClientWebsite(clientToEdit.website || "");
        setClientStatus(clientToEdit.status || "ativo");
        setClientNotes(clientToEdit.notes || "");
        setClientLogo(
          clientToEdit.logoUrl?.includes("ui-avatars")
            ? null
            : clientToEdit.logoUrl,
        );
      } else {
        setClientName("");
        setClientEmail("");
        setClientPhone("");
        setClientWebsite("");
        setClientStatus("ativo");
        setClientNotes("");
        setClientLogo(null);
      }
    }
  }, [isOpen, clientToEdit]);

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
      setClientLogo(reader.result as string);
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !projectId) return;

    setIsLoading(true);
    try {
      const logoUrl =
        clientLogo ||
        `https://ui-avatars.com/api/?name=${clientName.trim()}&background=121214&color=A855F7`;

      let updatedClients;

      if (clientToEdit) {
        updatedClients = currentClients.map((c: any) =>
          c.id === clientToEdit.id
            ? {
                ...c,
                name: clientName.trim(),
                email: clientEmail.trim(),
                phone: clientPhone.trim(),
                website: clientWebsite.trim(),
                status: clientStatus,
                notes: clientNotes.trim(),
                logoUrl,
              }
            : c,
        );
      } else {
        const newClient = {
          id: `client-${Date.now()}`,
          name: clientName.trim(),
          email: clientEmail.trim(),
          phone: clientPhone.trim(),
          website: clientWebsite.trim(),
          status: clientStatus,
          notes: clientNotes.trim(),
          logoUrl: logoUrl,
          addedAt: new Date().toISOString(),
        };
        updatedClients = [...currentClients, newClient];
      }

      await updateDoc(doc(db, "projects", projectId), {
        clients: updatedClients,
      });

      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Ocorreu um erro ao salvar o cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-bgPanel border border-borderFocus rounded-[2.5rem] w-full max-w-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden relative max-h-[90vh] flex flex-col"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="p-8 border-b border-borderSubtle relative shrink-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
                    <Briefcase size={14} />
                    <span>Base de Dados</span>
                  </div>
                  <h2 className="text-2xl font-black text-textPrimary tracking-tight">
                    {clientToEdit ? "Editar Cliente" : "Adicionar Cliente"}
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
              onSubmit={handleSaveClient}
              className="p-8 space-y-6 relative overflow-y-auto custom-scrollbar flex-1"
            >
              <div className="flex items-center gap-5 p-4 bg-bgGlass border border-borderSubtle rounded-[1.5rem] mb-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*"
                />
                <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner relative overflow-hidden border border-borderFocus bg-bgSurface">
                  {isUploadingLogo ? (
                    <Loader2 size={20} className="animate-spin text-textMuted" />
                  ) : clientLogo ? (
                    <img
                      src={clientLogo}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Briefcase size={24} className="text-textFaint" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[11px] font-bold text-textPrimary mb-0.5">
                    Identidade Visual
                  </h3>
                  <p className="text-[10px] text-textMuted mb-2">
                    Formato quadrado. Máximo 2MB.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                    >
                      <ImageIcon size={12} /> Fazer Upload
                    </button>
                    {clientLogo && (
                      <button
                        type="button"
                        onClick={() => setClientLogo(null)}
                        className="text-[10px] text-textMuted hover:text-red-400 transition-colors px-2"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                    Nome da Empresa / Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Acme Corp"
                    className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-textFaint"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                    Status
                  </label>
                  <select
                    value={clientStatus}
                    onChange={(e: any) => setClientStatus(e.target.value)}
                    className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-4 py-4 text-sm focus:border-purple-500/50 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="ativo" className="bg-bgPanel">
                      Ativo
                    </option>
                    <option value="lead" className="bg-bgPanel">
                      Lead (Potencial)
                    </option>
                    <option value="inativo" className="bg-bgPanel">
                      Inativo
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="contato@acme.com"
                    className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-textFaint"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                    Telefone / Celular
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-textFaint"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                  Website ou Portfólio
                </label>
                <input
                  type="text"
                  value={clientWebsite}
                  onChange={(e) => setClientWebsite(e.target.value)}
                  placeholder="www.acme.com"
                  className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-textFaint"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest ml-1">
                  Observações e Detalhes
                </label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Indique aqui detalhes do projeto, necessidades do cliente, orçamentos, etc."
                  rows={3}
                  className="w-full bg-bgGlassHover border border-borderFocus text-textPrimary rounded-2xl px-5 py-4 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-textFaint resize-none custom-scrollbar"
                />
              </div>
            </form>

            <div className="p-8 border-t border-borderSubtle flex items-center justify-between shrink-0 bg-bgPanel">
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textPrimary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_10px_20px_rgba(168,85,247,0.2)] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} strokeWidth={3} />
                )}{" "}
                Salvar Cliente
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}