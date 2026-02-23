import { useState } from "react";
import { IssueRow } from "./IssueRow";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  sprint: any; // tipar adequadamente
  issues: any[];
  epics: any[];
  onIssueClick: (issue: any) => void;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    issue: any,
    source: "sprint",
  ) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  getSprintCountdown: (endDate: any) => string;
}

export function SprintSection({
  isOpen,
  onToggle,
  sprint,
  issues,
  epics,
  onIssueClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getSprintCountdown,
}: Props) {
  const totalPoints = issues.reduce(
    (acc, issue) => acc + (Number(issue.points) || 0),
    0,
  );
  const donePoints = issues
    .filter((i) => i.status === "done")
    .reduce((acc, issue) => acc + (Number(issue.points) || 0), 0);
  const progress =
    totalPoints === 0 ? 0 : Math.round((donePoints / totalPoints) * 100);

  return (
    <div className="mb-8">
      <div
        onClick={onToggle}
        className="bg-[#121214] border border-[#27272A] rounded-t-xl overflow-hidden cursor-pointer hover:bg-[#1A1A1E] transition-colors"
      >
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {sprint ? sprint.name : "Sem Sprint Ativa"}
            </h2>
            {sprint && (
              <p className="text-xs text-indigo-400 mt-1">
                {getSprintCountdown(sprint.endDate)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>{issues.length} issues</span>
            <span className="bg-[#1A1A1E] px-2 py-1 rounded border border-[#27272A] text-zinc-200">
              {donePoints} / {totalPoints} pts
            </span>
          </div>
        </div>
        <div className="w-full h-1 bg-[#1A1A1E]">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
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
                onDragStart={(e) => onDragStart(e, issue, "sprint")}
                onDragEnd={onDragEnd}
              />
            ))
          ) : (
            <div className="p-6 text-center text-sm text-zinc-600">
              Arraste tarefas para a Sprint
            </div>
          )}
        </div>
      )}
    </div>
  );
}
