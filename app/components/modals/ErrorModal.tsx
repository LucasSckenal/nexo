"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, RefreshCcw } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorModal({
  isOpen,
  onClose,
  title = "Algo correu mal",
  message,
  onRetry,
}: ErrorModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Overlay para fechar ao clicar fora */}
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
            className="relative w-full max-w-md bg-[#0A0A0C] border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            {/* Brilho Vermelho de Fundo */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10">
              {/* Ícone de Erro Animado */}
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                <AlertCircle size={32} />
              </div>

              <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                {title}
              </h3>
              
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex flex-col w-full gap-3">
                {onRetry && (
                  <button
                    onClick={() => {
                      onRetry();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                  >
                    <RefreshCcw size={14} />
                    Tentar Novamente
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </button>
        </div>
      )}
    </AnimatePresence>
  );
}