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
  Sparkles, // Ícone da IA
} from "lucide-react";
import { useGitHub } from "../../context/GitHubContext";
import { DEFAULT_TASK } from "../../constants/backlog";
import { motion, AnimatePresence } from "framer-motion";

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
  // === LÓGICA DO PROGRESSO DA CHECKLIST ===
  const currentChecklist = taskForm.checklist || [];
  const checklistTotal = currentChecklist.length;
  const checklistCompleted = currentChecklist.filter((i) => i.completed).length;
  const checklistProgress =
    checklistTotal === 0
      ? 0
      : Math.round((checklistCompleted / checklistTotal) * 100);

  // === LÓGICA DO GITHUB ===
  const { branches, isLoading, fetchBranches, createBranch } = useGitHub();
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  // === LÓGICA DA IA ===
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
      alert(
        "Por favor, configure o Token do GitHub (PAT) na página de Repositórios primeiro!",
      );
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
      alert(
        "Falha ao criar branch. Verifique se o seu token tem permissões de 'repo' e se não expirou.",
      );
    }
    setIsCreatingBranch(false);
  };

  // === FUNÇÃO PARA GERAR SUB-TAREFAS COM IA ===
  const handleGenerateAISubtasks = async () => {
    if (!taskForm.title?.trim()) {
      alert(
        "Por favor, preencha o título da tarefa para a IA entender o contexto.",
      );
      return;
    }

    const projectType =
      activeProject?.category?.toLowerCase() === "design" ? "design" : "software_development";

    setIsGeneratingAI(true);

    try {
      const res = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskForm.title,
          projectType: projectType, 
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
      alert("Erro ao gerar com IA. Verifique o console ou a sua chave da API.");
    } finally {
      setIsGeneratingAI(false);
    }
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
          {/* Brilho decorativo no topo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[200px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* HEADER DO MODAL */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-borderSubtle bg-bgGlass shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl">
                <LayoutList size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-textPrimary">
                  {editingId
                    ? `A Editar Issue: ${editingId.slice(0, 8)}`
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
            <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
              {/* === COLUNA ESQUERDA (Conteúdo Principal) === */}
              <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Título */}
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

                {/* Descrição e Anexos (Estilo Editor) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-textSecondary uppercase tracking-widest">
                    <AlignLeft size={16} className="text-indigo-400" />{" "}
                    Descrição
                  </div>

                  <div className="border border-borderSubtle bg-bgSurface rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-colors flex flex-col">
                    <textarea
                      value={taskForm.description}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Adicione o contexto, referências técnicas..."
                      className="w-full bg-transparent px-4 py-4 text-sm text-textSecondary focus:outline-none resize-y min-h-[200px] placeholder:text-textFaint custom-scrollbar"
                    />

                    {/* Toolbar de Anexos Embutida */}
                    <div className="bg-bgGlass border-t border-borderSubtle px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 text-textMuted hover:text-textPrimary hover:bg-bgSurfaceActive rounded-lg transition-colors"
                          title="Anexar Arquivo"
                        >
                          <Paperclip size={16} />
                        </button>
                        <div className="w-px h-4 bg-borderFocus mx-1"></div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 text-textMuted hover:text-textPrimary hover:bg-bgSurfaceActive rounded-lg transition-colors"
                          title="Anexar Imagem"
                        >
                          <ImageIcon size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="p-1.5 text-textMuted hover:text-textPrimary hover:bg-bgSurfaceActive rounded-lg transition-colors"
                          title="Adicionar Link"
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

                  {/* Fila de Anexos Adicionados */}
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
                </div>

                {/* Checklist e Botão IA */}
                <div className="space-y-4 pt-4 border-t border-borderSubtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-textSecondary uppercase tracking-widest">
                      <CheckSquare size={16} className="text-emerald-400" />{" "}
                      Subtarefas
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Botão de IA */}
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
                          {isGeneratingAI ? "A gerar..." : "Gerar com IA"}
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
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            item.completed
                              ? "bg-emerald-500 border-emerald-500 text-black"
                              : "border-borderFocus hover:border-textMuted"
                          }`}
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
                        placeholder="Adicionar nova subtarefa... (Prima Enter)"
                        onKeyDown={handleAddChecklistItem}
                        className="bg-transparent border-none text-sm text-textSecondary focus:ring-0 flex-1 placeholder:text-textFaint outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* === COLUNA DIREITA (Propriedades) === */}
              <div className="w-full lg:w-80 bg-bgSurface border-l border-borderSubtle p-6 overflow-y-auto shrink-0 space-y-6 custom-scrollbar">
                {/* Tipo e Epic */}
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
                    {onOpenEpicModal && (
                      <button
                        type="button"
                        onClick={onOpenEpicModal}
                        className="text-[10px] font-bold text-indigo-400 mt-2 hover:text-indigo-300 transition-colors"
                      >
                        + NOVO ÉPICO
                      </button>
                    )}
                  </div>
                </div>

                {/* Destino */}
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    Destino
                  </label>
                  <div className="relative">
                    <select
                      value={taskForm.target}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, target: e.target.value })
                      }
                      className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-indigo-500/50 appearance-none hover:bg-bgGlassHover transition-colors"
                    >
                      <option value="backlog" className="bg-bgSurface">
                        📦 Backlog
                      </option>
                      <option value="sprint" className="bg-bgSurface">
                        🚀 Sprint Atual
                      </option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none"
                    />
                  </div>
                </div>

                {/* Responsável (Custom Dropdown) */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    Responsável
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)
                    }
                    className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm text-textPrimary hover:bg-bgGlassHover focus:border-indigo-500/50 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {taskForm.assignee ? (
                        <>
                          <img
                            src={
                              taskForm.assigneePhoto ||
                              `https://ui-avatars.com/api/?name=${taskForm.assignee}&background=1A1A1E&color=fff`
                            }
                            className="w-5 h-5 rounded-full object-cover"
                            alt="Avatar"
                          />
                          <span className="truncate">{taskForm.assignee}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full border border-dashed border-textMuted flex items-center justify-center shrink-0">
                            <X size={10} className="text-textMuted" />
                          </div>
                          <span className="text-textMuted">Não atribuído</span>
                        </>
                      )}
                    </div>
                    <ChevronDown size={14} className="text-textMuted shrink-0" />
                  </button>

                  <AnimatePresence>
                    {isAssigneeDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-bgPanel border border-borderFocus rounded-xl shadow-2xl overflow-hidden py-1 max-h-48 overflow-y-auto custom-scrollbar"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setTaskForm({
                              ...taskForm,
                              assignee: "",
                              assigneePhoto: "",
                            });
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-textMuted hover:bg-bgSurfaceHover transition-colors text-left"
                        >
                          <div className="w-5 h-5 rounded-full border border-dashed border-textMuted flex items-center justify-center shrink-0">
                            <X size={10} />
                          </div>
                          <span className="truncate">Sem Responsável</span>
                        </button>
                        {activeProject?.members &&
                        activeProject.members.length > 0
                          ? activeProject.members.map(
                              (member: any, index: number) => {
                                const name = member.name || member.email;
                                const photo =
                                  member.photoURL ||
                                  `https://ui-avatars.com/api/?name=${name}&background=1A1A1E&color=fff`;
                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setTaskForm({
                                        ...taskForm,
                                        assignee: name,
                                        assigneePhoto: photo,
                                      });
                                      setIsAssigneeDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-textPrimary hover:bg-bgSurfaceHover transition-colors text-left"
                                  >
                                    <img
                                      src={photo}
                                      className="w-6 h-6 rounded-full object-cover shrink-0"
                                      alt="Avatar"
                                    />
                                    <span className="truncate flex-1">
                                      {name}
                                    </span>
                                    {taskForm.assignee === name && (
                                      <Check
                                        size={14}
                                        className="text-indigo-500 shrink-0"
                                      />
                                    )}
                                  </button>
                                );
                              },
                            )
                          : ["Alex Dev", "Maria Silva", "João Santos"].map(
                              (name, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    setTaskForm({
                                      ...taskForm,
                                      assignee: name,
                                      assigneePhoto: "",
                                    });
                                    setIsAssigneeDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-textPrimary hover:bg-bgSurfaceHover transition-colors text-left"
                                >
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${name}&background=1A1A1E&color=fff`}
                                    className="w-6 h-6 rounded-full object-cover shrink-0"
                                    alt="Avatar"
                                  />
                                  <span className="truncate flex-1">
                                    {name}
                                  </span>
                                  {taskForm.assignee === name && (
                                    <Check
                                      size={14}
                                      className="text-indigo-500 shrink-0"
                                    />
                                  )}
                                </button>
                              ),
                            )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Status e Prioridade */}
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
                          ⚪ Todo
                        </option>
                        <option value="in-progress" className="bg-bgSurface">
                          🟡 In Dev
                        </option>
                        <option value="review" className="bg-bgSurface">
                          🟣 Review
                        </option>
                        {editingId && (
                          <option value="done" className="bg-bgSurface">
                            🟢 Done
                          </option>
                        )}
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
                        className="w-full bg-bgGlass border border-borderSubtle rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-indigo-500/50 appearance-none hover:bg-bgGlassHover transition-colors"
                      >
                        <option value="low" className="bg-bgSurface">
                          Baixa
                        </option>
                        <option value="medium" className="bg-bgSurface">
                          Média
                        </option>
                        <option value="high" className="bg-bgSurface">
                          Alta
                        </option>
                        <option value="critical" className="bg-bgSurface">
                          Crítica
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Story Points */}
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    Story Points
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 8].map((point) => (
                      <button
                        key={point}
                        type="button"
                        onClick={() =>
                          setTaskForm({ ...taskForm, points: point })
                        }
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${
                          taskForm.points === point
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                            : "bg-bgGlass border-borderSubtle text-textMuted hover:bg-bgSurfaceActive hover:text-textPrimary"
                        }`}
                      >
                        {point}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GitHub Branch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest">
                      Branch do GitHub
                    </label>
                    {activeProject?.githubRepo && (
                      <button
                        type="button"
                        onClick={handleCreateBranch}
                        disabled={isCreatingBranch || !taskForm.title}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50 transition-colors bg-indigo-500/10 px-2 py-1 rounded-md"
                      >
                        {isCreatingBranch ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Plus size={10} />
                        )}
                        CRIAR BRANCH
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsBranchDropdownOpen(!isBranchDropdownOpen)
                      }
                      className="w-full bg-bgGlass border border-borderSubtle hover:bg-bgGlassHover rounded-xl px-4 py-2.5 text-sm text-textSecondary flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GitBranch
                          size={14}
                          className="text-indigo-400 shrink-0"
                        />
                        <span className="truncate">
                          {taskForm.branch || "Selecionar branch..."}
                        </span>
                      </div>
                      {isLoading ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-textMuted"
                        />
                      ) : (
                        <ChevronDown
                          size={14}
                          className="text-textMuted shrink-0"
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {isBranchDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 w-full mt-2 bg-bgPanel border border-borderFocus rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto custom-scrollbar py-1"
                        >
                          {branches.map((branch: any) => {
                            const branchName =
                              typeof branch === "string" ? branch : branch.name;
                            return (
                              <button
                                key={branchName}
                                type="button"
                                onClick={() => {
                                  setTaskForm({
                                    ...taskForm,
                                    branch: branchName,
                                  });
                                  setIsBranchDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-bgSurfaceHover flex items-center justify-between text-textSecondary transition-colors"
                              >
                                <span className="truncate pr-2">
                                  {branchName}
                                </span>
                                {taskForm.branch === branchName && (
                                  <Check
                                    size={14}
                                    className="text-indigo-500 shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">
                    <Tag size={12} /> Etiquetas (Tags)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(taskForm.tags || []).map((tag: string) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 bg-bgSurfaceHover text-textSecondary text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-borderFocus"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-textMuted hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Adicionar tag e prima Enter..."
                    onKeyDown={handleAddTag}
                    className="w-full bg-bgGlass border border-borderSubtle hover:bg-bgGlassHover focus:border-indigo-500/50 rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textFaint outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* RODAPÉ DO MODAL (Botões) */}
            <div className="px-6 py-4 border-t border-borderSubtle bg-bgMain flex items-center justify-between shrink-0 relative z-10">
              {editingId ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-4 py-2.5 rounded-xl transition-all text-sm font-bold"
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
                  <span>{editingId ? "Salvar" : "Criar Tarefa"}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}