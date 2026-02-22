"use client";

import { 
  Search, 
  Bell, 
  Plus, 
  TrendingUp, 
  ArrowUp, 
  GitPullRequest, 
  Target, 
  Check, 
  FolderOpen, 
  AlertCircle, 
  Palette, 
  Activity, 
  MoreHorizontal, 
  Github, 
  Gamepad2, 
  Clock 
} from "lucide-react";

/**
 * Interface de tipagem para as tarefas do Dashboard.
 */
interface Task {
  id: string;
  title: string;
  project: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  time: string;
  assignees: string[];
  icon: React.ReactNode;
}

const mockTasks: Task[] = [
  {
    id: "NEX-204",
    title: "Corrigir falha na autenticação OAuth2",
    project: "Backend Core",
    priority: "high",
    dueDate: "Hoje",
    time: "18:00",
    assignees: ["https://i.pravatar.cc/150?img=12"],
    icon: <FolderOpen size={16} />
  },
  {
    id: "NEX-199",
    title: "Refatorar componente de Tabela de Dados",
    project: "Frontend Web",
    priority: "medium",
    dueDate: "Amanhã",
    time: "10:00",
    assignees: ["https://i.pravatar.cc/150?img=5", "https://i.pravatar.cc/150?img=8"],
    icon: <Palette size={16} />
  }
];

/**
 * Componente da Página Inicial (Dashboard)
 * Exibe métricas gerais, lista de tarefas pendentes e feed de atividades.
 */
