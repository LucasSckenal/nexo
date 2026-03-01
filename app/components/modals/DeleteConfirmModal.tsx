"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemTitle?: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemTitle,
  isLoading,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Overlay de fecho */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-bgPanel border border-red-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center"
          >
            {/* Efeito de Brilho Vermelho no fundo */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Ícone de Alerta Animado */}
            <div className="relative mx-auto w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-8 border border-red-500/20">
              <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-3xl" />
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-3 mb-10">
              <h3 className="text-2xl font-black text-textPrimary tracking-tighter">
                {title}
              </h3>
              <p className="text-textMuted text-sm font-medium leading-relaxed">
                Estás prestes a excluir{" "}
                <span className="text-textPrimary font-bold">"{itemTitle}"</span>.
                Esta ação é irreversível e todos os dados associados serão
                perdidos.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={isLoading}
                onClick={onConfirm}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                )}
                Confirmar Exclusão
              </button>

              <button
                disabled={isLoading}
                onClick={onClose}
                className="w-full bg-bgSurfaceHover hover:bg-bgSurfaceActive text-textSecondary hover:text-textPrimary py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}