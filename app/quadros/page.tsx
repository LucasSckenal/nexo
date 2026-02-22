"use client";

import React from "react";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Filter, 
  MessageSquare, 
  Paperclip, 
  CheckCircle2, 
  CircleDashed, 
  ArrowRightCircle,
  Clock,
  GitBranch,
  Ban
} from "lucide-react";

/**
 * Tipagem para as etiquetas (tags) dos cartões.
 */
interface Tag {
  id: string;
  name: string;
  colorClass: string;
}

/**
 * Tipagem para as tarefas individuais dentro do Kanban.
 */
interface KanbanTask {
  id: string;
  title: string;
  tags: Tag[];
  priority: "high" | "medium" | "low";
  commentsCount: number;
  attachmentsCount: number;
  assignees: string[];
  points?: number;
  branch?: string;
}

/**
 * Tipagem para as colunas do quadro.
 */
interface Column {
  id: string;
  title: string;
  icon: React.ReactNode;
  tasks: KanbanTask[];
}

/**
 * Dados simulados para estruturar a visualização inicial do Kanban.
 */
const mockColumns: Column[] = [
  {
    id: "todo",
    title: "A Fazer",
    icon: <CircleDashed size={18} className="text-textSecondary" />,
    tasks: [
      {
        id: "NEX-210",
        title: "Criar modelo Prisma para Usuários e Projetos",
        tags: [{ id: "t1", name: "Database", colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20" }],
        priority: "high",
        commentsCount: 3,
        attachmentsCount: 0,
        assignees: ["https://i.pravatar.cc/150?img=12"],
        points: 5,
        branch: "feat/prisma-schema"
      },
      {
        id: "NEX-212",
        title: "Levantar requisitos para Webhook do Discord",
        tags: [{ id: "t2", name: "Documentação", colorClass: "bg-gray-500/10 text-gray-400 border-gray-500/20" }],
        priority: "low",
        commentsCount: 0,
        attachmentsCount: 2,
        assignees: ["https://i.pravatar.cc/150?img=5"],
        points: 2,
        branch: "docs/discord-webhook"
      }
    ]
  },
  {
    id: "in-progress",
    title: "Em Progresso",
    icon: <ArrowRightCircle size={18} className="text-accentPurple" />,
    tasks: [
      {
        id: "NEX-204",
        title: "Corrigir falha na autenticação OAuth2 do GitHub",
        tags: [{ id: "t3", name: "Bug", colorClass: "bg-red-500/10 text-red-400 border-red-500/20" }, { id: "t4", name: "Backend", colorClass: "bg-green-500/10 text-green-400 border-green-500/20" }],
        priority: "high",
        commentsCount: 5,
        attachmentsCount: 1,
        assignees: ["https://i.pravatar.cc/150?img=12", "https://i.pravatar.cc/150?img=8"],
        points: 8,
        branch: "fix/oauth2-github"
      }
    ]
  },
  {
    id: "review",
    title: "Em Revisão",
    icon: <Search size={18} className="text-yellow-500" />,
    tasks: [
      {
        id: "NEX-199",
        title: "Refatorar componente de Tabela de Dados",
        tags: [{ id: "t5", name: "Frontend", colorClass: "bg-orange-500/10 text-orange-400 border-orange-500/20" }],
        priority: "medium",
        commentsCount: 2,
        attachmentsCount: 0,
        assignees: ["https://i.pravatar.cc/150?img=4"],
        points: 3,
        branch: "refactor/data-table"
      }
    ]
  },
  {
    id: "done",
    title: "Concluído",
    icon: <CheckCircle2 size={18} className="text-green-500" />,
    tasks: [
      {
        id: "NEX-190",
        title: "Configuração inicial do repositório e Next.js",
        tags: [{ id: "t6", name: "Setup", colorClass: "bg-accentPurple/10 text-accentPurple border-accentPurple/20" }],
        priority: "high",
        commentsCount: 1,
        attachmentsCount: 0,
        assignees: ["https://i.pravatar.cc/150?img=12"],
        points: 5,
        branch: "main"
      }
    ]
  },
    {
    id: "blocked",
    title: "Bloqueados",
    icon: <Ban size={18} className="text-red-500" />,
    tasks: [
      {
        id: "NEX-208",
        title: "Aguardando liberação de API de pagamentos",
        tags: [{ id: "t7", name: "Dependência", colorClass: "bg-red-500/10 text-red-400 border-red-500/20" }],
        priority: "high",
        commentsCount: 8,
        attachmentsCount: 1,
        assignees: ["https://i.pravatar.cc/150?img=3"],
        points: 3,
        branch: "feat/external-api"
      }
    ]
  },
];

/**
 * Componente da página de Quadros (Kanban).
 * Responsável por renderizar o cabeçalho do projeto e as colunas de tarefas.
 */
export default function QuadrosPage() {
  return (
    <main className="flex-1 flex flex-col h-full z-10 overflow-hidden">
      
      {/* Cabeçalho do Quadro */}
      <header className="h-24 flex flex-col justify-center px-8 shrink-0 border-b border-borderSubtle bg-bgMain/50 backdrop-blur-md relative z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-textPrimary font-medium">Projeto Principal</span>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Desenvolvimento Nexus
              
              <span className="bg-bgSurface border border-borderSubtle text-textSecondary text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium ml-2 shadow-sm">
                <Clock size={14} className="text-accentPurple" />
                Sprint termina em 3 dias
              </span>

              <button className="text-textSecondary hover:text-accentPurple transition-colors ml-1">
                <MoreHorizontal size={20} />
              </button>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 mr-4">
              <img className="w-8 h-8 rounded-full border-2 border-bgMain z-30 shadow-sm" src="https://i.pravatar.cc/150?img=12" alt="Dev" />
              <img className="w-8 h-8 rounded-full border-2 border-bgMain z-20 shadow-sm" src="https://i.pravatar.cc/150?img=5" alt="Dev" />
              <img className="w-8 h-8 rounded-full border-2 border-bgMain z-10 shadow-sm" src="https://i.pravatar.cc/150?img=8" alt="Dev" />
              <button className="w-8 h-8 rounded-full border-2 border-borderSubtle bg-bgSurface flex items-center justify-center text-textSecondary hover:text-textPrimary hover:border-accentPurple transition-all z-0 shadow-sm">
                <Plus size={14} />
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-3 py-1.5 bg-bgSurface border border-borderSubtle rounded-lg text-textSecondary hover:text-textPrimary hover:border-accentPurple/50 transition-all text-sm font-medium shadow-sm">
              <Filter size={16} />
              Filtros
            </button>
            
            <button className="bg-accentPurple hover:bg-accentPurpleDark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] hover:-translate-y-0.5">
              <Plus strokeWidth={3} size={16} />
              Criar Issue
            </button>
          </div>
        </div>
      </header>

      {/* Área do Kanban */}
      <div className="flex-1 overflow-hidden p-8 flex">
        
        {mockColumns.map((column, index) => (
          <React.Fragment key={column.id}>
            <div className="flex flex-col flex-1 min-w-0 h-full">
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-sm flex items-center gap-2 truncate">
                  {column.icon}
                  <span className="truncate">{column.title}</span>
                  <span className="bg-bgSurface border border-borderSubtle text-textSecondary text-xs px-2 py-0.5 rounded-full ml-1 shrink-0">
                    {column.tasks.length}
                  </span>
                </h3>
                {column.id === "todo" && (
                  <button className="text-textSecondary hover:text-textPrimary transition-colors p-1 hover:bg-bgSurface rounded shrink-0">
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {/* Container de Cartões (Scroll Vertical Interno) */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar pb-4">
                {column.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-gradient-to-br from-bgSurface/90 to-bgSurface/40 backdrop-blur-sm p-4 rounded-2xl border border-borderSubtle/60 hover:border-accentPurple/40 shadow-sm hover:shadow-[0_8px_24px_-10px_rgba(139,92,246,0.2)] hover:-translate-y-0.5 transition-all duration-300 cursor-grab active:cursor-grabbing group relative flex flex-col h-[185px] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accentPurple/0 to-accentPurple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>
                    
                    <div className="flex flex-col h-full relative z-10">
                      
                      {/* Conteúdo Centralizado Verticalmente (Tags + Título) */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {task.tags.map(tag => (
                            <span key={tag.id} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border truncate max-w-full ${tag.colorClass}`}>
                              {tag.name}
                            </span>
                          ))}
                        </div>

                        <h4 className="text-[14px] font-semibold text-textPrimary/95 leading-snug line-clamp-2 group-hover:text-accentPurple transition-colors duration-200">
                          {task.title}
                        </h4>
                      </div>

                      {/* Metadados Técnicos em Linha (Prioridade + ID + Pontos + Branch) */}
                      <div className="flex items-center gap-2.5 mt-3">
                        <div 
                          className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]' : task.priority === 'medium' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.7)]' : 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.7)]'}`} 
                          title={`Prioridade: ${task.priority}`}
                        ></div>
                        
                        <span className="text-[11px] font-mono text-textSecondary font-medium shrink-0">
                          {task.id}
                        </span>

                        {task.points && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-bgMain/60 border border-borderSubtle/50 text-[10px] text-textSecondary font-semibold shrink-0" title="Story Points">
                            {task.points}
                          </span>
                        )}

                        {task.branch && (
                          <span className="flex items-center gap-1.5 bg-bgMain/40 px-2 py-1 rounded-md border border-borderSubtle/50 text-[11px] text-textSecondary/80 flex-1 min-w-0" title="Branch">
                            <GitBranch size={12} className="text-textSecondary/60 shrink-0" />
                            <span className="truncate">{task.branch}</span>
                          </span>
                        )}
                      </div>

                      {/* Rodapé do Cartão (Interações Sociais) */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-borderSubtle/40">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2.5 text-textSecondary/80 text-xs font-medium">
                            {task.commentsCount > 0 && (
                              <span className="flex items-center gap-1 hover:text-textPrimary transition-colors"><MessageSquare size={13} /> {task.commentsCount}</span>
                            )}
                            {task.attachmentsCount > 0 && (
                              <span className="flex items-center gap-1 hover:text-textPrimary transition-colors"><Paperclip size={13} /> {task.attachmentsCount}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex -space-x-1.5 shrink-0">
                          {task.assignees.map((avatar, idx) => (
                            <img key={idx} src={avatar} className="w-6 h-6 rounded-full border-2 border-[#1c1c21] group-hover:border-[#212126] transition-colors shadow-sm" alt="Responsável" />
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
                
                {column.id === "todo" && (
                  <button className="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-textSecondary hover:text-textPrimary hover:bg-bgSurface/50 border border-dashed border-borderSubtle/60 hover:border-textSecondary/50 rounded-xl transition-all">
                    <Plus size={16} />
                    Adicionar Tarefa
                  </button>
                )}
              </div>
            </div>

            {/* Divisória Vertical */}
            {index < mockColumns.length - 1 && (
              <div className="w-px bg-gradient-to-b from-transparent via-borderSubtle/60 to-transparent shrink-0 h-full mx-4 lg:mx-6"></div>
            )}
          </React.Fragment>
        ))}

      </div>
    </main>
  );
}