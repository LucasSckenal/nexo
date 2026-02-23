import { useState } from "react";

const epicColors = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

export function EpicModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(epicColors[0]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name, color);
    setName("");
    setColor(epicColors[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
        <div>
          <h2 className="text-white font-semibold text-lg">Criar Novo Epic</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Epics organizam grandes funcionalidades do projeto.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
            Nome do Epic
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Sistema de Pagamentos"
            className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
            Cor do Epic
          </label>
          <div className="grid grid-cols-5 gap-3">
            {epicColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-xl transition-all border-2 ${
                  color === c
                    ? "scale-110 border-white"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {name && (
          <div className="pt-2">
            <span
              className="inline-flex px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: color + "20",
                color: color,
                border: `1px solid ${color}40`,
              }}
            >
              Preview: {name}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[#27272A]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
          >
            Criar Epic
          </button>
        </div>
      </div>
    </div>
  );
}
