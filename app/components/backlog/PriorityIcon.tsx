import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

interface Props {
  priority: string;
}

export function PriorityIcon({ priority }: Props) {
  switch (priority) {
    case "low":
      return (
        <span title="Prioridade Baixa" className="inline-flex">
          <ArrowDown size={14} className="text-zinc-500" />
        </span>
      );
    case "medium":
      return (
        <span title="Prioridade Média" className="inline-flex">
          <ArrowRight size={14} className="text-zinc-400" />
        </span>
      );
    case "high":
      return (
        <span title="Prioridade Alta" className="inline-flex">
          <ArrowUp size={14} className="text-amber-500" />
        </span>
      );
    case "critical":
      return (
        <span title="Crítica" className="bg-red-500/10 text-red-500 p-0.5 rounded inline-flex">
          <ArrowUp size={14} />
        </span>
      );
    default:
      return <ArrowRight size={14} className="text-zinc-500" />;
  }
}
