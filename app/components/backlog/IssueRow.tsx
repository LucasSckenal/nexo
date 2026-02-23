import {
  GripVertical,
  CheckSquare,
  Paperclip,
  MessageSquare,
  CalendarClock,
  GitBranch,
} from "lucide-react";
import { TypeIcon } from "./TypeIcon";
import { StatusIcon } from "./StatusIcon";
import { PriorityIcon } from "./PriorityIcon";
import { useData } from "../../context/DataContext"; 

interface Issue {
  branch: import("react/jsx-runtime").JSX.Element;
  id: string;
  key?: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  points: number;
  epicId?: string;
  epic?: string;
  assignee?: string;
  assigneePhoto?: string;
  tags?: string[];
  attachments?: any[];
  comments?: number;
  updatedAt?: string;
  checklist?: { id: string; completed: boolean }[];
}

interface Epic {
  id: string;
  name: string;
  color: string;
}

interface Props {
  issue: Issue;
  epics: Epic[];
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function IssueRow({
  issue,
  epics,
  onClick,
  onDragStart,
  onDragEnd,
}: Props) {
  const hasChecklist = issue.checklist && issue.checklist.length > 0;
  const epicData =
    epics?.find((e) => e.id === issue.epicId) ||
    epics?.find((e) => e.name === issue.epic);
  const checklistCompleted = hasChecklist
    ? issue.checklist!.filter((i) => i.completed).length
    : 0;
  const checklistTotal = hasChecklist ? issue.checklist!.length : 0;
  const isChecklistDone = hasChecklist && checklistCompleted === checklistTotal;
  const { activeProject } = useData();

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 border-b border-[#27272A] cursor-grab active:cursor-grabbing hover:bg-[#1A1A1E] transition-colors"
    >
      <div
        className="cursor-grab active:cursor-grabbing p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical
          size={14}
          className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 w-16 shrink-0">
        <TypeIcon type={issue.type} />
        <StatusIcon status={issue.status} />
      </div>

      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-zinc-500">
            {issue.taskKey || issue.key || issue.id.slice(0, 8)}
          </span>
          {epicData ? (
            <span
              className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider truncate max-w-[120px]"
              style={{
                backgroundColor: epicData.color + "20",
                color: epicData.color,
                border: `1px solid ${epicData.color}40`,
              }}
            >
              {epicData.name}
            </span>
          ) : (
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#27272A] text-zinc-500 border border-[#3F3F46]">
              Geral
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
          {issue.title}
        </span>

        {hasChecklist && (
          <span
            className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
              isChecklistDone
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-[#121214] text-zinc-400 border-[#27272A]"
            }`}
          >
            <CheckSquare size={10} />
            {checklistCompleted}/{checklistTotal}
          </span>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-1.5 shrink-0 max-w-[150px] overflow-hidden">
        {issue.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1A1E] text-zinc-400 border border-[#27272A]"
          >
            {tag}
          </span>
        ))}
        {issue.tags?.length > 2 && (
          <span className="text-[10px] text-zinc-500">
            +{issue.tags.length - 2}
          </span>
        )}
      </div>

      <div className="hidden lg:flex items-center justify-center gap-1 w-12 shrink-0 text-zinc-500">
        {issue.attachments?.length > 0 && (
          <div title={`${issue.attachments.length} anexo(s)`}>
            <Paperclip size={12} />
          </div>
        )}
      </div>
      {issue.branch && (
        <a
          href={`https://github.com/${activeProject?.githubRepo}/tree/${issue.branch}`}
          target="_blank"
          onClick={(e) => e.stopPropagation()} // Impede de abrir o modal da task ao clicar no link
          className="flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/20 ml-2 shrink-0 hover:bg-indigo-400/20 transition-all"
        >
          <GitBranch size={10} />
          <span className="max-w-[80px] truncate">{issue.branch}</span>
        </a>
      )}

      <div className="hidden lg:flex items-center justify-center gap-1 w-12 shrink-0 text-zinc-500">
        <MessageSquare size={14} />
        <span className="text-xs font-medium">{issue.comments || 0}</span>
      </div>

      <div className="hidden lg:flex items-center justify-center gap-1.5 w-20 shrink-0 text-zinc-500">
        <CalendarClock size={13} />
        <span className="text-[10px] font-medium truncate">
          {issue.updatedAt || "Recente"}
        </span>
      </div>

      <div className="w-12 flex justify-center shrink-0">
        <PriorityIcon priority={issue.priority} />
      </div>

      <div className="w-12 flex justify-center shrink-0">
        <span
          className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full border ${
            issue.status === "done"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-[#121214] text-zinc-400 border-[#27272A]"
          }`}
        >
          {issue.points || 0}
        </span>
      </div>

      <div className="w-12 flex justify-center shrink-0">
        <img
          src={
            issue.assigneePhoto ||
            `https://ui-avatars.com/api/?name=${issue.assignee || "Unassigned"}&background=27272A&color=fff`
          }
          alt="Assignee"
          title={issue.assignee || "Sem Responsável"}
          className="w-6 h-6 rounded-full border border-[#27272A] object-cover"
        />
      </div>
    </div>
  );
}
