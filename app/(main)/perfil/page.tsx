"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import {
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  User,
  Mail,
  Lock,
  LogOut,
  Camera,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Zap,
  BarChart3,
  ShieldCheck,
  Palette,
  Bell,
  Github,
  Linkedin,
  Instagram,
  Activity,
  Briefcase,
  Monitor,
  Smartphone,
  Slack,
  Sun,
  Moon,
  Layout,
  TrendingUp,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTE DE TOGGLE (SWITCH) ---
const Toggle = ({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-10 h-6 rounded-full flex items-center transition-all px-1 ${active ? "bg-indigo-500" : "bg-white/10"}`}
  >
    <div
      className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${active ? "translate-x-4" : "translate-x-0"}`}
    />
  </button>
);

export default function UserProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados Base
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "general" | "preferences" | "stats" | "security"
  >("general");

  // Estados do Formulário
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [joinedAt, setJoinedAt] = useState<string>("");

  // Redes Sociais
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [instagram, setInstagram] = useState("");

  // Preferências
  const [statusEmoji, setStatusEmoji] = useState("💻");
  const [statusText, setStatusText] = useState("Focado");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [notifAssign, setNotifAssign] = useState(true);
  const [notifMention, setNotifMention] = useState(true);
  const [notifStatus, setNotifStatus] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [density, setDensity] = useState("detailed");

  // UI
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
        setEmail(currentUser.email || "");
        setPhotoURL(
          currentUser.photoURL ||
            `https://ui-avatars.com/api/?name=${currentUser.email}&background=0D0D0D&color=fff`,
        );

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setRole(data.role || "");
            setStatusEmoji(data.statusEmoji || "💻");
            setStatusText(data.statusText || "");
            setLinkedin(data.socials?.linkedin || "");
            setGithub(data.socials?.github || "");
            setInstagram(data.socials?.instagram || "");
            setTimezone(data.timezone || "America/Sao_Paulo");

            if (data.joinedAt) {
              const date = data.joinedAt.toDate
                ? data.joinedAt.toDate()
                : new Date(data.joinedAt);
              setJoinedAt(
                date.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
              );
            }

            if (data.notifications) {
              setNotifAssign(data.notifications.assign ?? true);
              setNotifMention(data.notifications.mention ?? true);
              setNotifStatus(data.notifications.status ?? false);
            }
            if (data.ui) {
              setTheme(data.ui.theme || "dark");
              setDensity(data.ui.density || "detailed");
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        }
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          name: displayName,
          role,
          statusEmoji,
          statusText,
          timezone,
          socials: { linkedin, github, instagram },
          notifications: {
            assign: notifAssign,
            mention: notifMention,
            status: notifStatus,
          },
          ui: { theme, density },
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      showToast("Perfil atualizado com sucesso!");
    } catch (error) {
      showToast("Erro ao salvar perfil.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await updateProfile(auth.currentUser!, { photoURL: base64String });
        await setDoc(
          doc(db, "users", auth.currentUser!.uid),
          { photoURL: base64String },
          { merge: true },
        );
        setPhotoURL(base64String);
        showToast("Foto atualizada!");
      } catch {
        showToast("Erro no upload.", "error");
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 size={48} className="text-indigo-500 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 p-8 pb-32 relative custom-scrollbar w-full">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div
              className={`flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-md ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span className="text-sm font-bold">{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-[1000px] mx-auto mb-10 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Meu Perfil
          </h1>
          <p className="text-zinc-500 text-sm">
            Gerencie sua identidade, preferências e conexões.
          </p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}{" "}
          Salvar Perfil
        </button>
      </div>

      <div className="w-full max-w-[1000px] mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <nav className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <TabButton
            icon={<User size={18} />}
            label="Geral"
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
          />
          <TabButton
            icon={<Palette size={18} />}
            label="Preferências"
            active={activeTab === "preferences"}
            onClick={() => setActiveTab("preferences")}
          />
          <TabButton
            icon={<BarChart3 size={18} />}
            label="Estatísticas"
            active={activeTab === "stats"}
            onClick={() => setActiveTab("stats")}
          />
          <TabButton
            icon={<ShieldCheck size={18} />}
            label="Segurança & Apps"
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          />
        </nav>

        {/* Tab Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {/* --- ABA GERAL --- */}
            {activeTab === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* BLOCO 1: INFORMAÇÕES PESSOAIS */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center mb-8">
                    <div
                      className="relative group cursor-pointer shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-800 flex items-center justify-center">
                        {isUploadingLogo ? (
                          <Loader2
                            size={32}
                            className="animate-spin text-indigo-400"
                          />
                        ) : (
                          <img
                            src={photoURL}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                        <Camera size={24} className="text-white" />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {displayName || "Desenvolvedor"}
                      </h2>
                      <p className="text-zinc-500 text-sm mb-2">{email}</p>
                      {joinedAt && (
                        <p className="text-indigo-400/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} /> Membro desde {joinedAt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Nome Completo
                      </label>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Cargo / Especialidade
                      </label>
                      <div className="relative">
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            Selecione...
                          </option>
                          <option value="Frontend Developer">
                            Frontend Developer
                          </option>
                          <option value="Backend Developer">
                            Backend Developer
                          </option>
                          <option value="Fullstack Developer">
                            Fullstack Developer
                          </option>
                          <option value="UI/UX Designer">UI/UX Designer</option>
                          <option value="Product Manager">
                            Product Manager
                          </option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOCO 2: REDES SOCIAIS E LINKS (SEPARADO) */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap size={18} className="text-indigo-400" /> Presença
                      Digital
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      Conecte seus perfis para a equipe te encontrar facilmente.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Input LinkedIn */}
                    <div className="flex items-center gap-4 bg-[#050505] border border-white/5 p-2 pr-4 rounded-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all group">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-500 group-focus-within:text-blue-400 group-focus-within:bg-blue-500/10 transition-colors">
                        <Linkedin size={20} />
                      </div>
                      <div className="flex-1 py-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-focus-within:text-blue-400 transition-colors">
                          LinkedIn
                        </label>
                        <input
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="linkedin.com/in/seu-perfil"
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-700 mt-0.5"
                        />
                      </div>
                    </div>

                    {/* Input GitHub */}
                    <div className="flex items-center gap-4 bg-[#050505] border border-white/5 p-2 pr-4 rounded-2xl focus-within:border-white/20 focus-within:ring-4 focus-within:ring-white/5 transition-all group">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-500 group-focus-within:text-white group-focus-within:bg-white/10 transition-colors">
                        <Github size={20} />
                      </div>
                      <div className="flex-1 py-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-focus-within:text-white transition-colors">
                          GitHub
                        </label>
                        <input
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="github.com/usuario"
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-700 mt-0.5"
                        />
                      </div>
                    </div>

                    {/* Input Instagram */}
                    <div className="flex items-center gap-4 bg-[#050505] border border-white/5 p-2 pr-4 rounded-2xl focus-within:border-pink-500/50 focus-within:ring-4 focus-within:ring-pink-500/10 transition-all group">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-500 group-focus-within:text-pink-500 group-focus-within:bg-pink-500/10 transition-colors">
                        <Instagram size={20} />
                      </div>
                      <div className="flex-1 py-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-focus-within:text-pink-500 transition-colors">
                          Instagram
                        </label>
                        <input
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@seu.perfil"
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-700 mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- ABA PREFERÊNCIAS --- */}
            {activeTab === "preferences" && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Status & Fuso Horário */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-400" />{" "}
                    Disponibilidade
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                        Status Atual
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={statusEmoji}
                          onChange={(e) => setStatusEmoji(e.target.value)}
                          maxLength={2}
                          className="w-16 bg-[#050505] border border-white/10 rounded-xl text-center text-xl outline-none focus:border-indigo-500"
                        />
                        <input
                          value={statusText}
                          onChange={(e) => setStatusText(e.target.value)}
                          className="flex-1 bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                        Fuso Horário
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none cursor-pointer appearance-none"
                      >
                        <option value="America/Sao_Paulo">
                          Brasília (GMT-3)
                        </option>
                        <option value="Europe/Lisbon">Lisboa (GMT+0)</option>
                        <option value="UTC">Universal (UTC)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notificações */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Bell size={18} className="text-indigo-400" /> Notificações
                    de E-mail
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-white">
                          Tarefas Atribuídas
                        </p>
                        <p className="text-xs text-zinc-500">
                          Avisar quando eu receber novas demandas.
                        </p>
                      </div>
                      <Toggle
                        active={notifAssign}
                        onClick={() => setNotifAssign(!notifAssign)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-white">
                          Menções em Chat
                        </p>
                        <p className="text-xs text-zinc-500">
                          Notificar quando meu @ for citado.
                        </p>
                      </div>
                      <Toggle
                        active={notifMention}
                        onClick={() => setNotifMention(!notifMention)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-white">
                          Mudança de Status
                        </p>
                        <p className="text-xs text-zinc-500">
                          Avisar quando moverem as minhas tarefas.
                        </p>
                      </div>
                      <Toggle
                        active={notifStatus}
                        onClick={() => setNotifStatus(!notifStatus)}
                      />
                    </div>
                  </div>
                </div>

                {/* Interface */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Layout size={18} className="text-indigo-400" /> Interface
                    (Quadro)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Tema
                      </label>
                      <div className="flex bg-[#050505] border border-white/5 rounded-xl p-1">
                        <button
                          onClick={() => setTheme("dark")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${theme === "dark" ? "bg-white/10 text-white" : "text-zinc-500"}`}
                        >
                          <Moon size={14} /> Escuro
                        </button>
                        <button
                          onClick={() => setTheme("light")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${theme === "light" ? "bg-white/10 text-white" : "text-zinc-500"}`}
                        >
                          <Sun size={14} /> Claro
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Densidade de Cards
                      </label>
                      <div className="flex bg-[#050505] border border-white/5 rounded-xl p-1">
                        <button
                          onClick={() => setDensity("compact")}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${density === "compact" ? "bg-white/10 text-white" : "text-zinc-500"}`}
                        >
                          Compacto
                        </button>
                        <button
                          onClick={() => setDensity("detailed")}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${density === "detailed" ? "bg-white/10 text-white" : "text-zinc-500"}`}
                        >
                          Detalhado
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- ABA ESTATÍSTICAS --- */}
            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />
                    <CheckCircle2 size={24} className="text-indigo-400 mb-4" />
                    <h4 className="text-4xl font-black text-white mb-1">124</h4>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Tarefas Concluídas
                    </p>
                  </div>
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full" />
                    <Zap size={24} className="text-emerald-400 mb-4" />
                    <h4 className="text-4xl font-black text-white mb-1">450</h4>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Story Points
                    </p>
                  </div>
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <Activity size={24} className="text-amber-400 mb-4" />
                    <h4 className="text-4xl font-black text-white mb-1">
                      12 <span className="text-lg text-zinc-500">dias</span>
                    </h4>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Sequência de Entregas
                    </p>
                  </div>
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <Briefcase size={24} className="text-purple-400 mb-4" />
                    <h4 className="text-4xl font-black text-white mb-1">4</h4>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Projetos Ativos
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- ABA SEGURANÇA E INTEGRAÇÕES --- */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Lock size={18} className="text-indigo-400" /> Acesso e
                    Senha
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-[#050505] border border-white/5 rounded-2xl mb-4 gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Redefinir Senha
                      </p>
                      <p className="text-xs text-zinc-500">
                        Enviaremos um link de recuperação para o seu email.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await sendPasswordResetEmail(auth, email);
                          showToast("E-mail enviado!");
                        } catch {
                          showToast("Erro.", "error");
                        }
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0"
                    >
                      Enviar E-mail
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">
                      Sessões Ativas
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <Monitor size={20} className="text-indigo-400" />
                          <div>
                            <p className="text-sm font-bold text-white">
                              Computador Local • Chrome
                            </p>
                            <p className="text-xs text-indigo-400">
                              Sessão Atual
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <Smartphone size={20} className="text-zinc-500" />
                          <div>
                            <p className="text-sm font-bold text-zinc-300">
                              Telemóvel • Safari
                            </p>
                            <p className="text-xs text-zinc-600">
                              Último acesso ontem
                            </p>
                          </div>
                        </div>
                        <button className="text-[10px] font-black uppercase text-zinc-600 hover:text-red-400 transition-colors">
                          Sair
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Zap size={18} className="text-indigo-400" /> Integrações
                    Pessoais
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-[#050505] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <Slack size={24} className="text-white" />
                        <div>
                          <p className="text-sm font-bold text-white">Slack</p>
                          <p className="text-xs text-zinc-500">
                            Receba notificações via DM.
                          </p>
                        </div>
                      </div>
                      <button className="bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/5">
                        Conectar
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-[#050505] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <Calendar size={24} className="text-white" />
                        <div>
                          <p className="text-sm font-bold text-white">
                            Google Calendar
                          </p>
                          <p className="text-xs text-zinc-500">
                            Sincronize prazos das tarefas.
                          </p>
                        </div>
                      </div>
                      <button className="bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/5">
                        Conectar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => {
                      if (confirm("Deseja sair?")) {
                        signOut(auth);
                        router.push("/login");
                      }
                    }}
                    className="w-full flex justify-center items-center gap-2 px-4 py-4 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <LogOut size={16} /> Sair da Conta
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-[13px] font-bold transition-all ${active ? "bg-white/5 text-white border border-white/10 shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent"}`}
    >
      <div className={active ? "text-indigo-400" : "text-zinc-600"}>{icon}</div>
      {label}
    </button>
  );
}
