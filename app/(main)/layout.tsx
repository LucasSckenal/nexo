"use client";

import { useState, useEffect, useRef } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataProvider, useData } from "../context/DataContext";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
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
  UserPlus,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
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
  const user = auth.currentUser;

  // ESTADOS DO CHAT GLOBAL
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMember, setChatMember] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LÓGICA DO CHAT FIREBASE
  useEffect(() => {
    if (!chatMember || !auth.currentUser) return;

    const roomIds = [
      auth.currentUser.uid,
      chatMember.id || chatMember.email,
    ].sort();
    const chatId = `${roomIds[0]}_${roomIds[1]}`;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    });

    return () => unsubscribe();
  }, [chatMember]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatMember || !auth.currentUser) return;

    setIsSending(true);
    const roomIds = [
      auth.currentUser.uid,
      chatMember.id || chatMember.email,
    ].sort();
    const chatId = `${roomIds[0]}_${roomIds[1]}`;

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };

  const chatContacts =
    activeProject?.members?.filter((m: any) => m.email !== user?.email) || [];


  useEffect(() => {
    // --- NOVO: Listener para abrir o chat vindo de qualquer página ---
    const handleOpenGlobalChat = (e: any) => {
      setChatMember(e.detail);
      setIsChatOpen(true);
    };
    window.addEventListener("open-global-chat", handleOpenGlobalChat);

    // Cleanup do listener
    return () => {
      window.removeEventListener("open-global-chat", handleOpenGlobalChat);
    };
  }, []);
    
  return (
    <>
      <aside
        className={`relative z-50 shrink-0 h-full flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* LOGO */}
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

        {/* BOTAO COLAPSAR */}
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

        {/* SELETOR DE PROJETO */}
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

        {/* BUSCA */}
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

        {/* NAVEGAÇÃO PRINCIPAL */}
        <div className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1">
            <NavItem
              href="/"
              icon={<LayoutDashboard size={18} />}
              label="Visão Geral"
              active={pathname === "/"}
              collapsed={isCollapsed}
            />
            <NavItem
              href="/backlog"
              icon={<ListTodo size={18} />}
              label="Backlog"
              active={pathname === "/backlog"}
              collapsed={isCollapsed}
            />
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
                pathname === "/members" || pathname?.startsWith("/members/")
              }
              collapsed={isCollapsed}
            />

            {/* BOTÃO DO CHAT GLOBAL */}
            <button
              onClick={() => setIsChatOpen(true)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 group text-zinc-500 hover:text-zinc-200 w-full ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <div className="relative z-10 flex items-center gap-3 transition-all group-hover:scale-105">
                <MessageCircle size={18} />
                {!isCollapsed && <span>Mensagens</span>}
              </div>
            </button>
          </nav>

          {/* ADMINISTRAÇÃO */}
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

        {/* PERFIL RODAPÉ */}
        <div className="p-3 mt-auto relative">
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all group ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="relative shrink-0">
              <img
                src={user?.photoURL || "https://i.pravatar.cc/150"}
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-[#050505] border-l border-white/5 shadow-2xl z-[200] flex flex-col"
            >
              {/* === TELA 1: LISTA DE CONTATOS === */}
              {!chatMember ? (
                <>
                  <div className="p-6 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        Mensagens
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1">
                        Converse com sua equipe
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsChatOpen(false);
                        setChatMember(null);
                      }}
                      className="p-2.5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white rounded-xl transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#050505]">
                    {chatContacts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden">
                        {/* Efeito de luz de fundo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

                        {/* Composição Visual */}
                        <div className="relative mb-10 flex items-center justify-center w-32 h-32">
                          {/* Avatares fantasmas flutuantes */}
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="absolute -left-2 top-0 w-12 h-12 rounded-full border border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md flex items-center justify-center shadow-2xl z-10"
                          >
                            <User size={18} className="text-zinc-600" />
                          </motion.div>

                          <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 1,
                            }}
                            className="absolute -right-4 bottom-2 w-14 h-14 rounded-full border border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md flex items-center justify-center shadow-2xl z-30"
                          >
                            <Users size={20} className="text-zinc-500" />
                          </motion.div>

                          {/* Ícone Central */}
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A1A24] to-[#0A0A0A] border border-indigo-500/20 flex items-center justify-center relative z-20 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
                            <div className="absolute inset-0 rounded-full border border-white/5" />
                            <MessageCircle
                              size={36}
                              className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            />
                          </div>
                        </div>

                        {/* Textos */}
                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3 tracking-tight">
                          Seu chat está vazio
                        </h3>
                        <p className="text-sm text-zinc-500 mb-10 max-w-[260px] leading-relaxed">
                          A colaboração em tempo real muda tudo. Convide sua
                          equipe e comece a debater ideias.
                        </p>

                        {/* Botão Call to Action (CTA) */}
                        <Link
                          href="/membros"
                          onClick={() => setIsChatOpen(false)}
                          className="group relative px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 hover:bg-indigo-500 border border-indigo-400/30"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                          <UserPlus size={18} />
                          <span>Convidar Equipe</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 space-y-2">
                        {chatContacts.map((contact: any) => (
                          <button
                            key={contact.email}
                            onClick={() => setChatMember(contact)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.04] rounded-2xl transition-all group border border-transparent hover:border-white/5"
                          >
                            <div className="relative shrink-0">
                              <img
                                src={
                                  contact.photoURL ||
                                  `https://ui-avatars.com/api/?name=${contact.name}&background=18181B&color=fff`
                                }
                                className="w-12 h-12 rounded-full border border-white/10 shadow-lg object-cover"
                              />
                              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-[#0A0A0A]" />
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                              <h4 className="text-sm font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors truncate">
                                {contact.name}
                              </h4>
                              <p className="text-xs text-zinc-500 truncate mt-0.5">
                                {contact.role || "Membro da Equipe"}
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center group-hover:bg-indigo-500 text-zinc-500 group-hover:text-white transition-all shadow-sm">
                              <MessageCircle size={14} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* === TELA 2: DENTRO DO CHAT (MENSAGENS) === */
                <div className="flex flex-col h-full bg-[#050505] relative">
                  {/* HEADER DO CHAT PREMIUM */}
                  <div className="p-4 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setChatMember(null)}
                        className="p-2 -ml-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <div className="relative cursor-pointer">
                        <img
                          src={
                            chatMember.photoURL ||
                            `https://ui-avatars.com/api/?name=${chatMember.name}&background=18181B&color=fff`
                          }
                          className="w-10 h-10 rounded-full border border-white/10 object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm leading-tight">
                          {chatMember.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <p className="text-zinc-500 text-[11px] font-medium">
                            Online agora
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all hidden sm:flex">
                        <Phone size={18} />
                      </button>
                      <button className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all hidden sm:flex">
                        <Video size={18} />
                      </button>
                      <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  {/* ÁREA DE MENSAGENS */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 relative">
                    {messages.length > 0 && (
                      <div className="flex justify-center mb-6">
                        <span className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-[10px] text-zinc-500 font-bold tracking-widest uppercase shadow-sm">
                          Hoje
                        </span>
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                        <div className="w-20 h-20 bg-indigo-500/5 rounded-full flex items-center justify-center border border-indigo-500/10">
                          <MessageCircle
                            size={32}
                            className="text-indigo-400/50"
                          />
                        </div>
                        <div className="text-center">
                          <h4 className="text-white font-bold text-sm">
                            Diga Olá!
                          </h4>
                          <p className="text-xs mt-1">
                            Envie a primeira mensagem para{" "}
                            {chatMember.name.split(" ")[0]}
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = msg.senderId === auth.currentUser?.uid;
                        // Verifica se a mensagem anterior foi da mesma pessoa para agrupar visualmente (opcional)
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const isSameSenderAsPrev =
                          prevMsg && prevMsg.senderId === msg.senderId;

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isSameSenderAsPrev ? "mt-1" : "mt-6"}`}
                          >
                            <div className="flex items-end gap-2 max-w-[85%]">
                              {!isMe && !isSameSenderAsPrev && (
                                <img
                                  src={
                                    chatMember.photoURL ||
                                    `https://ui-avatars.com/api/?name=${chatMember.name}&background=18181B&color=fff`
                                  }
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mb-1 opacity-70"
                                />
                              )}
                              {!isMe && isSameSenderAsPrev && (
                                <div className="w-6 shrink-0" />
                              )}

                              <div
                                className={`px-4 py-3 text-[13px] leading-relaxed shadow-sm
                                ${
                                  isMe
                                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm"
                                    : "bg-white/[0.04] border border-white/5 text-zinc-200 rounded-2xl rounded-tl-sm"
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>

                            <span
                              className={`text-[9px] text-zinc-600 font-medium px-1 mt-1.5 flex items-center gap-1 ${isMe ? "mr-1" : "ml-9"}`}
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
                                <Check size={10} className="text-indigo-400" />
                              )}
                            </span>
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* ÁREA DE DIGITAÇÃO (INPUT PREMIUM) */}
                  <div className="p-4 bg-[#0A0A0A] border-t border-white/5 z-20">
                    <form
                      onSubmit={handleSendMessage}
                      className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white/[0.05] transition-all shadow-inner"
                    >
                      <button
                        type="button"
                        className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors shrink-0"
                      >
                        <Paperclip size={18} />
                      </button>

                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mensagem..."
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none"
                      />

                      <div className="flex items-center gap-1 pr-1 shrink-0">
                        <button
                          type="button"
                          className="p-2 text-zinc-500 hover:text-white transition-colors hidden sm:block"
                        >
                          <Smile size={18} />
                        </button>
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || isSending}
                          className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${!newMessage.trim() ? "bg-white/5 text-zinc-500" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20"}`}
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
