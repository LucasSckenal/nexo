"use client";

import { useState, useEffect, useRef } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataProvider, useData } from "../context/DataContext";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../globals.css";
import {
  LayoutDashboard,
  Kanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  LogOut,
  ListTodo,
  Activity,
  Search,
  User,
  Users,
  MessageCircle,
  X,
  Send,
  Loader2,
  ArrowLeft,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  FileText,
  CheckCheck,
  Plus,
  Copy,
  Trash2,
  Edit2,
  LogOut as LogOutIcon,
  Camera,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-[#000000] text-[#FAFAFA] antialiased`}
      >
        <DataProvider>
          <div className="flex w-full h-screen overflow-hidden p-3 gap-3 relative">
            <LayoutContent>{children}</LayoutContent>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { projects, activeProject, setActiveProject } = useData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const pathname = usePathname();

  // === ESTADOS DE AUTENTICAÇÃO E UTILIZADORES GLOBAIS ===
  const [user, setUser] = useState<any>(null);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGlobalUsers(usersData);
    });
    return () => unsubscribe();
  }, [user]);

  // === ESTADOS DO CHAT ===
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMember, setChatMember] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [chatPreviews, setChatPreviews] = useState<Record<string, any>>({});
  const [activeToast, setActiveToast] = useState<{
    id: number;
    sender: any;
    text: string;
  } | null>(null);

  // === ESTADOS PARA MENUS DE CONTEXTO E MODAIS ===
  const [contextMenu, setContextMenu] = useState<{
    msg: any;
    x: number;
    y: number;
  } | null>(null);
  const [contactContextMenu, setContactContextMenu] = useState<{
    chat: any;
    x: number;
    y: number;
  } | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>(
    [],
  );

  // 3 Pontos (Menu do Chat)
  const [isChatOptionsMenuOpen, setIsChatOptionsMenuOpen] = useState(false);

  // Edição do Grupo
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupPhoto, setEditGroupPhoto] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Fechar os menus ao clicar fora
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setContactContextMenu(null);
      setIsChatOptionsMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const globalUsersRef = useRef(globalUsers);
  const isChatOpenRef = useRef(isChatOpen);
  const chatMemberRef = useRef(chatMember);

  useEffect(() => {
    globalUsersRef.current = globalUsers;
  }, [globalUsers]);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);
  useEffect(() => {
    chatMemberRef.current = chatMember;
  }, [chatMember]);

  const getChatId = (member: any) => {
    if (!member || !user?.uid) return "";
    if (member.isGroup) return member.id;
    const id1 = user.uid;
    const id2 = member.id || member.uid || member.email;
    return [id1, id2].sort().join("_");
  };

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const previews: Record<string, any> = {};
      snapshot.docs.forEach((doc) => {
        previews[doc.id] = { id: doc.id, ...doc.data() };
      });
      setChatPreviews(previews);

      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data();
          if (data.unread && data.lastSenderId !== user.uid) {
            const currentChatMember = chatMemberRef.current;
            const isThisChatOpen =
              isChatOpenRef.current &&
              currentChatMember &&
              change.doc.id === getChatId(currentChatMember);

            if (!isThisChatOpen) {
              const sender = data.isGroup
                ? { name: data.name, isGroup: true, id: change.doc.id }
                : globalUsersRef.current.find(
                    (u: any) =>
                      u.id === data.lastSenderId || u.uid === data.lastSenderId,
                  );
              if (sender) {
                setActiveToast({
                  id: Date.now(),
                  sender: sender,
                  text: data.lastMessage,
                });
              }
            }
          }
        }
      });
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  useEffect(() => {
    if (!chatMember || !user?.uid) return;
    const chatId = getChatId(chatMember);

    if (chatMember.isGroup && chatPreviews[chatId]) {
      setChatMember((prev: any) => ({ ...prev, ...chatPreviews[chatId] }));
    }

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );

      if (
        chatPreviews[chatId]?.unread &&
        chatPreviews[chatId]?.lastSenderId !== user.uid
      ) {
        setDoc(doc(db, "chats", chatId), { unread: false }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, [chatMember?.id, user, chatPreviews]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatMember || !user?.uid) return;

    setIsSending(true);
    const chatId = getChatId(chatMember);
    const messageText = newMessage;
    const id1 = user.uid;
    const id2 = chatMember.id || chatMember.uid || chatMember.email;
    const participants = chatMember.isGroup
      ? chatMember.participants
      : [id1, id2];

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: messageText,
          lastMessageAt: serverTimestamp(),
          participants,
          lastSenderId: user.uid,
          unread: true,
        },
        { merge: true },
      );

      setNewMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatMember || !user?.uid) return;

    setIsUploadingFile(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const isImage = file.type.startsWith("image/");
      const previewText = isImage ? "📷 Imagem enviada" : `📎 ${file.name}`;

      const chatId = getChatId(chatMember);
      const id1 = user.uid;
      const id2 = chatMember.id || chatMember.uid || chatMember.email;
      const participants = chatMember.isGroup
        ? chatMember.participants
        : [id1, id2];

      try {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: previewText,
          fileData: base64Data,
          fileName: file.name,
          fileType: file.type,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        });

        await setDoc(
          doc(db, "chats", chatId),
          {
            lastMessage: previewText,
            lastMessageAt: serverTimestamp(),
            participants,
            lastSenderId: user.uid,
            unread: true,
          },
          { merge: true },
        );

        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        console.error("Erro ao enviar arquivo:", error);
      } finally {
        setIsUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupMembers.length === 0 || !user?.uid)
      return;

    try {
      const participants = [user.uid, ...selectedGroupMembers];
      await addDoc(collection(db, "chats"), {
        isGroup: true,
        name: groupName,
        photoURL: "",
        participants,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: "Grupo criado",
        unread: false,
      });
      setShowGroupModal(false);
      setGroupName("");
      setSelectedGroupMembers([]);
    } catch (err) {
      console.error("Erro ao criar grupo", err);
    }
  };

  const handleDeleteChat = async (chat: any) => {
    if (!chat) return;
    const chatId = getChatId(chat);
    try {
      await deleteDoc(doc(db, "chats", chatId));
      if (chatMember && getChatId(chatMember) === chatId) {
        setChatMember(null);
      }
    } catch (err) {
      console.error("Erro ao apagar conversa:", err);
    }
  };

  // Funções de Edição do Grupo
  const openEditGroupModal = () => {
    setEditGroupName(chatMember?.name || "");
    setEditGroupPhoto(chatMember?.photoURL || "");
    setShowEditGroupModal(true);
  };

  const handleGroupPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditGroupPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveGroupChanges = async () => {
    if (!chatMember || !chatMember.isGroup || !editGroupName.trim()) return;
    setIsSavingGroup(true);
    try {
      await updateDoc(doc(db, "chats", chatMember.id), {
        name: editGroupName,
        photoURL: editGroupPhoto,
      });
      setShowEditGroupModal(false);
    } catch (error) {
      console.error("Erro ao atualizar grupo", error);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const deleteMessage = async (msgId: string) => {
    if (!chatMember) return;
    const chatId = getChatId(chatMember);
    await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
  };

  useEffect(() => {
    const handleOpenGlobalChat = (e: any) => {
      setChatMember(e.detail);
      setIsChatOpen(true);
    };
    window.addEventListener("open-global-chat", handleOpenGlobalChat);
    return () =>
      window.removeEventListener("open-global-chat", handleOpenGlobalChat);
  }, []);

  // Montagem da lista combinada de contatos
  const chatContacts = [
    ...globalUsers
      .filter((u: any) => u.email !== user?.email && u.id !== user?.uid)
      .map((contact: any) => {
        const chatId = [user?.uid, contact.id].sort().join("_");
        const chatData = chatPreviews[chatId] || {};
        return {
          ...contact,
          chatId,
          isGroup: false,
          lastMessage: chatData.lastMessage || "",
          lastMessageAt: chatData.lastMessageAt?.toMillis() || 0,
          unread: chatData.unread && chatData.lastSenderId !== user?.uid,
        };
      }),
    ...Object.values(chatPreviews)
      .filter((c: any) => c.isGroup)
      .map((group: any) => ({
        ...group,
        lastMessageAt: group.lastMessageAt?.toMillis() || 0,
        unread: group.unread && group.lastSenderId !== user?.uid,
      })),
  ].sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  const filteredContacts = chatContacts.filter(
    (contact: any) =>
      (contact.name || contact.displayName || "")
        .toLowerCase()
        .includes(searchContact.toLowerCase()) ||
      (contact.email || "").toLowerCase().includes(searchContact.toLowerCase()),
  );

  const hasGlobalUnread = chatContacts.some((chat: any) => chat.unread);

  return (
    <>
      {/* MENU LATERAL PRINCIPAL */}
      <aside
        className={`relative z-50 shrink-0 h-full flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? "w-16" : "w-64"}`}
      >
        <div className="px-4 h-20 flex items-center">
          <div
            className={`flex items-center w-full transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
          >
            <Image
              src={isCollapsed ? "/Nexo_small_icon.png" : "/Nexo_icon.png"}
              alt="Logo"
              width={isCollapsed ? 28 : 100}
              height={32}
              className="object-contain opacity-90"
            />
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-6.5 top-10 z-[100] bg-[#0A0A0A] border border-white/10 rounded-full p-1.5 text-zinc-500 hover:text-purple-400 hover:border-purple-500/50 transition-all shadow-xl backdrop-blur-md group"
        >
          {isCollapsed ? (
            <ChevronRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          ) : (
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          )}
        </button>

        {/* SELETOR DE PROJETO TOTALMENTE RESTAURADO */}
        <div className="px-3 mb-4 relative">
          <button
            onClick={() => {
              setIsProjectOpen(!isProjectOpen);
              setIsAccountOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/[0.06] transition-all border border-white/5 ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 overflow-hidden">
              {activeProject?.imageUrl ? (
                <img
                  src={activeProject.imageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-purple-400">
                  {activeProject?.key || "NX"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[13px] font-medium text-zinc-200 truncate leading-none">
                    {activeProject?.name || "Projeto"}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1.5 leading-none">
                    Enterprise
                  </p>
                </div>
                <ChevronsUpDown size={14} className="text-zinc-600 shrink-0" />
              </>
            )}
          </button>

          <AnimatePresence>
            {isProjectOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute z-[110] bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl p-2 ${isCollapsed ? "left-full ml-4 top-0 w-64" : "left-0 right-0 top-full mt-2"}`}
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                  {projects.map((proj: any) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj);
                        setIsProjectOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white/[0.06] rounded-xl transition-all group"
                    >
                      <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 border border-white/5 bg-white/5 flex items-center justify-center text-[9px]">
                        {proj.imageUrl ? (
                          <img
                            src={proj.imageUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span style={{ color: proj.color }}>{proj.key}</span>
                        )}
                      </div>
                      <span
                        className={`flex-1 text-[13px] text-left truncate ${activeProject?.id === proj.id ? "text-purple-400 font-medium" : "text-zinc-400 group-hover:text-zinc-200"}`}
                      >
                        {proj.name}
                      </span>
                      {activeProject?.id === proj.id && (
                        <Check size={14} className="text-purple-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCollapsed && (
          <div className="px-3 mb-6">
            <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-zinc-500 hover:bg-white/[0.04] transition-all text-[12px] group">
              <Search size={14} className="group-hover:text-zinc-300" />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="text-[9px] font-mono bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/5">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        <div className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1">
            <NavItem
              href="/"
              icon={<LayoutDashboard size={18} />}
              label="Visão Geral"
              active={pathname === "/"}
              collapsed={isCollapsed}
            />

            {/* LÓGICA DE SEPARAÇÃO: Só mostra o Backlog se NÃO for de Design */}
            {activeProject?.category !== "design" && (
              <NavItem
                href="/backlog"
                icon={<ListTodo size={18} />}
                label="Backlog"
                active={pathname === "/backlog"}
                collapsed={isCollapsed}
              />
            )}
            {activeProject?.category === "design" && (
              <NavItem
                href="/clientes"
                icon={<Briefcase size={18} />}
                label="Clientes"
                active={pathname === "/clientes"}
                collapsed={isCollapsed}
              />
            )}
            <NavItem
              href="/quadros"
              icon={<Kanban size={18} />}
              label="Kanban"
              active={pathname === "/quadros"}
              collapsed={isCollapsed}
            />
            <NavItem
              href="/analises"
              icon={<Activity size={18} />}
              label="Análises"
              active={pathname === "/analises"}
              collapsed={isCollapsed}
            />
            <NavItem
              href="/members"
              icon={<Users size={18} />}
              label="Equipe"
              active={
                pathname === "/members" || pathname?.startsWith("/membros/")
              }
              collapsed={isCollapsed}
            />

            <button
              onClick={() => setIsChatOpen(true)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 group ${hasGlobalUnread ? "text-white bg-indigo-500/10 border border-indigo-500/20" : "text-zinc-500 hover:text-zinc-200"} w-full ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <div
                className={`relative z-10 flex items-center gap-3 transition-all ${hasGlobalUnread ? "text-indigo-400" : "group-hover:scale-105"}`}
              >
                <div className="relative">
                  <MessageCircle size={18} />
                  {hasGlobalUnread && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#0A0A0A] shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
                  )}
                </div>
                {!isCollapsed && (
                  <span className={hasGlobalUnread ? "font-bold" : ""}>
                    Mensagens
                  </span>
                )}
              </div>
            </button>
          </nav>

          <div>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-zinc-700 px-4 mb-2 tracking-[0.2em] uppercase">
                Administração
              </h3>
            )}
            <nav className="space-y-1">
              <NavItem
                href="/configuracoes"
                icon={<Settings size={18} />}
                label="Ajustes do Projeto"
                active={pathname === "/configuracoes"}
                collapsed={isCollapsed}
              />
              <NavItem
                href="/perfil"
                icon={<User size={18} />}
                label="Meu Perfil"
                active={pathname === "/perfil"}
                collapsed={isCollapsed}
              />
            </nav>
          </div>
        </div>

        {/* MENU DA CONTA (PERFIL/SAIR) TOTALMENTE RESTAURADO */}
        <div className="p-3 mt-auto relative">
          <button
            onClick={() => {
              setIsAccountOpen(!isAccountOpen);
              setIsProjectOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all group ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="relative shrink-0">
              <img
                src={
                  user?.photoURL ||
                  "https://ui-avatars.com/api/?name=User&background=18181B&color=fff"
                }
                className="w-8 h-8 rounded-full border border-white/10"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-black" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[13px] font-medium text-zinc-300 truncate w-full">
                  {user?.displayName?.split(" ")[0] || "Usuário"}
                </span>
                <span className="text-[10px] text-zinc-600 truncate w-full">
                  Plano Enterprise
                </span>
              </div>
            )}
          </button>

          <AnimatePresence>
            {isAccountOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute z-[100] bottom-full mb-2 bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl p-2 w-56 ${isCollapsed ? "left-full ml-4" : "left-3"}`}
              >
                <Link
                  href="/perfil"
                  onClick={() => setIsAccountOpen(false)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all mb-1"
                >
                  <User size={14} /> Acessar Perfil
                </Link>
                <button
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={14} /> Sair da conta
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DA PÁGINA */}
      <main className="flex-1 bg-[#050505] rounded-[2.5rem] border border-white/[0.05] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
        <div className="h-full overflow-y-auto custom-scrollbar p-1">
          {children}
        </div>
      </main>

      {/* MODAL DE NOVO GRUPO */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-bold">Novo Grupo</h3>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">
                    Nome do Grupo
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Time de Design"
                    className="w-full bg-[#141414] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-indigo-500/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-2 block">
                    Selecione os membros
                  </label>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 bg-[#141414] rounded-lg border border-white/5 p-2">
                    {globalUsers
                      .filter((u) => u.id !== user?.uid)
                      .map((u) => {
                        const isSelected = selectedGroupMembers.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() =>
                              setSelectedGroupMembers((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== u.id)
                                  : [...prev, u.id],
                              )
                            }
                            className={`w-full flex items-center justify-between p-2 rounded-md text-sm ${isSelected ? "bg-indigo-500/20 text-white" : "hover:bg-white/5 text-zinc-300"}`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  u.photoURL ||
                                  `https://ui-avatars.com/api/?name=${u.name}&background=18181B&color=fff`
                                }
                                className="w-6 h-6 rounded-full"
                              />
                              <span>{u.name || u.email}</span>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-indigo-400" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-white/5 flex justify-end gap-2">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName || selectedGroupMembers.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Grupo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDITAR GRUPO */}
      <AnimatePresence>
        {showEditGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-bold">Editar Grupo</h3>
                <button
                  onClick={() => setShowEditGroupModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-5 flex flex-col items-center">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => groupPhotoInputRef.current?.click()}
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-900">
                    {editGroupPhoto ? (
                      <img
                        src={editGroupPhoto}
                        alt="Group"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                        <Users size={32} className="text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                  <input
                    type="file"
                    ref={groupPhotoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleGroupPhotoChange}
                  />
                </div>

                <div className="w-full">
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">
                    Nome do Grupo
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-indigo-500/50 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-white/5 flex justify-end gap-2">
                <button
                  onClick={() => setShowEditGroupModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveGroupChanges}
                  disabled={!editGroupName.trim() || isSavingGroup}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {isSavingGroup ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === TOAST / MODAL DE NOVA MENSAGEM === */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[300] bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl p-4 w-80 cursor-pointer group"
            onClick={() => {
              setChatMember(activeToast.sender);
              setIsChatOpen(true);
              setActiveToast(null);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent rounded-2xl pointer-events-none" />
            <div className="relative flex items-start gap-3">
              <div className="relative shrink-0">
                <img
                  src={
                    activeToast.sender.photoURL ||
                    `https://ui-avatars.com/api/?name=${activeToast.sender.name || activeToast.sender.displayName}&background=18181B&color=fff`
                  }
                  className="w-10 h-10 rounded-full border border-white/10 object-cover shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-indigo-500 w-4 h-4 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
                  <MessageCircle size={8} className="text-white" />
                </div>
              </div>
              <div className="flex-1 overflow-hidden pt-0.5">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                  {activeToast.sender.name || activeToast.sender.displayName}
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                  {activeToast.text}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(null);
                }}
                className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY E GAVETA DO CHAT GLOBAL */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsChatOpen(false);
                setChatMember(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-[#030303] border-l border-white/5 shadow-2xl z-[200] flex flex-col overflow-hidden"
            >
              {!chatMember ? (
                <div
                  className="flex flex-col h-full bg-[#050505]"
                  onClick={() => setContactContextMenu(null)}
                >
                  <div className="px-6 pt-8 pb-4 border-b border-white/5 bg-[#030303]/80 backdrop-blur-2xl flex flex-col sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                          Mensagens
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                          Converse com sua equipa
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowGroupModal(true)}
                          className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-full transition-all group"
                          title="Criar Grupo"
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          onClick={() => setIsChatOpen(false)}
                          className="p-2.5 bg-white/[0.03] border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white rounded-full transition-all group"
                        >
                          <X
                            size={18}
                            className="group-hover:rotate-90 transition-transform duration-300"
                          />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                      />
                      <input
                        type="text"
                        placeholder="Buscar contacto ou grupo..."
                        value={searchContact}
                        onChange={(e) => setSearchContact(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:bg-[#1A1A1A] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar relative px-4 py-4">
                    {filteredContacts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden mt-10">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-xl">
                          <MessageCircle size={28} className="text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          Sem resultados
                        </h3>
                        <p className="text-sm text-zinc-500">
                          Nenhum chat foi encontrado.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredContacts.map((contact: any) => (
                          <button
                            key={contact.id || contact.email}
                            onClick={() => setChatMember(contact)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContactContextMenu({
                                chat: contact,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }}
                            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group border ${contact.unread ? "bg-indigo-500/10 border-indigo-500/20" : "bg-transparent border-transparent hover:bg-white/[0.04] hover:scale-[1.01]"}`}
                          >
                            <div className="relative shrink-0">
                              {contact.isGroup ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 shadow-lg flex items-center justify-center">
                                  {contact.photoURL ? (
                                    <img
                                      src={contact.photoURL}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Users
                                      size={20}
                                      className="text-indigo-400"
                                    />
                                  )}
                                </div>
                              ) : (
                                <img
                                  src={
                                    contact.photoURL ||
                                    `https://ui-avatars.com/api/?name=${contact.name}&background=18181B&color=fff`
                                  }
                                  className="w-12 h-12 rounded-full border border-white/10 shadow-lg object-cover"
                                />
                              )}
                              {contact.unread && (
                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-500 rounded-full border-[3px] border-[#050505] shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                              )}
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                              <div className="flex items-center justify-between mb-0.5">
                                <h4
                                  className={`text-[15px] truncate ${contact.unread ? "font-black text-white" : "font-bold text-zinc-200 group-hover:text-white transition-colors"}`}
                                >
                                  {contact.name ||
                                    contact.displayName ||
                                    "Utilizador"}
                                </h4>
                                {!contact.unread &&
                                  contact.lastMessageAt > 0 && (
                                    <span className="text-[10px] font-medium text-zinc-600">
                                      {new Date(
                                        contact.lastMessageAt,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                              </div>
                              <p
                                className={`text-[13px] truncate ${contact.unread ? "text-indigo-300 font-medium" : "text-zinc-500"}`}
                              >
                                {contact.lastMessage || "Iniciar conversa"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col h-full bg-[#050505] relative"
                  onClick={() => setIsChatOptionsMenuOpen(false)}
                >
                  <div className="px-5 py-4 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-2xl flex items-center justify-between absolute top-0 w-full z-20">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setChatMember(null)}
                        className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div
                        className="relative cursor-pointer"
                        onClick={() =>
                          chatMember.isGroup && openEditGroupModal()
                        }
                      >
                        {chatMember.isGroup ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                            {chatMember.photoURL ? (
                              <img
                                src={chatMember.photoURL}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users size={16} className="text-indigo-400" />
                            )}
                          </div>
                        ) : (
                          <>
                            <img
                              src={
                                chatMember.photoURL ||
                                `https://ui-avatars.com/api/?name=${chatMember.name || chatMember.displayName}&background=18181B&color=fff`
                              }
                              className="w-10 h-10 rounded-full border border-white/10 object-cover"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
                          </>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm leading-tight">
                          {chatMember.name ||
                            chatMember.displayName ||
                            "Utilizador"}
                        </h3>
                        <p className="text-emerald-500 text-[11px] font-medium mt-0.5">
                          {chatMember.isGroup
                            ? `${chatMember.participants?.length} Membros`
                            : "Online"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 relative">
                      {!chatMember.isGroup && (
                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                          <Phone size={18} />
                        </button>
                      )}
                      {!chatMember.isGroup && (
                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                          <Video size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsChatOptionsMenuOpen(!isChatOptionsMenuOpen);
                        }}
                        className={`p-2 rounded-full transition-all ${isChatOptionsMenuOpen ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* DROPDOWN DO HEADER DO CHAT */}
                      <AnimatePresence>
                        {isChatOptionsMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-12 mt-1 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[300]"
                          >
                            {chatMember.isGroup ? (
                              <>
                                <button
                                  onClick={() => {
                                    openEditGroupModal();
                                    setIsChatOptionsMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3"
                                >
                                  <Edit2 size={16} /> Editar Grupo
                                </button>
                                <button
                                  onClick={() => {
                                    setChatMember(null);
                                    setIsChatOptionsMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                                >
                                  <LogOutIcon size={16} /> Sair do Grupo
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3">
                                  <User size={16} /> Ver Perfil
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteChat(chatMember);
                                    setIsChatOptionsMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                                >
                                  <Trash2 size={16} /> Apagar Histórico
                                </button>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ÁREA DE MENSAGENS */}
                  <div
                    className="flex-1 overflow-y-auto custom-scrollbar px-5 pt-24 pb-28 space-y-2 relative"
                    onClick={() => setContextMenu(null)}
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 mt-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500/10 to-transparent flex items-center justify-center mb-6 border border-indigo-500/10 shadow-xl">
                          <MessageCircle
                            size={28}
                            className="text-indigo-400/60"
                          />
                        </div>
                        <h4 className="text-white font-bold text-lg">
                          Comece a conversar
                        </h4>
                        <p className="text-xs text-zinc-500 mt-2 text-center max-w-[200px]">
                          Diga olá para {chatMember.name?.split(" ")[0]}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.uid;
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const nextMsg =
                          index < messages.length - 1
                            ? messages[index + 1]
                            : null;

                        const isSameSenderAsPrev =
                          prevMsg && prevMsg.senderId === msg.senderId;
                        const isSameSenderAsNext =
                          nextMsg && nextMsg.senderId === msg.senderId;

                        const isOnlyImage =
                          msg.fileData &&
                          msg.fileType?.startsWith("image/") &&
                          msg.text === "📷 Imagem enviada";

                        let bubbleClasses = isMe
                          ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm"
                          : "bg-[#1A1A1A] border border-white/5 text-zinc-200 shadow-sm";

                        if (isMe) {
                          bubbleClasses += isSameSenderAsNext
                            ? " rounded-r-md"
                            : " rounded-br-sm";
                          bubbleClasses += isSameSenderAsPrev
                            ? " rounded-tr-md"
                            : " rounded-tr-2xl";
                          bubbleClasses += " rounded-l-2xl px-4 py-2.5";
                        } else {
                          bubbleClasses += isSameSenderAsNext
                            ? " rounded-l-md"
                            : " rounded-bl-sm";
                          bubbleClasses += isSameSenderAsPrev
                            ? " rounded-tl-md"
                            : " rounded-tl-2xl";
                          bubbleClasses += " rounded-r-2xl px-4 py-2.5";
                        }

                        const finalBubbleClasses = isOnlyImage
                          ? ""
                          : bubbleClasses;
                        const senderUser = chatMember.isGroup
                          ? globalUsers.find((u) => u.id === msg.senderId)
                          : null;

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isSameSenderAsPrev ? "mt-1" : "mt-6"}`}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContextMenu({
                                msg,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }}
                          >
                            {chatMember.isGroup &&
                              !isMe &&
                              !isSameSenderAsPrev &&
                              senderUser && (
                                <span className="text-[10px] text-zinc-500 font-medium ml-9 mb-1">
                                  {senderUser.name?.split(" ")[0]}
                                </span>
                              )}
                            <div className="flex items-end gap-2 max-w-[80%]">
                              {!isMe && !isSameSenderAsNext && (
                                <img
                                  src={
                                    senderUser?.photoURL ||
                                    chatMember.photoURL ||
                                    `https://ui-avatars.com/api/?name=${senderUser?.name || chatMember.name}&background=18181B&color=fff`
                                  }
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mb-1"
                                />
                              )}
                              {!isMe && isSameSenderAsNext && (
                                <div className="w-6 shrink-0" />
                              )}

                              <div
                                className={`text-[14px] leading-relaxed flex flex-col ${finalBubbleClasses}`}
                              >
                                {msg.fileData && (
                                  <div className={isOnlyImage ? "" : "mb-1"}>
                                    {msg.fileType?.startsWith("image/") ? (
                                      <img
                                        src={msg.fileData}
                                        alt="Anexo"
                                        className={`max-w-[250px] object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-xl shadow-md ${isOnlyImage ? "border-none" : "mt-1 mb-1"}`}
                                        onClick={() =>
                                          window.open(msg.fileData)
                                        }
                                      />
                                    ) : (
                                      <a
                                        href={msg.fileData}
                                        download={msg.fileName}
                                        className={`flex items-center gap-3 p-3 mt-1 rounded-xl text-xs transition-colors border shadow-sm ${isMe ? "bg-black/20 hover:bg-black/30 text-white border-white/10" : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5"}`}
                                      >
                                        <div className="p-2 bg-white/10 rounded-lg">
                                          <FileText size={16} />
                                        </div>
                                        <span className="truncate max-w-[150px] font-medium leading-tight">
                                          {msg.fileName}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                {!isOnlyImage &&
                                  (!msg.fileData ||
                                    (!msg.text.startsWith("📷 ") &&
                                      !msg.text.startsWith("📎 "))) && (
                                    <span>{msg.text}</span>
                                  )}
                              </div>
                            </div>

                            {!isSameSenderAsNext && (
                              <span
                                className={`text-[10px] text-zinc-600 font-medium px-2 mt-1 flex items-center gap-1 ${isMe ? "mr-1" : "ml-8"}`}
                              >
                                {msg.createdAt?.toDate
                                  ? msg.createdAt
                                      .toDate()
                                      .toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                  : "Enviando..."}
                                {isMe && (
                                  <CheckCheck
                                    size={12}
                                    className="text-indigo-500 ml-0.5"
                                  />
                                )}
                              </span>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="absolute bottom-6 left-5 right-5 z-20">
                    <form
                      onSubmit={handleSendMessage}
                      className="relative flex items-center bg-[#141414]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-1.5 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile}
                        className="p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all shrink-0"
                      >
                        {isUploadingFile ? (
                          <Loader2
                            size={18}
                            className="animate-spin text-indigo-500"
                          />
                        ) : (
                          <Paperclip size={18} />
                        )}
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mensagem..."
                        className="flex-1 bg-transparent px-2 py-2.5 text-[14px] text-white placeholder:text-zinc-500 outline-none"
                      />
                      <div className="flex items-center gap-1 pr-1 shrink-0">
                        <button
                          type="button"
                          className="p-3 text-zinc-400 hover:text-white transition-colors hidden sm:block rounded-full hover:bg-white/5"
                        >
                          <Smile size={18} />
                        </button>
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || isSending}
                          className={`p-3 rounded-full flex items-center justify-center transition-all ${!newMessage.trim() ? "bg-white/5 text-zinc-500" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)] hover:scale-105"}`}
                        >
                          {isSending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send
                              size={16}
                              className={
                                newMessage.trim()
                                  ? "translate-x-[1px] -translate-y-[1px]"
                                  : ""
                              }
                            />
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>

            {/* MODAL MENU DE CONTEXTO DAS MENSAGENS */}
            <AnimatePresence>
              {contextMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed z-[300] bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
                  style={{
                    top: contextMenu.y,
                    left: Math.min(contextMenu.x, window.innerWidth - 180),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col py-1">
                    {contextMenu.msg.text &&
                      !contextMenu.msg.text.startsWith("📷 ") &&
                      !contextMenu.msg.text.startsWith("📎 ") && (
                        <button
                          onClick={() => {
                            copyToClipboard(contextMenu.msg.text);
                            setContextMenu(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                        >
                          <Copy size={16} /> Copiar Texto
                        </button>
                      )}
                    {contextMenu.msg.senderId === user?.uid && (
                      <button
                        onClick={() => {
                          deleteMessage(contextMenu.msg.id);
                          setContextMenu(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-3"
                      >
                        <Trash2 size={16} /> Apagar
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MODAL MENU DE CONTEXTO DOS CONTATOS (Gaveta de Chat) */}
            <AnimatePresence>
              {contactContextMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed z-[300] bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
                  style={{
                    top: contactContextMenu.y,
                    left: Math.min(
                      contactContextMenu.x,
                      window.innerWidth - 200,
                    ),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col py-1">
                    {!contactContextMenu.chat.isGroup && (
                      <button
                        onClick={() => setContactContextMenu(null)}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                      >
                        <User size={16} /> Ver Perfil
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDeleteChat(contactContextMenu.chat);
                        setContactContextMenu(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-3"
                    >
                      <Trash2 size={16} />{" "}
                      {contactContextMenu.chat.isGroup
                        ? "Excluir Grupo"
                        : "Apagar Conversa"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({ icon, label, href, active, collapsed }: any) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 group ${active ? "text-purple-50" : "text-zinc-500 hover:text-zinc-200"} ${collapsed ? "justify-center px-0" : ""}`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.15] via-purple-500/[0.05] to-transparent border border-purple-500/20 rounded-xl"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute inset-0 bg-purple-500/5 blur-lg rounded-xl" />
        </motion.div>
      )}
      <div
        className={`relative z-10 flex items-center gap-3 transition-all ${active ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] scale-105" : "group-hover:scale-105"}`}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </div>
      {active && !collapsed && (
        <div className="absolute left-0 w-[3px] h-6 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,1)]" />
      )}
    </Link>
  );
}
