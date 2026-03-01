import { useEffect, useRef, useState } from "react";
import {
  X,
  AlignLeft,
  Paperclip,
  LayoutList,
  Image as ImageIcon,
  Link as LinkIcon,
  Tag,
  Trash2,
  Loader2,
  Check,
  ChevronDown,
  Plus,
  FileText,
  CheckSquare,
  GitBranch,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useGitHub } from "../../context/GitHubContext";
import { DEFAULT_TASK } from "../../constants/backlog";
import { motion, AnimatePresence } from "framer-motion";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { RichTextEditor } from "../ui/RichTextEditor";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskForm: typeof DEFAULT_TASK;
  setTaskForm: React.Dispatch<React.SetStateAction<typeof DEFAULT_TASK>>;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  editingId: string | null;
  isSaving: boolean;
  epics: any[];
  activeProject: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddLink: () => void;
  removeAttachment: (id: string) => void;
  handleAddChecklistItem: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  toggleChecklistItem: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  handleAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  removeTag: (tag: string) => void;
  isAssigneeDropdownOpen: boolean;
  setIsAssigneeDropdownOpen: (open: boolean) => void;
  onOpenEpicModal?: () => void;
}

export function TaskModal({
  isOpen,
  onClose,
  taskForm,
  setTaskForm,
  onSave,
  onDelete,
  editingId,
  isSaving,
  epics,
  activeProject,
  fileInputRef,
  handleFileUpload,
  handleAddLink,
  removeAttachment,
  handleAddChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  handleAddTag,
  removeTag,
  isAssigneeDropdownOpen,
  setIsAssigneeDropdownOpen,
  onOpenEpicModal,
}: TaskModalProps) {
  const currentChecklist = taskForm.checklist || [];
  const checklistTotal = currentChecklist.length;
  const checklistCompleted = currentChecklist.filter((i) => i.completed).length;
  const checklistProgress =
    checklistTotal === 0
      ? 0
      : Math.round((checklistCompleted / checklistTotal) * 100);

  const { branches, isLoading, fetchBranches, createBranch } = useGitHub();
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (activeProject?.githubRepo && isBranchDropdownOpen) {
      fetchBranches(activeProject.githubRepo, activeProject.githubToken);
    }
  }, [
    activeProject?.githubRepo,
    activeProject?.githubToken,
    isBranchDropdownOpen,
    fetchBranches,
  ]);

  const handleCreateBranch = async () => {
    if (!activeProject?.githubRepo || !activeProject?.githubToken) {
      alert("Por favor, configure o Token do GitHub (PAT) primeiro!");
      return;
    }
    if (!taskForm.title) {
      alert("A tarefa precisa ter um título primeiro!");
      return;
    }

    const slugTitle = taskForm.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const taskIdentifier = taskForm.key ? taskForm.key.toLowerCase() : "task";
    const newBranchName = `feature/${taskIdentifier}-${slugTitle}`;

    setIsCreatingBranch(true);
    const success = await createBranch(
      activeProject.githubRepo,
      newBranchName,
      activeProject.githubToken,
    );

    if (success) {
      setTaskForm({ ...taskForm, branch: newBranchName });
    } else {
      alert("Falha ao criar branch. Verifique permissões.");
    }
    setIsCreatingBranch(false);
  };

  const handleGenerateAISubtasks = async () => {
    if (!taskForm.title?.trim()) {
      alert("Preencha o título para a IA entender o contexto.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskForm.title,
          projectType: activeProject?.category,
        }),
      });
      const data = await res.json();
      setTaskForm((prev: any) => ({
        ...prev,
        description: data.description || prev.description,
        points: data.points || prev.points,
        checklist: [
          ...(prev.checklist || []),
          ...(data.subtasks?.map((st: string, idx: number) => ({
            id: `ai-${Date.now()}-${idx}`,
            title: st,
            completed: false,
          })) || []),
        ],
      }));
    } catch (error) {
      console.error("Erro na IA", error);
      alert("Erro ao gerar com IA.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const formatForInput = (dateVal: any) => {
    if (!dateVal) return "";
    const d = dateVal.seconds
      ? new Date(dateVal.seconds * 1000)
      : new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-bgMain border border-borderFocus w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[200px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex items-center justify-between px-6 py-4 border-b border-borderSubtle bg-bgGlass shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl">
                <LayoutList size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-textPrimary">
                  {editingId
                    ? `Editando Issue: ${editingId.slice(0, 8)}`
                    : "Criar Nova Issue"}
                </h2>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mt-0.5">
                  {activeProject?.key || "PROJ"} • Workspace
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-textMuted hover:text-textPrimary p-2 rounded-xl hover:bg-bgSurfaceHover transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={onSave}
            className="flex flex-col flex-1 overflow-hidden relative z-10"
          >
            <div className="flex flex-1 overflow-visible flex-col lg:flex-row">
              {/* === COLUNA ESQUERDA === */}
              <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar">
                <div>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    className="w-full bg-transparent text-3xl font-black text-textPrimary placeholder:text-textFaint focus:outline-none focus:ring-0"
                    placeholder="Título da tarefa..."
                  />
                </div>

                {/* Ajuste de layout aqui também */}
                <div className="space-y-3 w-full min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-bgGlass flex items-center justify-center shrink-0 border border-borderSubtle">
                      <AlignLeft size={14} className="text-textMuted" />
                    </div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-textMuted">
                      Descrição
                    </label>
                  </div>

                  <RichTextEditor
                    content={taskForm.description}
                    onChange={(content) =>
                      setTaskForm({ ...taskForm, description: content })
                    }
                    placeholder="Escreve os detalhes da tarefa aqui..."
                  />

                  {/* Botões de anexo passados para baixo do editor */}
                  <div className="bg-bgGlass border border-borderSubtle rounded-xl px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-textMuted hover:text-textPrimary hover:bg-bgSurfaceActive rounded-lg transition-colors"
                      >
                        <Paperclip size={16} />
                      </button>
                      <div className="w-px h-4 bg-borderFocus mx-1"></div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-textMuted hover:text-textPrimary hover:bg-bgSurfaceActive rounded-lg transition-colors"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="p-1.5 text-textMuted hover:text-textPrimary hover:bg-bgSurfaceActive rounded-lg transition-colors"
                      >
                        <LinkIcon size={16} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                      />
                    </div>
                  </div>
                </div>

                {taskForm.attachments && taskForm.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {taskForm.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 bg-bgSurface border border-borderSubtle px-3 py-2 rounded-xl group max-w-xs"
                      >
                        {att.type === "link" ? (
                          <LinkIcon
                            size={14}
                            className="text-blue-400 shrink-0"
                          />
                        ) : att.type === "image" ? (
                          <ImageIcon
                            size={14}
                            className="text-emerald-400 shrink-0"
                          />
                        ) : (
                          <FileText
                            size={14}
                            className="text-textMuted shrink-0"
                          />
                        )}
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-textSecondary hover:text-indigo-400 truncate flex-1"
                        >
                          {att.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="text-textFaint hover:text-red-400 transition-colors ml-1 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-borderSubtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-textSecondary uppercase tracking-widest">
                      <CheckSquare size={16} className="text-emerald-400" />{" "}
                      Subtarefas
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleGenerateAISubtasks}
                        disabled={isGeneratingAI}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                      >
                        {isGeneratingAI ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles
                            size={14}
                            className="group-hover:scale-110 transition-transform"
                          />
                        )}
                        <span>
                          {isGeneratingAI ? "Gerando..." : "Gerar com IA"}
                        </span>
                      </button>
                      {checklistTotal > 0 && (
                        <div className="flex items-center gap-2 w-24">
                          <span className="text-xs font-bold text-textMuted">
                            {checklistProgress}%
                          </span>
                          <div className="h-1.5 flex-1 bg-bgSurfaceHover rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${checklistProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 bg-bgSurface border border-borderSubtle p-4 rounded-2xl">
                    {currentChecklist.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 group px-2 py-1"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.completed ? "bg-emerald-500 border-emerald-500 text-black" : "border-borderFocus hover:border-textMuted"}`}
                        >
                          {item.completed && (
                            <Check size={12} strokeWidth={3} />
                          )}
                        </button>
                        <span
                          className={`text-sm flex-1 transition-all ${item.completed ? "text-textMuted line-through" : "text-textPrimary"}`}
                        >
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-red-400 transition-all p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 px-2 pt-2 mt-2 border-t border-borderSubtle">
                      <Plus size={16} className="text-textFaint" />
                      <input
                        type="text"
                        placeholder="Adicionar nova subtarefa... (Aperte Enter)"
                        onKeyDown={handleAddChecklistItem}
                        className="bg-transparent border-none text-sm text-textSecondary focus:ring-0 flex-1 placeholder:text-textFaint outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* === COLUNA DIREITA (Propriedades) === */}
              <div className="w-full lg:w-80 bg-bgSurface border-l border-borderSubtle p-6 overflow-visible lg:overflow-y-auto shrink-0 space-y-6 custom-scrollbar pb-24">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CalendarIcon size={12} /> Data de Entrega
                  </label>
                  <CustomDatePicker
                    value={formatForInput(taskForm.dueDate)}
                    onChange={(newDateStr) => {
                      const taskDueDate = newDateStr
                        ? new Date(`${newDateStr}T12:00:00`)
                        : null;
                      setTaskForm({ ...taskForm, dueDate: taskDueDate });
                    }}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                      Tipo
                    </label>
                    <div className="relative">
                      <select
                        value={taskForm.type}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, type: e.target.value })
                        }
                        className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-indigo-500/50 appearance-none hover:bg-bgGlassHover transition-colors"
                      >
                        <option value="feature" className="bg-bgSurface">
                          ✨ Feature
                        </option>
                        <option value="bug" className="bg-bgSurface">
                          🐛 Bug
                        </option>
                        <option value="task" className="bg-bgSurface">
                          📝 Tarefa
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                      Épico
                    </label>
                    <div className="relative">
                      <select
                        value={taskForm.epic}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, epic: e.target.value })
                        }
                        className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-indigo-500/50 appearance-none hover:bg-bgGlassHover transition-colors"
                      >
                        <option value="" className="bg-bgSurface">
                          Sem Epic
                        </option>
                        {epics.map((epic) => (
                          <option
                            key={epic.id}
                            value={epic.id}
                            className="bg-bgSurface"
                          >
                            {epic.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={taskForm.status}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, status: e.target.value })
                        }
                        className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-indigo-500/50 appearance-none hover:bg-bgGlassHover transition-colors"
                      >
                        <option value="todo" className="bg-bgSurface">
                          A Fazer
                        </option>
                        <option value="in-progress" className="bg-bgSurface">
                          Em Progresso
                        </option>
                        <option value="review" className="bg-bgSurface">
                          Em Revisão
                        </option>
                        <option value="done" className="bg-bgSurface">
                          Concluído
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                      Prioridade
                    </label>
                    <div className="relative">
                      <select
                        value={taskForm.priority}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, priority: e.target.value })
                        }
                        className={`w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-500/50 appearance-none hover:bg-bgGlassHover transition-colors ${taskForm.priority === "urgent" ? "text-red-500" : ""} ${taskForm.priority === "high" ? "text-rose-400" : ""} ${taskForm.priority === "medium" ? "text-amber-400" : ""} ${taskForm.priority === "low" ? "text-emerald-400" : ""}`}
                      >
                        <option
                          value="low"
                          className="bg-bgSurface text-emerald-400"
                        >
                          Baixa
                        </option>
                        <option
                          value="medium"
                          className="bg-bgSurface text-amber-400"
                        >
                          Normal
                        </option>
                        <option
                          value="high"
                          className="bg-bgSurface text-rose-400"
                        >
                          Alta
                        </option>
                        <option
                          value="urgent"
                          className="bg-bgSurface text-red-500"
                        >
                          Urgente
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    Responsável
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)
                    }
                    className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 flex items-center justify-between hover:bg-bgGlassHover transition-colors"
                  >
                    <span className="text-sm text-textPrimary">
                      {taskForm.assignee || "Não atribuído"}
                    </span>
                    <ChevronDown size={14} className="text-textMuted" />
                  </button>
                  {isAssigneeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bgPanel border border-borderFocus rounded-xl shadow-2xl z-50 p-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setTaskForm({ ...taskForm, assignee: "" });
                          setIsAssigneeDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-textSecondary hover:bg-bgSurfaceHover hover:text-textPrimary"
                      >
                        Não atribuído
                      </button>
                      {activeProject?.members?.map((member: any) => (
                        <button
                          key={member.email || member.name}
                          type="button"
                          onClick={() => {
                            setTaskForm({ ...taskForm, assignee: member.name });
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${taskForm.assignee === member.name ? "bg-indigo-500/10 text-indigo-400" : "text-textSecondary hover:bg-bgSurfaceHover hover:text-textPrimary"}`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                member.photoURL ||
                                `https://ui-avatars.com/api/?name=${member.name}`
                              }
                              className="w-5 h-5 rounded-full"
                              alt=""
                            />
                            {member.name}
                          </div>
                          {taskForm.assignee === member.name && (
                            <Check size={14} className="text-indigo-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    Pontos (Story Points)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={taskForm.points || ""}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        points: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-indigo-500/50 hover:bg-bgGlassHover transition-colors"
                    placeholder="Ex: 3"
                  />
                </div>

                <div>
                  <label className="flex justify-between items-center text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    <span>GitHub Branch</span>
                    {activeProject?.githubRepo && (
                      <button
                        type="button"
                        onClick={handleCreateBranch}
                        disabled={isCreatingBranch}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Criar branch"
                      >
                        {isCreatingBranch ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Plus size={10} strokeWidth={3} />
                        )}{" "}
                        Criar Branch
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsBranchDropdownOpen(!isBranchDropdownOpen)
                      }
                      className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 flex items-center justify-between hover:bg-bgGlassHover transition-colors group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <GitBranch
                          size={14}
                          className={
                            taskForm.branch
                              ? "text-indigo-400"
                              : "text-textMuted"
                          }
                        />
                        <span className="text-sm text-textPrimary truncate">
                          {taskForm.branch || "Nenhuma branch"}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className="text-textMuted group-hover:text-textPrimary"
                      />
                    </button>
                    {isBranchDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-bgPanel border border-borderFocus rounded-xl shadow-2xl z-50 p-2 max-h-40 overflow-y-auto custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            setTaskForm({ ...taskForm, branch: "" });
                            setIsBranchDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-textSecondary hover:bg-bgSurfaceHover hover:text-textPrimary"
                        >
                          Nenhuma branch
                        </button>
                        {isLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2
                              size={16}
                              className="animate-spin text-indigo-400"
                            />
                          </div>
                        ) : (
                          branches.map((b) => (
                            <button
                              key={b.name}
                              type="button"
                              onClick={() => {
                                setTaskForm({ ...taskForm, branch: b.name });
                                setIsBranchDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${taskForm.branch === b.name ? "bg-indigo-500/10 text-indigo-400" : "text-textSecondary hover:bg-bgSurfaceHover hover:text-textPrimary"}`}
                            >
                              <span className="truncate">{b.name}</span>
                              {taskForm.branch === b.name && (
                                <Check
                                  size={14}
                                  className="text-indigo-400 shrink-0"
                                />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    Tags
                  </label>
                  <div className="bg-bgGlass border border-borderSubtle rounded-xl p-2 min-h-[46px] flex flex-wrap gap-2 focus-within:border-indigo-500/50 transition-colors">
                    {taskForm.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 bg-bgSurfaceActive text-textSecondary px-2 py-1 rounded-md text-xs border border-borderGlass"
                      >
                        <Tag size={10} className="text-indigo-400" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-400 ml-1"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Nova tag..."
                      onKeyDown={handleAddTag}
                      className="bg-transparent border-none text-sm text-textPrimary focus:ring-0 flex-1 min-w-[80px] outline-none placeholder:text-textFaint"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-borderSubtle bg-bgGlass shrink-0 z-20">
              {editingId ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-2 text-textMuted hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all text-sm font-bold"
                >
                  <Trash2 size={16} /> Excluir
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-bold text-textMuted hover:text-textPrimary hover:bg-bgSurfaceHover rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="group relative flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  {isSaving && (
                    <Loader2 size={16} className="animate-spin text-white" />
                  )}
                  <span>{editingId ? "Salvar" : "Criar Issue"}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
