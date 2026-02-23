import { CircleDashed, ArrowRightCircle, CheckCircle2 } from "lucide-react";

interface Props {
  status: string;
}

export function StatusIcon({ status }: Props) {
  switch (status) {
    case "todo":
      return (
        <CircleDashed size={16} className="text-zinc-500" title="A Fazer" />
      );
    case "in-progress":
      return (
        <ArrowRightCircle
          size={16}
          className="text-amber-500"
          title="Em Progresso"
        />
      );
    case "review":
      return (
        <ArrowRightCircle
          size={16}
          className="text-purple-500"
          title="Em Revisão"
        />
      );
    case "done":
      return (
        <CheckCircle2
          size={16}
          className="text-emerald-500"
          title="Concluído"
        />
      );
    default:
      return <CircleDashed size={16} className="text-zinc-500" />;
  }
}
