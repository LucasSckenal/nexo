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
import Image from "next/image";

// Mapeamento de ícones por tipo de notificação
const icons = {
  mention: (
    <MessageSquare size={12} className="text-blue-500 dark:text-blue-400" />
  ),
  status: (
    <AlertCircle size={12} className="text-amber-500 dark:text-amber-400" />
  ),
  assignment: (
    <Briefcase size={12} className="text-emerald-500 dark:text-emerald-400" />
  ),
  system: <User size={12} className="text-accentPurple" />,
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
    onSelectTask: (taskId: string) => void;
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
            className="fixed inset-0 z-[150] bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed right-6 top-20 w-[380px] z-[200] bg-bgSurface/95 backdrop-blur-2xl border border-borderSubtle rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-borderSubtle flex items-center justify-between bg-bgSurfaceHover/50">
              <div>
                <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
                  Notificações
                </h3>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  {data.unreadCount > 0
                    ? `Você tem ${data.unreadCount} novas atualizações`
                    : "Nenhuma novidade por enquanto"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {data.unreadCount > 0 && (
                  <button
                    onClick={actions.markAllAsRead}
                    className="text-[11px] font-semibold text-accentPurple hover:opacity-80 transition-opacity"
                  >
                    Ler tudo
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-textSecondary hover:text-textPrimary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[500px] p-3 space-y-2 custom-scrollbar">
              {data.notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-textSecondary">
                  <div className="p-4 rounded-full bg-bgSurfaceHover mb-4">
                    <BellOff
                      size={32}
                      strokeWidth={1.5}
                      className="opacity-40"
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
                        ? "bg-transparent border-transparent opacity-60 hover:bg-bgSurfaceHover"
                        : "bg-bgMain border-borderSubtle shadow-sm hover:border-accentPurple/50"
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Avatar com Badge de Tipo */}
                      <div className="relative h-10 w-10 flex-shrink-0">
                        {n.senderPhoto ? (
                          <Image
                            src={n.senderPhoto}
                            alt={n.senderName}
                            fill
                            className="rounded-full object-cover border border-borderSubtle"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-bgSurfaceHover flex items-center justify-center border border-borderSubtle">
                            <User size={16} className="text-textSecondary" />
                          </div>
                        )}
                        {/* Ícone de notificação sobreposto */}
                        <div className="absolute -bottom-1 -right-1 p-1 bg-bgSurface rounded-full border border-borderSubtle">
                          {icons[n.type as keyof typeof icons]}
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[13px] font-bold text-textPrimary truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-textSecondary whitespace-nowrap mt-0.5 font-medium">
                            {n.createdAt?.toDate
                              ? formatDistanceToNow(n.createdAt.toDate(), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })
                              : "agora"}
                          </span>
                        </div>
                        <p className="text-[12px] text-textSecondary mt-1 leading-relaxed line-clamp-2">
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
                              className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-tighter hover:opacity-80"
                            >
                              <Check size={12} strokeWidth={3} /> Marcar lida
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.deleteNotif(n.id);
                            }}
                            className="flex items-center gap-1.5 text-[10px] text-textSecondary hover:text-red-500 font-bold uppercase tracking-tighter transition-colors"
                          >
                            <Trash2 size={12} strokeWidth={2} /> Excluir
                          </button>
                        </div>
                      </div>

                      {/* Indicador de não lida */}
                      {!n.read && (
                        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-accentPurple rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-bgSurfaceHover/30 border-t border-borderSubtle text-center">
              <p className="text-[9px] text-textSecondary font-medium uppercase tracking-widest">
                Painel de Atividades
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