export default function DashboardPage() {
  return (
    <main className="flex-1 flex flex-col h-full z-10">
      
      <header className="h-20 flex items-center justify-between px-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Bom dia, Alex.</h1>
          <p className="text-textSecondary text-sm">Sexta-feira, 21 de Fevereiro</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-bgSurface border border-borderSubtle rounded-full text-textSecondary text-sm w-72 focus-within:border-accentPurple/50 focus-within:text-textPrimary transition-all group cursor-text">
            <Search size={20} className="group-focus-within:text-accentPurple transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar tarefas, projetos... (Ctrl+K)" 
              className="bg-transparent border-none outline-none flex-1 placeholder-textSecondary/50" 
            />
          </div>
          
          <button className="relative text-textSecondary hover:text-textPrimary transition-colors p-2 rounded-full hover:bg-bgSurface">
            <Bell size={24} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accentPurple rounded-full border-2 border-bgMain"></span>
          </button>
          
          <button className="bg-accentPurple hover:bg-accentPurpleDark text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] active:scale-95">
            <Plus strokeWidth={3} size={18} />
            Nova Tarefa
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-bgSurface p-6 rounded-2xl border border-borderSubtle relative overflow-hidden group hover:border-accentPurple/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-textSecondary text-sm font-medium mb-1">Sprint Atual</p>
                <h3 className="text-3xl font-bold text-textPrimary">85% <span className="text-sm text-textSecondary font-normal">concluído</span></h3>
              </div>
              <div className="p-2 bg-accentPurple/10 rounded-lg text-accentPurple">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="w-full bg-bgMain h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-accentPurple h-full rounded-full" style={{ width: "85%" }}></div>
            </div>
            <p className="text-xs text-textSecondary">Faltam 12 tarefas para fechar a sprint.</p>
          </div>

          <div className="bg-bgSurface p-6 rounded-2xl border border-borderSubtle group hover:border-accentPurple/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-textSecondary text-sm font-medium mb-1">Velocidade da Equipe</p>
                <h3 className="text-3xl font-bold text-textPrimary">42 <span className="text-sm text-textSecondary font-normal">pontos/sem</span></h3>
              </div>
              <svg className="w-24 h-12 text-accentPurple overflow-visible" viewBox="0 0 100 50">
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#8b5cf6", stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <path d="M0 40 Q 25 20, 50 35 T 100 10" fill="url(#purpleGradient)" stroke="none" />
                <path d="M0 40 Q 25 20, 50 35 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-xs text-textSecondary flex items-center gap-1">
              <ArrowUp className="text-green-500" size={16} />
              <span className="text-green-500 font-medium">12%</span> acima da média do último mês.
            </p>
          </div>

          <div className="bg-[#0d1117] p-6 rounded-2xl border border-borderSubtle relative overflow-hidden group hover:border-accentPurple/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Github size={96} fill="currentColor" className="text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-textSecondary mb-4">
                <GitPullRequest size={20} />
                <p className="text-sm font-medium">Pull Requests Abertos</p>
              </div>
              <h3 className="text-3xl font-bold text-textPrimary mb-4">4 <span className="text-sm text-textSecondary font-normal">pendentes</span></h3>
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-bgSurface" src="https://i.pravatar.cc/150?img=3" alt="Dev" />
                <img className="w-8 h-8 rounded-full border-2 border-bgSurface" src="https://i.pravatar.cc/150?img=4" alt="Dev" />
                <div className="w-8 h-8 rounded-full border-2 border-bgSurface bg-bgMain flex items-center justify-center text-xs text-textSecondary">+2</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target size={24} className="text-accentPurple" />
                Prioridades Hoje
              </h3>
              <div className="flex bg-bgSurface p-1 rounded-lg border border-borderSubtle">
                <button className="px-3 py-1 text-xs font-medium bg-accentPurple text-white rounded-md">Minhas</button>
                <button className="px-3 py-1 text-xs font-medium text-textSecondary hover:text-textPrimary rounded-md transition-colors">Da Equipe</button>
              </div>
            </div>

            <div className="space-y-3">
              {mockTasks.map((task) => (
                <div key={task.id} className="bg-bgSurface p-4 rounded-xl border border-borderSubtle hover:border-accentPurple/50 hover:bg-bgSurfaceHover/50 transition-all cursor-pointer group flex items-center gap-4 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  
                  <div className="flex-1 flex items-center gap-4 ml-2">
                    <div className="w-6 h-6 rounded-md border-2 border-borderSubtle flex items-center justify-center group-hover:border-accentPurple text-transparent group-hover:text-accentPurple/50 transition-all">
                      <Check strokeWidth={3} size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'text-accentPurple bg-accentPurple/10' : 'text-textSecondary bg-borderSubtle'}`}>
                          {task.id}
                        </span>
                        <span className="text-textPrimary font-medium group-hover:text-accentPurple transition-colors">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-textSecondary">
                        <span className="flex items-center gap-1">{task.icon} {task.project}</span>
                        {task.priority === 'high' && (
                          <span className="flex items-center gap-1 text-red-400"><AlertCircle size={16} /> Urgente</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex -space-x-2">
                      {task.assignees.map((avatar, idx) => (
                        <img key={idx} src={avatar} className="w-8 h-8 rounded-full border-2 border-bgMain ring-2 ring-transparent group-hover:ring-accentPurple/30 transition-all" alt="Avatar" />
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-textPrimary font-medium">{task.dueDate}</p>
                      <p className="text-textSecondary text-xs">{task.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-bgSurface rounded-2xl border border-borderSubtle p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2"><Activity size={24} className="text-accentPurple" /> Atividade Recente</span>
              <MoreHorizontal size={24} className="text-textSecondary cursor-pointer hover:text-textPrimary" />
            </h3>
            
            <div className="space-y-6 relative pl-2">
              <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-borderSubtle/50 z-0"></div>

              <div className="relative z-10 flex gap-4 items-start group">
                <div className="w-6 h-6 rounded-full bg-[#171515] border border-borderSubtle ring-4 ring-bgSurface flex items-center justify-center shrink-0 group-hover:ring-accentPurple/20 transition-all">
                  <Github size={14} fill="currentColor" className="text-white" />
                </div>
                <div>
                  <p className="text-sm leading-snug"><span className="font-semibold text-textPrimary">rafael-git</span> abriu um PR no repositório <span className="text-textPrimary">backend-api</span></p>
                  <a href="#" className="text-accentPurple text-sm hover:underline font-medium flex items-center gap-1 mt-1">
                    <GitPullRequest size={16} /> #45 Fix/Auth Middleware Bug
                  </a>
                  <p className="text-xs text-textSecondary mt-2 flex items-center gap-2"><Clock size={14} /> Há 10 min</p>
                </div>
              </div>

              <div className="relative z-10 flex gap-4 items-start group">
                <div className="w-6 h-6 rounded-full bg-[#5865F2] border border-[#5865F2] ring-4 ring-bgSurface flex items-center justify-center shrink-0 group-hover:ring-[#5865F2]/20 transition-all">
                  <Gamepad2 size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm leading-snug"><span className="font-semibold text-[#5865F2]">NexusBot</span> enviou um alerta em <span className="text-textPrimary">#ops-deploy</span></p>
                  <div className="bg-[#2f3136] p-2 rounded-md mt-2 border-l-4 border-red-500">
                    <p className="text-xs text-red-300 font-mono">Error: Build failed on Vercel</p>
                  </div>
                  <p className="text-xs text-textSecondary mt-2 flex items-center gap-2"><Clock size={14} /> Há 35 min</p>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2 text-sm text-textSecondary hover:text-accentPurple border border-borderSubtle hover:border-accentPurple/30 rounded-lg transition-all text-center">
              Ver todo o histórico
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}