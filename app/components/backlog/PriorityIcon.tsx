import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

interface Props {
  priority: string;
}

export function PriorityIcon({ priority }: Props) {
  switch (priority) {
    case "low":
      return (
        <ArrowDown
          size={14}
          className="text-zinc-500"
          title="Prioridade Baixa"
        />
      );
    case "medium":
      return (
        <ArrowRight
          size={14}
          className="text-zinc-400"
          title="Prioridade Média"
        />
      );
    case "high":
      return (
        <ArrowUp size={14} className="text-amber-500" title="Prioridade Alta" />
      );
    case "critical":
      return (
        <div className="bg-red-500/10 text-red-500 p-0.5 rounded">
          <ArrowUp size={14} title="Crítica" />
        </div>
      );
    default:
      return <ArrowRight size={14} className="text-zinc-500" />;
  }
}
