import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Trash2,
  BellOff,
  User,
  MessageSquare,
  AlertCircle,
  Briefcase,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";

// Mapeamento de ícones por tipo de notificação
const icons = {
  mention: <MessageSquare size={12} className="text-blue-400" />,
  status: <AlertCircle size={12} className="text-amber-400" />,
  assignment: <Briefcase size={12} className="text-emerald-400" />,
  system: <User size={12} className="text-purple-400" />,
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    notifications: any[];
    unreadCount: number;
  };
  actions: {
    markAsRead: (id: string) => void;
    deleteNotif: (id: string) => void;
    markAllAsRead: () => void;
    onSelectTask: (taskId: string) => void; // Função para abrir a task no Kanban
  };
}

export function NotificationPanel({
  isOpen,
  onClose,
  data,
  actions,
}: NotificationPanelProps) {

  const router = useRouter();

  const handleNotifClick = (n: any) => {
    if (n.taskId) {
      router.push(`/kanban?taskId=${n.taskId}`);
    }

    if (!n.read) {
      actions.markAsRead(n.id);
    }
    onClose();
  };
  

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed right-6 top-20 w-[380px] z-[200] bg-[#111111]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Notificações
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {data.unreadCount > 0
                    ? `Você tem ${data.unreadCount} novas atualizações`
                    : "Nenhuma novidade por enquanto"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {data.unreadCount > 0 && (
                  <button
                    onClick={actions.markAllAsRead}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Ler tudo
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[500px] p-3 space-y-2 custom-scrollbar">
              {data.notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                  <div className="p-4 rounded-full bg-white/5 mb-4">
                    <BellOff
                      size={32}
                      strokeWidth={1.5}
                      className="opacity-20"
                    />
                  </div>
                  <p className="text-xs font-medium">Tudo limpo por aqui!</p>
                </div>
              ) : (
                data.notifications.map((n: any) => (
                  <motion.div
                    layout
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      n.read
                        ? "bg-transparent border-transparent opacity-60 hover:bg-white/[0.02]"
                        : "bg-white/[0.04] border-white/10 shadow-lg hover:border-purple-500/30"
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Avatar com Badge de Tipo */}
                      <div className="relative flex-shrink-0">
                        {n.senderAvatar ? (
                          <img
                            src={n.senderAvatar}
                            alt={n.senderName}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center border border-purple-500/30">
                            <User size={18} className="text-purple-400" />
                          </div>
                        )}
                        {/* Mini Ícone de Status */}
                        <div className="absolute -bottom-1 -right-1 bg-[#18181b] rounded-full p-1 border border-white/10 shadow-black shadow-sm">
                          {icons[n.type as keyof typeof icons] || icons.system}
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[13px] font-bold text-zinc-100 truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 whitespace-nowrap mt-0.5 font-medium">
                            {n.createdAt?.toDate
                              ? formatDistanceToNow(n.createdAt.toDate(), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })
                              : "agora"}
                          </span>
                        </div>
                        <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>

                        {/* Ações ao Hover */}
                        <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.markAsRead(n.id);
                              }}
                              className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-tighter"
                            >
                              <Check size={12} strokeWidth={3} /> Marcar lida
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.deleteNotif(n.id);
                            }}
                            className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-red-400 font-bold uppercase tracking-tighter transition-colors"
                          >
                            <Trash2 size={12} strokeWidth={2} /> Excluir
                          </button>
                        </div>
                      </div>

                      {/* Indicador de não lida */}
                      {!n.read && (
                        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer opcional */}
            <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
              <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest">
                Painel de Atividades
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
