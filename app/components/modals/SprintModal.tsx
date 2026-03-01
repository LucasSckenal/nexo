import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Calendar, AlertCircle, Clock, X, Info } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, duration: number) => void;
  activeSprint: any | null;
}

export function SprintModal({
  isOpen,
  onClose,
  onCreate,
  activeSprint,
}: Props) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(14);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDuration(14);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name, duration);
    onClose();
  };

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-lg bg-bgPanel border border-borderSubtle rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent" />

            <div className="px-8 py-6 border-b border-borderSubtle bg-bgGlass flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                  <Rocket size={14} className="animate-pulse" />
                  <span>Iteração de Trabalho</span>
                </div>
                <h2 className="text-2xl font-black text-textPrimary tracking-tighter">
                  Criar Sprint
                </h2>
                <p className="text-[11px] text-textMuted font-medium mt-1">
                  Defina o nome, a duração e comece a organizar o trabalho.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bgGlass hover:bg-bgGlassHover border border-borderSubtle text-textMuted hover:text-textPrimary transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <AnimatePresence>
                {activeSprint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex gap-4 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl overflow-hidden"
                  >
                    <AlertCircle
                      size={18}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <div className="text-[12px] text-amber-600 dark:text-amber-500/90 leading-relaxed font-medium">
                      Existe uma sprint ativa:{" "}
                      <strong className="text-amber-500 dark:text-amber-400">
                        {activeSprint.name}
                      </strong>
                      . Ela será finalizada automaticamente ao criar uma nova.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-textMuted uppercase tracking-widest pl-1">
                  Nome da Sprint
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sprint 12 - Autenticação"
                  className="w-full bg-bgGlassHover border border-borderFocus rounded-xl px-4 py-3.5 text-[13px] text-textPrimary focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-textFaint font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-textMuted uppercase tracking-widest pl-1">
                  Duração
                </label>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  {[7, 14, 21].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDuration(days)}
                      className={`py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                        duration === days
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                          : "bg-bgGlass border-borderSubtle text-textMuted hover:bg-bgGlassHover hover:text-textSecondary"
                      }`}
                    >
                      {days} Dias
                    </button>
                  ))}
                </div>

                <div className="relative group">
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-bgGlassHover border border-borderFocus rounded-xl px-4 py-3.5 text-[13px] text-textPrimary focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-textFaint uppercase tracking-widest pointer-events-none">
                    Dias
                  </div>
                </div>
              </div>

              <div className="bg-bgSurface border border-borderSubtle rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-textMuted uppercase tracking-widest border-b border-borderSubtle pb-3">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} /> Início
                  </span>
                  <span className="text-textSecondary">
                    {new Date().toLocaleDateString("pt-PT")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-textMuted uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <Clock size={14} /> Fim Previsto
                  </span>
                  <span className="text-indigo-500 dark:text-indigo-400">
                    {endDate.toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-borderSubtle bg-bgGlass flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-textMuted hover:text-textPrimary hover:bg-bgGlassHover transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-40 disabled:hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2"
              >
                Criar Sprint <Rocket size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}