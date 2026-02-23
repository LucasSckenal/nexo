import { IssueRow } from "./IssueRow";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  issues: any[];
  epics: any[];
  onIssueClick: (issue: any) => void;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    issue: any,
    source: "backlog",
  ) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function BacklogSection({
  isOpen,
  onToggle,
  issues,
  epics,
  onIssueClick,
  onDragStart,
  onDragEnd,
  onDrop,
}: Props) {
  return (
    <div>
      <div
        onClick={onToggle}
        className="flex items-center justify-between bg-[#121214] border border-[#27272A] p-4 rounded-t-xl cursor-pointer hover:bg-[#1A1A1E]"
      >
        <h2 className="text-sm font-semibold text-white">Backlog de Produto</h2>
        <span className="text-xs text-zinc-500">{issues.length} issues</span>
      </div>

      {isOpen && (
        <div
          className="border-x border-b border-[#27272A] rounded-b-xl bg-[#0D0D0F] min-h-[80px] max-h-[45vh] overflow-y-auto transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          {issues.length > 0 ? (
            issues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                epics={epics}
                onClick={() => onIssueClick(issue)}
                onDragStart={(e) => onDragStart(e, issue, "backlog")}
                onDragEnd={onDragEnd}
              />
            ))
          ) : (
            <div className="p-6 text-center text-sm text-zinc-600">
              Backlog vazio
            </div>
          )}
        </div>
      )}
    </div>
  );
}
