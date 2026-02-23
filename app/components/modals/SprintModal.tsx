import { useState } from "react";

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

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name, duration);
    setName("");
    setDuration(14);
    onClose();
  };

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0D0D0F] border border-[#27272A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[#27272A] bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
          <h2 className="text-lg font-semibold text-white">
            🚀 Criar Nova Sprint
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Defina nome, duração e comece a organizar o trabalho.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {activeSprint && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-lg">
              Existe uma sprint ativa: <strong>{activeSprint.name}</strong>. Ela
              será finalizada automaticamente ao criar uma nova.
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider">
              Nome da Sprint
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sprint 12 - Autenticação"
              className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider">
              Duração
            </label>
            <div className="flex gap-2 mb-3">
              {[7, 14, 21].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDuration(days)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    duration === days
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                      : "bg-[#1A1A1E] border-[#27272A] text-zinc-400 hover:bg-[#27272A] hover:text-white"
                  }`}
                >
                  {days} dias
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Início:</span>
              <span>{new Date().toLocaleDateString("pt-PT")}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Fim previsto:</span>
              <span className="text-indigo-400 font-medium">
                {endDate.toLocaleDateString("pt-PT")}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#27272A] bg-[#09090B] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-40"
          >
            Criar Sprint
          </button>
        </div>
      </div>
    </div>
  );
}
