import { Bug, Sparkles, FileText } from "lucide-react";

interface Props {
  type: string;
}

export function TypeIcon({ type }: Props) {
  switch (type) {
    case "bug":
      return (
        <div className="text-red-400 bg-red-400/10 p-1 rounded" title="Bug">
          <Bug size={12} />
        </div>
      );
    case "feature":
      return (
        <div
          className="text-emerald-400 bg-emerald-400/10 p-1 rounded"
          title="Feature"
        >
          <Sparkles size={12} />
        </div>
      );
    case "task":
      return (
        <div className="text-blue-400 bg-blue-400/10 p-1 rounded" title="Task">
          <FileText size={12} />
        </div>
      );
    default:
      return (
        <div className="text-zinc-400 bg-zinc-400/10 p-1 rounded">
          <FileText size={12} />
        </div>
      );
  }
}
