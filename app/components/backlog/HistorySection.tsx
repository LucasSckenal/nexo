interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate?: { seconds: number };
  endDate?: { seconds: number };
}

interface Props {
  show: boolean;
  completedSprints: Sprint[];
  onToggle: () => void;
}

export function HistorySection({ show, completedSprints, onToggle }: Props) {
  if (!show) return null;

  return (
    <div className="mb-8 border border-[#27272A] rounded-xl bg-[#0D0D0F] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#27272A] bg-[#121214] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Histórico de Sprints
        </h3>
        <span className="text-xs text-zinc-500">
          {completedSprints.length} finalizadas
        </span>
      </div>

      {completedSprints.length === 0 ? (
        <div className="p-6 text-center text-sm text-zinc-600">
          Nenhuma sprint finalizada ainda.
        </div>
      ) : (
        <div className="divide-y divide-[#27272A]">
          {completedSprints.map((sprint) => {
            const start = sprint.startDate?.seconds
              ? new Date(sprint.startDate.seconds * 1000).toLocaleDateString(
                  "pt-PT",
                )
              : "-";
            const end = sprint.endDate?.seconds
              ? new Date(sprint.endDate.seconds * 1000).toLocaleDateString(
                  "pt-PT",
                )
              : "-";

            return (
              <div
                key={sprint.id}
                className="px-4 py-4 flex items-center justify-between hover:bg-[#121214] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {sprint.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {start} → {end}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Finalizada
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
