import { CircleDashed, ArrowRightCircle, CheckCircle2 } from "lucide-react";

interface Props {
  status: string;
}

export function StatusIcon({ status }: Props) {
  switch (status) {
    case "todo":
      return (
        <span title="A Fazer" className="inline-flex">
          <CircleDashed size={16} className="text-zinc-500" />
        </span>
      );
    case "in-progress":
      return (
        <span title="Em Progresso" className="inline-flex">
          <ArrowRightCircle size={16} className="text-amber-500" />
        </span>
      );
    case "review":
      return (
        <span title="Em Revisão" className="inline-flex">
          <ArrowRightCircle size={16} className="text-purple-500" />
        </span>
      );
    case "done":
      return (
        <span title="Concluído" className="inline-flex">
          <CheckCircle2 size={16} className="text-emerald-500" />
        </span>
      );
    default:
      return <CircleDashed size={16} className="text-zinc-500" />;
  }
}
