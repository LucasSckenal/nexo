"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  CircleDashed,
  CheckCircle2,
  ArrowRightCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  GripVertical,
  ChevronDown,
  ChevronRight,
  X,
  AlignLeft,
  Paperclip,
  LayoutList,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  Tag,
  Trash2,
  Bug,
  Sparkles,
  FileText,
  MessageSquare,
  CalendarClock,
  CheckSquare,
  Loader2,
  Check,
} from "lucide-react";
import TaskModal from "./components/TaskModal";

// Estrutura padrão
const DEFAULT_TASK = {
  title: "",
  description: "",
  type: "feature",
  epic: "Geral",
  status: "todo",
  priority: "medium",
  points: 1,
  assignee: "",
  assigneePhoto: "",
  target: "sprint",
  tags: [] as string[],
  checklist: [] as { id: string; title: string; completed: boolean }[],
  attachments: [] as { id: string; name: string; type: string; url: string }[],
};

export default function BacklogPage() {
  const { activeProject } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados dos Dados (Ligados ao Firebase)
  const [sprintIssues, setSprintIssues] = useState<any[]>([]);
  const [backlogIssues, setBacklogIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados da UI
  const [searchQuery, setSearchQuery] = useState("");
  const [isSprintOpen, setIsSprintOpen] = useState(true);
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState(DEFAULT_TASK);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  // Estados da sprint e sprints (para futuras funcionalidades de múltiplas sprints)
  const [sprints, setSprints] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any | null>(null);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    name: "",
    duration: 14,
  });

  // Histórico
  const [showHistory, setShowHistory] = useState(false);

  // Estados dos Epics 
  const [epics, setEpics] = useState<any[]>([]);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [newEpicName, setNewEpicName] = useState("");
  const [newEpicColor, setNewEpicColor] = useState("#6366F1");

  const epicColors = [
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F43F5E", // Rose
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#3B82F6", // Blue
  ];

  // Estados do Drag and Drop
  const [draggedItem, setDraggedItem] = useState<{
    issue: any;
    source: "sprint" | "backlog";
  } | null>(null);

  // --- LIGAÇÃO AO FIREBASE (Real-time nas Subcoleções) ---
  useEffect(() => {
    if (!activeProject?.id) {
      setSprintIssues([]);
      setBacklogIssues([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, "projects", activeProject.id, "tasks"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSprintIssues(
        tasksData.filter((t: any) => t.sprintId === activeSprint?.id),
      );

      setBacklogIssues(tasksData.filter((t: any) => t.target === "backlog"));

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeProject, activeSprint]);

  useEffect(() => {
    if (!activeProject?.id) return;

    const q = query(
      collection(db, "projects", activeProject.id, "epics"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setEpics(data);
    });

    return () => unsubscribe();
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject?.id) return;

    const q = query(
      collection(db, "projects", activeProject.id, "sprints"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSprints(data);

      const active = data.find((s: any) => s.status === "active");
      setActiveSprint(active || null);
    });

    return () => unsubscribe();
  }, [activeProject]);

  const getSprintCountdown = (endDate: any) => {
    const now = new Date();
    const end = new Date(endDate?.seconds * 1000);

    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Finalizada";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h restantes`;
  };

  useEffect(() => {
    if (!activeSprint || !activeProject?.id) return;

    const now = new Date();
    const end = new Date(activeSprint.endDate?.seconds * 1000);

    if (now > end && activeSprint.status === "active") {
      updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        { status: "completed" },
      );
    }
  }, [activeSprint]);

  // --- Funções Drag & Drop ---
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    issue: any,
    source: "sprint" | "backlog",
  ) => {
    setDraggedItem({ issue, source });
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "0.4";
        e.target.style.border = "1px dashed #4F46E5";
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "1";
      e.target.style.border = "none";
      e.target.style.borderBottom = "1px solid #27272A";
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (
    e: React.DragEvent,
    target: "sprint" | "backlog",
  ) => {
    e.preventDefault();

    if (!draggedItem || !activeProject?.id) return;

    const { issue } = draggedItem;

    try {
      if (target === "sprint") {
        if (!activeSprint) {
          alert("Crie uma sprint antes de mover tarefas.");
          return;
        }

        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", issue.id),
          {
            sprintId: activeSprint.id,
            target: "sprint",
          },
        );
      } else {
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", issue.id),
          {
            sprintId: null,
            target: "backlog",
          },
        );
      }
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    }

    setDraggedItem(null);
  };

  const handleCreateEpic = async () => {
    if (!newEpicName.trim() || !activeProject?.id) return;

    await addDoc(collection(db, "projects", activeProject.id, "epics"), {
      name: newEpicName,
      color: newEpicColor,
      createdAt: serverTimestamp(),
      status: "active",
    });

    setNewEpicName("");
    setIsEpicModalOpen(false);
  };

  // --- Funções do Modal ---
  const openCreateModal = () => {
    if (!activeProject?.id) {
      alert("Por favor, selecione um projeto primeiro.");
      return;
    }
    setEditingId(null);
    setTaskForm({
      ...DEFAULT_TASK,
      assignee: activeProject?.members?.[0]?.name || "Alex Dev",
      assigneePhoto: activeProject?.members?.[0]?.photoURL || "",
    });
    setIsAssigneeDropdownOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (issue: any, source: "sprint" | "backlog") => {
    setEditingId(issue.id);
    setTaskForm({
      title: issue.title || "",
      description: issue.description || "",
      type: issue.type || "feature",
      epic: issue.epic || "Geral",
      status: issue.status || "todo",
      priority: issue.priority || "medium",
      points: issue.points || 1,
      assignee: issue.assignee || "",
      assigneePhoto: issue.assigneePhoto || "",
      target: issue.target || source,
      tags: issue.tags || [],
      checklist: issue.checklist || [],
      attachments: issue.attachments || [],
    });
    setIsAssigneeDropdownOpen(false);
    setIsModalOpen(true);
  };

  // --- Funções de Anexos ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAttachment = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.includes("image") ? "image" : "file",
        url: reader.result as string,
      };
      setTaskForm((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment],
      }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = () => {
    const url = prompt(
      "Insira o URL do link a anexar (ex: https://figma.com/...)",
    );
    if (url && url.trim() !== "") {
      const newAttachment = {
        id: Date.now().toString(),
        name: url,
        type: "link",
        url: url.startsWith("http") ? url : `https://${url}`,
      };
      setTaskForm((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment],
      }));
    }
  };

  const removeAttachment = (id: string) => {
    setTaskForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== id),
    }));
  };

  // --- Funções da Checklist ---
  const handleAddChecklistItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        setTaskForm({
          ...taskForm,
          checklist: [
            ...(taskForm.checklist || []),
            { id: Math.random().toString(), title: value, completed: false },
          ],
        });
        e.currentTarget.value = "";
      }
    }
  };

  const toggleChecklistItem = (id: string) => {
    setTaskForm({
      ...taskForm,
      checklist: (taskForm.checklist || []).map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    });
  };

  const removeChecklistItem = (id: string) => {
    setTaskForm({
      ...taskForm,
      checklist: (taskForm.checklist || []).filter((item) => item.id !== id),
    });
  };

  // --- Funções de Tags ---
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !(taskForm.tags || []).includes(value)) {
        setTaskForm({ ...taskForm, tags: [...(taskForm.tags || []), value] });
      }
      e.currentTarget.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTaskForm({
      ...taskForm,
      tags: (taskForm.tags || []).filter((tag) => tag !== tagToRemove),
    });
  };

  const handleCreateSprint = async () => {
    if (!activeProject?.id || !sprintForm.name.trim()) return;

    // Se já existir sprint ativa, finalizar ela primeiro
    if (activeSprint) {
      await updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        { status: "completed" },
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + sprintForm.duration);

    await addDoc(collection(db, "projects", activeProject.id, "sprints"), {
      name: sprintForm.name,
      startDate,
      endDate,
      status: "active",
      createdAt: serverTimestamp(),
    });

    setSprintForm({ name: "", duration: 14 });
    setIsSprintModalOpen(false);
  };

  const completedSprints = sprints.filter((s: any) => s.status === "completed");

  // --- Salvar Tarefa ---
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !activeProject?.id) return;

    setIsSaving(true);

    const currentChecklist = taskForm.checklist || [];
    const allChecked =
      currentChecklist.length > 0 && currentChecklist.every((i) => i.completed);
    let finalStatus = taskForm.status;

    if (allChecked && taskForm.status !== "done" && editingId) {
      finalStatus = "done";
    }

    const payload = {
      projectId: activeProject.id,
      title: taskForm.title,
      description: taskForm.description,
      type: taskForm.type,
      epic: taskForm.epic,
      status: finalStatus,
      priority: taskForm.priority,
      epicId: taskForm.epic || null,
      points: Number(taskForm.points),
      tags: (taskForm.tags || []).length > 0 ? taskForm.tags : ["Nova"],
      checklist: currentChecklist,
      attachments: taskForm.attachments || [],
      target: taskForm.target,
      sprintId:
        taskForm.target === "sprint" && activeSprint ? activeSprint.id : null,
      assignee: taskForm.assignee,
      assigneePhoto: taskForm.assigneePhoto || "",
      updatedAt: new Date().toLocaleDateString("pt-PT"),
    };

    try {
      if (editingId) {
        // AGORA ATUALIZA NA SUBCOLEÇÃO
        await updateDoc(
          doc(db, "projects", activeProject.id, "tasks", editingId),
          payload,
        );
      } else {
        // AGORA CRIA NA SUBCOLEÇÃO
        await addDoc(collection(db, "projects", activeProject.id, "tasks"), {
          ...payload,
          key: activeProject.key || "NX",
          comments: 0,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao guardar tarefa: ", error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Apagar Tarefa ---
  const handleDeleteTask = async () => {
    if (!editingId || !activeProject?.id) return;

    try {
      // AGORA APAGA DA SUBCOLEÇÃO
      await deleteDoc(
        doc(db, "projects", activeProject.id, "tasks", editingId),
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao apagar tarefa: ", error);
    }
  };

  // Filtros
  const filteredSprint = sprintIssues.filter(
    (issue) =>
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredBacklog = backlogIssues.filter(
    (issue) =>
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Cálculos da Sprint
  const sprintTotalPoints = filteredSprint.reduce(
    (acc, issue) => acc + (Number(issue.points) || 0),
    0,
  );


  const sprintDonePoints = filteredSprint
    .filter((i) => i.status === "done")
    .reduce((acc, issue) => acc + (Number(issue.points) || 0), 0);
  const sprintProgress =
    sprintTotalPoints === 0
      ? 0
      : Math.round((sprintDonePoints / sprintTotalPoints) * 100);

  // Cálculos da Barra de Progresso do Modal
  const currentChecklist = taskForm.checklist || [];
  const checklistTotal = currentChecklist.length;
  const checklistCompleted = currentChecklist.filter((i) => i.completed).length;
  const checklistProgress =
    checklistTotal === 0
      ? 0
      : Math.round((checklistCompleted / checklistTotal) * 100);

  return (
    <div className="p-8 h-full flex flex-col w-full relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-indigo-400">
              {activeProject?.name || "Selecione um Projeto"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Backlog e Planeamento
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#1A1A1E] border border-[#27272A] text-zinc-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#27272A] hover:text-white transition-all">
            <Filter size={16} /> Filtros
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
          >
            <Plus size={16} /> Criar Issue
          </button>
          <button
            onClick={() => setIsSprintModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            🚀 Criar Sprint
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {showHistory ? "Ocultar Histórico" : "Ver Histórico"}
          </button>
        </div>
      </div>

      {/* HISTÓRICO */}
      {showHistory && (
        <div className="mb-8 border border-[#27272A] rounded-xl bg-[#0D0D0F] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#27272A] bg-[#121214] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Histórico de Sprints
            </h3>
            <span className="text-xs text-zinc-500">
              {completedSprints.length} finalizadas
            </span>
          </div>

          {completedSprints.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-600">
              Nenhuma sprint finalizada ainda.
            </div>
          ) : (
            <div className="divide-y divide-[#27272A]">
              {completedSprints.map((sprint: any) => {
                const start = sprint.startDate?.seconds
                  ? new Date(
                      sprint.startDate.seconds * 1000,
                    ).toLocaleDateString("pt-PT")
                  : "-";

                const end = sprint.endDate?.seconds
                  ? new Date(sprint.endDate.seconds * 1000).toLocaleDateString(
                      "pt-PT",
                    )
                  : "-";

                return (
                  <div
                    key={sprint.id}
                    className="px-4 py-4 flex items-center justify-between hover:bg-[#121214] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {sprint.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {start} → {end}
                      </p>
                    </div>

                    <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Finalizada
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p>A carregar o planeamento...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 pb-10 custom-scrollbar">
          {/* HEADER DESKTOP */}
          <div className="hidden lg:flex items-center gap-3 px-10 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            <div className="w-16">Tipo / ID</div>
            <div className="flex-1">Detalhes da Issue</div>
            <div className="w-16 text-center">Interação</div>
            <div className="w-20 text-center">Atualizado</div>
            <div className="w-12 text-center">Prior</div>
            <div className="w-12 text-center">Pts</div>
            <div className="w-12 text-center">Resp</div>
          </div>

          {/* ================= SPRINT ================= */}
          <div className="mb-8">
            <div
              onClick={() => setIsSprintOpen(!isSprintOpen)}
              className="bg-[#121214] border border-[#27272A] rounded-t-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1A1A1E] transition-colors">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {activeSprint ? activeSprint.name : "Sem Sprint Ativa"}
                  </h2>

                  {activeSprint && (
                    <p className="text-xs text-indigo-400 mt-1">
                      {getSprintCountdown(activeSprint.endDate)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>{sprintIssues.length} issues</span>

                  <span className="bg-[#1A1A1E] px-2 py-1 rounded border border-[#27272A] text-zinc-200">
                    {sprintDonePoints} / {sprintTotalPoints} pts
                  </span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="w-full h-1 bg-[#1A1A1E]">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${sprintProgress}%` }}
                />
              </div>
            </div>

            {isSprintOpen && (
              <div
                className="
                border-x border-b border-[#27272A] 
                rounded-b-xl 
                bg-[#0D0D0F]
                min-h-[80px]
                max-h-[45vh]
                overflow-y-auto
                transition-all
              "
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, "sprint")}
              >
                {sprintIssues.length > 0 ? (
                  sprintIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      epics={epics}
                      onClick={() => openEditModal(issue, "sprint")}
                      onDragStart={(e: any) =>
                        handleDragStart(e, issue, "sprint")
                      }
                      onDragEnd={handleDragEnd}
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

          {/* ================= BACKLOG ================= */}
          <div>
            <div
              onClick={() => setIsBacklogOpen(!isBacklogOpen)}
              className="flex items-center justify-between bg-[#121214] border border-[#27272A] p-4 rounded-t-xl cursor-pointer hover:bg-[#1A1A1E]"
            >
              <h2 className="text-sm font-semibold text-white">
                Backlog de Produto
              </h2>
              <span className="text-xs text-zinc-500">
                {backlogIssues.length} issues
              </span>
            </div>

            {isBacklogOpen && (
              <div
                className="
                border-x border-b border-[#27272A] 
                rounded-b-xl 
                bg-[#0D0D0F]
                min-h-[80px]
                max-h-[45vh]
                overflow-y-auto
                transition-all
              "
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, "backlog")}
              >
                {backlogIssues.length > 0 ? (
                  backlogIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      epics={epics}
                      onClick={() => openEditModal(issue, "backlog")}
                      onDragStart={(e: any) =>
                        handleDragStart(e, issue, "backlog")
                      }
                      onDragEnd={handleDragEnd}
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
        </div>
      )}

      {isSprintModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D0D0F] border border-[#27272A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-[#27272A] bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
              <h2 className="text-lg font-semibold text-white">
                🚀 Criar Nova Sprint
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Defina nome, duração e comece a organizar o trabalho.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* ALERTA SE EXISTE SPRINT ATIVA */}
              {activeSprint && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-lg">
                  Existe uma sprint ativa: <strong>{activeSprint.name}</strong>.
                  Ela será finalizada automaticamente ao criar uma nova.
                </div>
              )}

              {/* NOME */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                  Nome da Sprint
                </label>
                <input
                  type="text"
                  value={sprintForm.name}
                  onChange={(e) =>
                    setSprintForm({ ...sprintForm, name: e.target.value })
                  }
                  placeholder="Ex: Sprint 12 - Autenticação"
                  className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* DURAÇÃO */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                  Duração
                </label>

                <div className="flex gap-2 mb-3">
                  {[7, 14, 21].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setSprintForm({ ...sprintForm, duration: days })
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        sprintForm.duration === days
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                          : "bg-[#1A1A1E] border-[#27272A] text-zinc-400 hover:bg-[#27272A] hover:text-white"
                      }`}
                    >
                      {days} dias
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min={1}
                  value={sprintForm.duration}
                  onChange={(e) =>
                    setSprintForm({
                      ...sprintForm,
                      duration: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* PREVIEW DE DATAS */}
              <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Início:</span>
                  <span>{new Date().toLocaleDateString("pt-PT")}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Fim previsto:</span>
                  <span className="text-indigo-400 font-medium">
                    {(() => {
                      const end = new Date();
                      end.setDate(end.getDate() + sprintForm.duration);
                      return end.toLocaleDateString("pt-PT");
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-[#27272A] bg-[#09090B] flex justify-end gap-3">
              <button
                onClick={() => setIsSprintModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreateSprint}
                disabled={!sprintForm.name.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-40"
              >
                Criar Sprint
              </button>
            </div>
          </div>
        </div>
      )}

      {isEpicModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div>
              <h2 className="text-white font-semibold text-lg">
                Criar Novo Epic
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Epics organizam grandes funcionalidades do projeto.
              </p>
            </div>

            {/* Nome */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                Nome do Epic
              </label>
              <input
                value={newEpicName}
                onChange={(e) => setNewEpicName(e.target.value)}
                placeholder="Ex: Sistema de Pagamentos"
                className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Cores */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
                Cor do Epic
              </label>

              <div className="grid grid-cols-5 gap-3">
                {epicColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewEpicColor(color)}
                    className={`w-10 h-10 rounded-xl transition-all border-2 ${
                      newEpicColor === color
                        ? "scale-110 border-white"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            {newEpicName && (
              <div className="pt-2">
                <span
                  className="inline-flex px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: newEpicColor + "20",
                    color: newEpicColor,
                    border: `1px solid ${newEpicColor}40`,
                  }}
                >
                  Preview: {newEpicName}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#27272A]">
              <button
                onClick={() => setIsEpicModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreateEpic}
                disabled={!newEpicName.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
              >
                Criar Epic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL DE CRIAÇÃO / EDIÇÃO === */}
      {isModalOpen && (
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
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#27272A]"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveTask}
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
                        className="w-full bg-transparent px-4 py-3 text-sm text-zinc-300 focus:outline-none resize-none min-h-[120px]"
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
                    {taskForm.attachments &&
                      taskForm.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {taskForm.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 bg-[#1A1A1E] border border-[#27272A] px-2.5 py-1.5 rounded-lg max-w-xs"
                            >
                              {att.type === "link" ? (
                                <LinkIcon size={14} className="text-blue-400" />
                              ) : att.type === "image" ? (
                                <ImageIcon
                                  size={14}
                                  className="text-emerald-400"
                                />
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
                            className={`text-sm flex-1 transition-all ${item.completed ? "text-zinc-500 line-through" : "text-zinc-200"}`}
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
                        onClick={() => setIsEpicModalOpen(true)}
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
                        <option value="sprint">🚀 Sprint Atual</option>
                        <option value="backlog">📦 Backlog</option>
                      </select>
                    </div>
                  </div>

                  {/* === DROPDOWN CUSTOMIZADO COM A FOTO E NOME DO RESPONSÁVEL === */}
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
                            <span className="truncate">
                              {taskForm.assignee}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600 flex items-center justify-center shrink-0">
                              <X size={10} className="text-zinc-500" />
                            </div>
                            <span className="text-zinc-500">
                              Sem Responsável
                            </span>
                          </>
                        )}
                      </div>
                      <ChevronDown
                        size={14}
                        className="text-zinc-500 shrink-0"
                      />
                    </button>

                    {/* Menu Suspenso de Seleção de Responsável */}
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

                        {activeProject?.members &&
                        activeProject.members.length > 0
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
                          : // Fallbacks de exemplo caso o seu projeto atual ainda não tenha membros adicionados na base de dados
                            ["Alex Dev", "Maria Silva", "João Santos"].map(
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
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-all border ${taskForm.points === point ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]" : "bg-[#1A1A1E] border-[#27272A] text-zinc-400 hover:bg-[#27272A] hover:text-zinc-200"}`}
                        >
                          {point}
                        </button>
                      ))}
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
                    onClick={handleDeleteTask}
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
                    onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function IssueRow({
  issue,
  epics,
  onClick,
  onDragStart,
  onDragEnd,
}: any) {
  const hasChecklist = issue.checklist && issue.checklist.length > 0;
  const epicData =
    epics?.find((e: any) => e.id === issue.epicId) ||
    epics?.find((e: any) => e.name === issue.epic);
  const checklistCompleted = hasChecklist
    ? issue.checklist.filter((i: any) => i.completed).length
    : 0;
  const checklistTotal = hasChecklist ? issue.checklist.length : 0;
  const isChecklistDone = hasChecklist && checklistCompleted === checklistTotal;

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
            {issue.key || issue.id.slice(0, 8)}
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
            className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${isChecklistDone ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-[#121214] text-zinc-400 border-[#27272A]"}`}
          >
            <CheckSquare size={10} />
            {checklistCompleted}/{checklistTotal}
          </span>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-1.5 shrink-0 max-w-[150px] overflow-hidden">
        {issue.tags?.slice(0, 2).map((tag: string) => (
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

      {/* Ícone de anexos na lista se existirem */}
      <div className="hidden lg:flex items-center justify-center gap-1 w-12 shrink-0 text-zinc-500">
        {issue.attachments?.length > 0 && (
          <div
            className="flex items-center gap-1"
            title={`${issue.attachments.length} anexo(s)`}
          >
            <Paperclip size={12} />
          </div>
        )}
      </div>

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
          className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full border ${issue.status === "done" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-[#121214] text-zinc-400 border-[#27272A]"}`}
        >
          {issue.points || 0}
        </span>
      </div>

      {/* AGORA USA A FOTO GRAVADA NO FIREBASE */}
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

function TypeIcon({ type }: { type: string }) {
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

function StatusIcon({ status }: { status: string }) {
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

function PriorityIcon({ priority }: { priority: string }) {
  switch (priority) {
    case "low":
      return (
        <ArrowDown
          size={14}
          className="text-zinc-500"
          title="Prioridade Baixa"
        />
      );
    case "medium":
      return (
        <ArrowRight
          size={14}
          className="text-zinc-400"
          title="Prioridade Média"
        />
      );
    case "high":
      return (
        <ArrowUp size={14} className="text-amber-500" title="Prioridade Alta" />
      );
    case "critical":
      return (
        <div className="bg-red-500/10 text-red-500 p-0.5 rounded">
          <ArrowUp size={14} title="Crítica" />
        </div>
      );
    default:
      return <ArrowRight size={14} className="text-zinc-500" />;
  }
}
