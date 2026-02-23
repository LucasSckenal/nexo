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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useGitHub } from "../../context/GitHubContext";
import { DEFAULT_TASK } from "../../constants/backlog";

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

  if (!isOpen) return null;
  const { branches, isLoading, fetchBranches, createBranch} = useGitHub();
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

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
    // Validação extra de segurança
    if (!activeProject?.githubRepo || !activeProject?.githubToken) {
      alert(
        "Por favor, configura o Token do GitHub (PAT) na página de Repositórios primeiro!",
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

    // 👇 AQUI ESTÁ A MAGIA: Passamos o token gravado na base de dados! 👇
    const success = await createBranch(
      activeProject.githubRepo,
      newBranchName,
      activeProject.githubToken,
    );

    if (success) {
      setTaskForm({ ...taskForm, branch: newBranchName });
    } else {
      alert(
        "Falha ao criar branch. Verifica se o teu token tem permissões de 'repo' e se não expirou.",
      );
    }
    setIsCreatingBranch(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#27272A] rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#121214] shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-md">
              <LayoutList size={18} />
            </div>
            <h2 className="text-base font-semibold text-zinc-100">
              {editingId
                ? `A Editar Issue: ${editingId.slice(0, 8)}`
                : "Criar Nova Issue"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#27272A]"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSave}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* --- Coluna Esquerda --- */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                  placeholder="Título da tarefa..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <AlignLeft size={16} />
                  <span className="text-sm font-medium">
                    Descrição detalhada
                  </span>
                </div>

                <div className="border border-[#27272A] bg-[#0D0D0F] rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors flex flex-col">
                  <textarea
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Adicione o contexto, referências técnicas..."
                    className="w-full bg-transparent px-4 py-3 text-sm text-zinc-300 focus:outline-none resize-none min-h-[240px]"
                  />

                  {/* ZONA DOS ANEXOS NA DESCRIÇÃO */}
                  <div className="bg-[#121214] border-t border-[#27272A] px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272A] rounded-md transition-colors"
                        title="Anexar Ficheiro"
                      >
                        <Paperclip size={16} />
                      </button>
                      <div className="w-px h-4 bg-[#27272A] mx-1"></div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272A] rounded-md transition-colors"
                        title="Anexar Imagem"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272A] rounded-md transition-colors"
                        title="Adicionar Link"
                      >
                        <LinkIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* VISTA DOS ANEXOS ADICIONADOS */}
                {taskForm.attachments && taskForm.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {taskForm.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 bg-[#1A1A1E] border border-[#27272A] px-2.5 py-1.5 rounded-lg max-w-xs"
                      >
                        {att.type === "link" ? (
                          <LinkIcon size={14} className="text-blue-400" />
                        ) : att.type === "image" ? (
                          <ImageIcon size={14} className="text-emerald-400" />
                        ) : (
                          <FileText size={14} className="text-zinc-400" />
                        )}
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-300 hover:text-indigo-400 truncate flex-1"
                        >
                          {att.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CHECKLIST */}
              <div className="space-y-4 pt-2 border-t border-[#27272A]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <CheckSquare size={16} />
                    <span className="text-sm font-medium">
                      Subtarefas (Checklist)
                    </span>
                  </div>
                  {checklistTotal > 0 && (
                    <div className="flex items-center gap-3 w-32">
                      <span className="text-xs font-medium text-zinc-500 w-8 text-right">
                        {checklistProgress}%
                      </span>
                      <div className="h-1.5 flex-1 bg-[#1A1A1E] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${checklistProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {currentChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 group bg-[#121214] border border-[#27272A] px-3 py-2 rounded-lg hover:border-[#3F3F46] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="w-4 h-4 rounded border-[#3F3F46] bg-[#1A1A1E] checked:bg-indigo-500 checked:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer appearance-none flex items-center justify-center after:content-['✓'] after:text-white after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all"
                      />
                      <span
                        className={`text-sm flex-1 transition-all ${
                          item.completed
                            ? "text-zinc-500 line-through"
                            : "text-zinc-200"
                        }`}
                      >
                        {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-3 px-3 py-2 border border-transparent">
                    <Plus size={16} className="text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Adicionar nova subtarefa... (Prima Enter)"
                      onKeyDown={handleAddChecklistItem}
                      className="bg-transparent border-none text-sm text-zinc-300 focus:ring-0 flex-1 placeholder:text-zinc-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Coluna Direita: Propriedades --- */}
            <div className="w-full md:w-80 bg-[#09090B] border-l border-[#27272A] p-6 overflow-y-auto shrink-0 space-y-5 custom-scrollbar">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Tipo
                  </label>
                  <select
                    value={taskForm.type}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, type: e.target.value })
                    }
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="feature">✨ Feature</option>
                    <option value="bug">🐛 Bug</option>
                    <option value="task">📝 Tarefa</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Épico
                  </label>
                  <select
                    value={taskForm.epic}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, epic: e.target.value })
                    }
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Sem Epic</option>
                    {epics.map((epic) => (
                      <option key={epic.id} value={epic.id}>
                        {epic.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={onOpenEpicModal}
                    className="text-xs text-indigo-400 mt-2 hover:underline"
                  >
                    + Criar novo Epic
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Destino
                  </label>
                  <select
                    value={taskForm.target}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, target: e.target.value })
                    }
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none hover:border-[#3F3F46]"
                  >
                    <option value="backlog">📦 Backlog</option>
                    <option value="sprint">🚀 Sprint Atual</option>
                  </select>
                </div>
              </div>

              {/* DROPDOWN RESPONSÁVEL */}
              <div className="relative">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Responsável
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)
                  }
                  className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 hover:border-[#3F3F46] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    {taskForm.assignee ? (
                      <>
                        <img
                          src={
                            taskForm.assigneePhoto ||
                            `https://ui-avatars.com/api/?name=${taskForm.assignee}&background=27272A&color=fff`
                          }
                          className="w-5 h-5 rounded-full object-cover border border-[#27272A]"
                          alt="Avatar"
                        />
                        <span className="truncate">{taskForm.assignee}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600 flex items-center justify-center shrink-0">
                          <X size={10} className="text-zinc-500" />
                        </div>
                        <span className="text-zinc-500">Sem Responsável</span>
                      </>
                    )}
                  </div>
                  <ChevronDown size={14} className="text-zinc-500 shrink-0" />
                </button>

                {isAssigneeDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-[#121214] border border-[#27272A] rounded-lg shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto custom-scrollbar">
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-[#1A1A1E] transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600 flex items-center justify-center shrink-0">
                        <X size={10} />
                      </div>
                      <span className="truncate">Sem Responsável</span>
                    </button>

                    {activeProject?.members && activeProject.members.length > 0
                      ? activeProject.members.map(
                          (member: any, index: number) => {
                            const name = member.name || member.email;
                            const photo =
                              member.photoURL ||
                              `https://ui-avatars.com/api/?name=${name}&background=27272A&color=fff`;
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
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-[#1A1A1E] transition-colors text-left"
                              >
                                <img
                                  src={photo}
                                  className="w-5 h-5 rounded-full border border-[#27272A] object-cover shrink-0"
                                  alt="Avatar"
                                />
                                <span className="truncate flex-1">{name}</span>
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
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-[#1A1A1E] transition-colors text-left"
                            >
                              <img
                                src={`https://ui-avatars.com/api/?name=${name}&background=27272A&color=fff`}
                                className="w-5 h-5 rounded-full border border-[#27272A] object-cover shrink-0"
                                alt="Avatar"
                              />
                              <span className="truncate flex-1">{name}</span>
                              {taskForm.assignee === name && (
                                <Check
                                  size={14}
                                  className="text-indigo-500 shrink-0"
                                />
                              )}
                            </button>
                          ),
                        )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, status: e.target.value })
                    }
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="todo">⚪ Todo</option>
                    <option value="in-progress">🟡 In Dev</option>
                    <option value="review">🟣 Review</option>
                    {editingId && <option value="done">🟢 Done</option>}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Prioridade
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value })
                    }
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
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
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-all border ${
                        taskForm.points === point
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                          : "bg-[#1A1A1E] border-[#27272A] text-zinc-400 hover:bg-[#27272A] hover:text-zinc-200"
                      }`}
                    >
                      {point}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Branch do GitHub
                  </label>

                  {/* Botão mágico para criar a branch - Só aparece se houver um repositório configurado */}
                  {activeProject?.githubRepo && (
                    <button
                      type="button"
                      onClick={handleCreateBranch}
                      disabled={isCreatingBranch || !taskForm.title}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
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
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch size={14} className="text-indigo-400" />
                      <span>
                        {/* MUDOU AQUI: taskForm.branch */}
                        {taskForm.branch || "Selecionar branch..."}
                      </span>
                    </div>
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {isBranchDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#1A1A1E] border border-[#27272A] rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto custom-scrollbar">
                      {branches.map((branch) => (
                        <button
                          key={branch}
                          type="button"
                          onClick={() => {
                            setTaskForm({ ...taskForm, branch: branch });
                            setIsBranchDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center justify-between"
                        >
                          {branch}
                          {/* MUDOU AQUI: taskForm.branch */}
                          {taskForm.branch === branch && (
                            <Check size={14} className="text-indigo-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  <Tag size={12} /> Etiquetas (Tags)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(taskForm.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-[#27272A] text-zinc-300 text-[10px] font-medium px-2 py-1 rounded-md border border-[#3F3F46]"
                    >
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
                </div>
                <input
                  type="text"
                  placeholder="Adicionar tag... (Enter)"
                  onKeyDown={handleAddTag}
                  className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Rodapé do Modal */}
          <div className="p-4 border-t border-[#27272A] bg-[#121214] flex items-center justify-between shrink-0">
            {editingId ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-400 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg disabled:opacity-50"
              >
                {isSaving && (
                  <Loader2 size={16} className="animate-spin text-black" />
                )}
                {editingId ? "Guardar Alterações" : "Criar Tarefa"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
