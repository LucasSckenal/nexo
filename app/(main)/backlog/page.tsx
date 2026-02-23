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
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useData } from "../../context/DataContext";
import { Filter, Plus, Loader2, Search } from "lucide-react";

// Componentes
import { SprintSection } from "../../components/backlog/SprintSection";
import { BacklogSection } from "../../components/backlog/BacklogSection";
import { HistorySection } from "../../components/backlog/HistorySection";
import { SprintModal } from "../../components/modals/SprintModal";
import { EpicModal } from "../../components/modals/EpicModal";
import { TaskModal } from "../../components/modals/TaskModal";

// Constantes
import { DEFAULT_TASK } from "../../constants/backlog";

export default function BacklogPage() {
  const { activeProject } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados dos Dados
  const [sprintIssues, setSprintIssues] = useState<any[]>([]);
  const [backlogIssues, setBacklogIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sprints, setSprints] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any | null>(null);
  const [epics, setEpics] = useState<any[]>([]);

  // Estados da UI
  const [searchQuery, setSearchQuery] = useState("");
  const [isSprintOpen, setIsSprintOpen] = useState(true);
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState(DEFAULT_TASK);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [sprintForm, setSprintForm] = useState({ name: "", duration: 14 });
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [newEpicName, setNewEpicName] = useState("");
  const [newEpicColor, setNewEpicColor] = useState("#6366F1");

  // Drag state
  const [draggedItem, setDraggedItem] = useState<{
    issue: any;
    source: "sprint" | "backlog";
  } | null>(null);

  // --- Listeners Firebase (subcoleções) ---
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
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSprints(data);
      const active = data.find((s: any) => s.status === "active");
      setActiveSprint(active || null);
    });

    return () => unsubscribe();
  }, [activeProject]);

  // Verificar se sprint expirou
  useEffect(() => {
    if (!activeSprint || !activeProject?.id) return;
    const now = new Date();
    const end = new Date(activeSprint.endDate?.seconds * 1000);
    if (now > end && activeSprint.status === "active") {
      updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        {
          status: "completed",
        },
      );
    }
  }, [activeSprint, activeProject]);

  // --- Funções auxiliares ---
  const getSprintCountdown = (endDate: any) => {
    const now = new Date();
    const end = new Date(endDate?.seconds * 1000);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Finalizada";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h restantes`;
  };

  // --- Drag & Drop ---
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

  // --- Abertura dos modais ---
  const openCreateModal = () => {
    if (!activeProject?.id) {
      alert("Por favor, selecione um projeto primeiro.");
      return;
    }
    setEditingId(null);
    setTaskForm({
      ...DEFAULT_TASK,
      target: "backlog", 
      sprintId: null,
      assignee: activeProject?.members?.[0]?.name || "Alex Dev",
      assigneePhoto: activeProject?.members?.[0]?.photoURL || "",
    });
    setIsAssigneeDropdownOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (issue: any) => {
    setEditingId(issue.id);
    setTaskForm({
      ...issue,
      title: issue.title || "",
      description: issue.description || "",
      type: issue.type || "feature",
      epic: issue.epic || "Geral",
      status: issue.status || "todo",
      priority: issue.priority || "medium",
      points: issue.points || 1,
      assignee: issue.assignee || "",
      assigneePhoto: issue.assigneePhoto || "",
      target: issue.target || "backlog",
      branch: issue.branch || "",
      tags: issue.tags || [],
      checklist: issue.checklist || [],
      attachments: issue.attachments || [],
    });
    setIsAssigneeDropdownOpen(false);
    setIsModalOpen(true);
  };

  // --- Handlers de anexos ---
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

  // --- Handlers da checklist ---
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

  // --- Handlers de tags ---
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

  // --- Handlers de criação (Sprint, Epic) ---
  const handleCreateSprint = async (name: string, duration: number) => {
    if (!activeProject?.id || !name.trim()) return;
    if (activeSprint) {
      await updateDoc(
        doc(db, "projects", activeProject.id, "sprints", activeSprint.id),
        {
          status: "completed",
        },
      );
    }
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);
    await addDoc(collection(db, "projects", activeProject.id, "sprints"), {
      name,
      startDate,
      endDate,
      status: "active",
      createdAt: serverTimestamp(),
    });
  };

  const handleCreateEpic = async (name: string, color: string) => {
    if (!activeProject?.id || !name.trim()) return;
    await addDoc(collection(db, "projects", activeProject.id, "epics"), {
      name,
      color,
      createdAt: serverTimestamp(),
      status: "active",
    });
  };

  // --- Salvar / Eliminar tarefa ---
 const handleSaveTask = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!taskForm.title.trim() || !activeProject?.id) return;

   setIsSaving(true);

   try {
     if (editingId) {
       // Lógica de Edição
       const taskRef = doc(
         db,
         "projects",
         activeProject.id,
         "tasks",
         editingId,
       );
       await updateDoc(taskRef, {
         ...taskForm,
         updatedAt: new Date().toLocaleDateString("pt-PT"),
       });
     } else {
       // Lógica de Criação com Registo de Atividade
       await runTransaction(db, async (transaction) => {
         const projectRef = doc(db, "projects", activeProject.id);
         const projectDoc = await transaction.get(projectRef);

         if (!projectDoc.exists()) throw "Projeto não encontrado!";

         const projectData = projectDoc.data();
         const projectKey = (projectData.name || "TASK").replace(
           /[^a-zA-Z0-9]/g,
           "",
         );
         const lastNumber = projectData.lastTaskNumber || 0;
         const nextNumber = lastNumber + 1;
         const formattedKey = `${projectKey}-${nextNumber}`;

         // 1. Atualiza o contador no PROJETO
         transaction.update(projectRef, { lastTaskNumber: nextNumber });

         // 2. Cria a referência para a nova tarefa
         const newTaskRef = doc(
           collection(db, "projects", activeProject.id, "tasks"),
         );

         const taskData = {
           ...taskForm,
           taskKey: formattedKey,
           createdAt: serverTimestamp(),
           updatedAt: new Date().toLocaleDateString("pt-PT"),
           projectId: activeProject.id,
         };

         transaction.set(newTaskRef, taskData);

         // 3. REGISTAR ATIVIDADE PARA O RADAR (Dashboard)
         const activityRef = doc(
           collection(db, "projects", activeProject.id, "activities"),
         );
         transaction.set(activityRef, {
           content: `Criou a issue ${formattedKey}: ${taskForm.title}`,
           userId: auth.currentUser?.uid,
           userName: auth.currentUser?.displayName || "Membro",
           timestamp: serverTimestamp(),
           type: "create", // 👈 Isso ativa o ícone PlusCircle com animação verde
           taskKey: formattedKey,
         });
       });
     }
     setIsModalOpen(false);
   } catch (error) {
     console.error("Erro ao salvar tarefa:", error);
   } finally {
     setIsSaving(false);
   }
 };

  const handleDeleteTask = async () => {
    if (!editingId || !activeProject?.id) return;
    try {
      await deleteDoc(
        doc(db, "projects", activeProject.id, "tasks", editingId),
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao apagar tarefa: ", error);
    }
  };

  // Filtragem
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

  const completedSprints = sprints.filter((s: any) => s.status === "completed");

  return (
    <div className="p-8 h-full flex flex-col w-full relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* Header */}
      <div className="flex flex-col gap-6 mb-8 shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            {/* Breadcrumb refinado */}
            <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
              <span className="hover:text-zinc-300 cursor-pointer transition-colors">
                Workspace
              </span>
              <span className="text-zinc-700">/</span>
              <span className="text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {activeProject?.name || "Projeto não selecionado"}
              </span>
            </nav>

            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Backlog
              </h1>
              {/* Badge de status do projeto ou contador de tarefas */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1A1A1E] border border-[#27272A] text-[10px] font-bold text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                {backlogIssues.length + sprintIssues.length} Issues totais
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Ações Secundárias */}
            <div className="flex items-center bg-[#1A1A1E] border border-[#27272A] p-1 rounded-lg mr-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  showHistory
                    ? "bg-[#27272A] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Histórico
              </button>
              <button className="px-3 py-1.5 rounded-md text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-all">
                Insights
              </button>
            </div>

            <div className="h-8 w-px bg-[#27272A] mx-1" />

            {/* Botões de Ação Principal */}
            <button
              onClick={() => setIsSprintModalOpen(true)}
              className="flex items-center gap-2 bg-[#1A1A1E] border border-[#27272A] text-zinc-200 hover:bg-[#27272A] px-4 py-2 rounded-lg text-xs font-bold transition-all group"
            >
              <Plus
                size={14}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              Nova Sprint
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-black transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)]"
            >
              Criar Issue
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca Integrada (Enterprise Standard) */}
        <div className="flex items-center justify-between py-3 border-y border-[#1A1A1E]">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={14}
              />
              <input
                type="text"
                placeholder="Pesquisar por título, ID ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-zinc-300 placeholder:text-zinc-600 focus:ring-0 pl-9"
              />
            </div>

            <div className="h-4 w-px bg-[#27272A]" />

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
                <Filter size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Filtros
                </span>
              </button>
            </div>
          </div>

          {/* Avatares dos membros do projeto (Stack) */}
          <div className="flex items-center gap-3 ml-4">
            <div className="flex -space-x-2">
              {activeProject?.members?.slice(0, 4).map((m: any, i: number) => (
                <img
                  key={i}
                  src={
                    m.photoURL || `https://ui-avatars.com/api/?name=${m.name}`
                  }
                  className="w-6 h-6 rounded-full border-2 border-[#0C0C0E] grayscale hover:grayscale-0 transition-all cursor-pointer"
                  title={m.name}
                />
              ))}
              {activeProject?.members?.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-[#1A1A1E] border-2 border-[#0C0C0E] flex items-center justify-center text-[8px] font-bold text-zinc-500">
                  +{activeProject.members.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <HistorySection
        show={showHistory}
        completedSprints={completedSprints}
        onToggle={() => setShowHistory(!showHistory)}
      />

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p>A carregar o planeamento...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 pb-10 custom-scrollbar">
          {/* Cabeçalho desktop */}
          <div className="hidden lg:flex items-center gap-3 px-10 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            <div className="w-16">Tipo / ID</div>
            <div className="flex-1">Detalhes da Issue</div>
            <div className="w-16 text-center">Interação</div>
            <div className="w-20 text-center">Atualizado</div>
            <div className="w-12 text-center">Prior</div>
            <div className="w-12 text-center">Pts</div>
            <div className="w-12 text-center">Resp</div>
          </div>

          {/* Sprint */}
          <SprintSection
            isOpen={isSprintOpen}
            onToggle={() => setIsSprintOpen(!isSprintOpen)}
            sprint={activeSprint}
            issues={filteredSprint}
            epics={epics}
            onIssueClick={openEditModal}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, "sprint")}
            getSprintCountdown={getSprintCountdown}
          />

          {/* Backlog */}
          <BacklogSection
            isOpen={isBacklogOpen}
            onToggle={() => setIsBacklogOpen(!isBacklogOpen)}
            issues={filteredBacklog}
            epics={epics}
            onIssueClick={openEditModal}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, "backlog")}
          />
        </div>
      )}

      {/* Modais */}
      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onCreate={handleCreateSprint}
        activeSprint={activeSprint}
      />

      <EpicModal
        isOpen={isEpicModalOpen}
        onClose={() => setIsEpicModalOpen(false)}
        onCreate={handleCreateEpic}
      />

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        editingId={editingId}
        isSaving={isSaving}
        epics={epics}
        activeProject={activeProject}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        handleAddLink={handleAddLink}
        removeAttachment={removeAttachment}
        handleAddChecklistItem={handleAddChecklistItem}
        toggleChecklistItem={toggleChecklistItem}
        removeChecklistItem={removeChecklistItem}
        handleAddTag={handleAddTag}
        removeTag={removeTag}
        isAssigneeDropdownOpen={isAssigneeDropdownOpen}
        setIsAssigneeDropdownOpen={setIsAssigneeDropdownOpen}
        onOpenEpicModal={() => setIsEpicModalOpen(true)}
      />
    </div>
  );
}
