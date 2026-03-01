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
import { useTheme } from "../../context/ThemeContext";

// --- COMPONENTE DE TOGGLE (SWITCH) ---
const Toggle = ({
  active,
  onClick,
  theme,
}: {
  active: boolean;
  onClick: () => void;
  theme: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-10 h-6 rounded-full flex items-center transition-all px-1 ${active ? "bg-indigo-500" : theme === "dark" ? "bg-white/10" : "bg-black/10"}`}
  >
    <div
      className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${active ? "translate-x-4" : "translate-x-0"}`}
    />
  </button>
);

export default function UserProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme, density, setDensity } = useTheme();

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

  // UI
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  // --- DICIONÁRIO DE ESTILOS DINÂMICOS ---
  const ui = {
    // Mudei de "bg-transparent" para "bg-[#FAFAFA]" (um cinza super claro/quase branco)
    wrapper:
      theme === "dark"
        ? "bg-[#050505] text-zinc-200"
        : "bg-[#FAFAFA] text-zinc-800",

    card:
      theme === "dark"
        ? "bg-[#0A0A0A] border-white/5"
        : "bg-white border-zinc-200 shadow-sm",
    input:
      theme === "dark"
        ? "bg-[#050505] border-white/10 text-white focus:border-indigo-500"
        : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-indigo-500",
    textTitle: theme === "dark" ? "text-white" : "text-zinc-900",
    textMuted: theme === "dark" ? "text-zinc-500" : "text-zinc-500",
    iconBox:
      theme === "dark"
        ? "bg-white/[0.02] border-white/5 text-zinc-500 group-focus-within:text-white"
        : "bg-zinc-100 border-zinc-200 text-zinc-500 group-focus-within:text-zinc-900",
    padding: density === "compact" ? "p-4" : "p-8",
    gap: density === "compact" ? "gap-4" : "gap-6",
    statValue: density === "compact" ? "text-2xl" : "text-4xl",
  };

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
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-[#050505]" : "bg-white"}`}
      >
        <Loader2 size={48} className="text-indigo-500 animate-spin" />
      </div>
    );

  return (
    <div
      className={`min-h-screen p-8 pb-32 relative custom-scrollbar w-full transition-colors duration-500 ${ui.wrapper}`}
    >
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
              className={`flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-md bg-white ${toast.type === "success" ? "border-emerald-500/20 text-emerald-500" : "border-red-500/20 text-red-500"}`}
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
          <h1 className={`text-3xl font-black tracking-tight ${ui.textTitle}`}>
            Meu Perfil
          </h1>
          <p className={`text-sm ${ui.textMuted}`}>
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
            theme={theme}
          />
          <TabButton
            icon={<Palette size={18} />}
            label="Preferências"
            active={activeTab === "preferences"}
            onClick={() => setActiveTab("preferences")}
            theme={theme}
          />
          <TabButton
            icon={<BarChart3 size={18} />}
            label="Estatísticas"
            active={activeTab === "stats"}
            onClick={() => setActiveTab("stats")}
            theme={theme}
          />
          <TabButton
            icon={<ShieldCheck size={18} />}
            label="Segurança & Apps"
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            theme={theme}
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
                <div
                  className={`${ui.card} border rounded-3xl p-8 transition-all`}
                >
                  <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center mb-8">
                    <div
                      className="relative group cursor-pointer shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div
                        className={`w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center ${theme === "dark" ? "border-white/10 bg-zinc-800" : "border-zinc-200 bg-zinc-100"}`}
                      >
                        {isUploadingLogo ? (
                          <Loader2
                            size={32}
                            className="animate-spin text-indigo-500"
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
                      <h2 className={`text-2xl font-bold ${ui.textTitle}`}>
                        {displayName || "Desenvolvedor"}
                      </h2>
                      <p className={`text-sm mb-2 ${ui.textMuted}`}>{email}</p>
                      {joinedAt && (
                        <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} /> Membro desde {joinedAt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ml-1 ${ui.textMuted}`}
                      >
                        Nome Completo
                      </label>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3.5 text-sm outline-none transition-all ${ui.input}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ml-1 ${ui.textMuted}`}
                      >
                        Cargo / Especialidade
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3.5 text-sm outline-none appearance-none cursor-pointer ${ui.input}`}
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
                        <option value="Product Manager">Product Manager</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BLOCO 2: REDES SOCIAIS */}
                <div
                  className={`${ui.card} border rounded-3xl p-8 transition-all`}
                >
                  <div className="mb-6">
                    <h3
                      className={`text-lg font-bold flex items-center gap-2 ${ui.textTitle}`}
                    >
                      <Zap size={18} className="text-indigo-500" /> Presença
                      Digital
                    </h3>
                    <p className={`text-sm mt-1 ${ui.textMuted}`}>
                      Conecte seus perfis para a equipe te encontrar facilmente.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div
                      className={`flex items-center gap-4 border p-2 pr-4 rounded-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all group ${ui.input}`}
                    >
                      <div
                        className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center group-focus-within:text-blue-500 group-focus-within:bg-blue-500/10 transition-colors ${ui.iconBox}`}
                      >
                        <Linkedin size={20} />
                      </div>
                      <div className="flex-1 py-1">
                        <label
                          className={`text-[10px] font-black uppercase tracking-widest group-focus-within:text-blue-500 transition-colors ${ui.textMuted}`}
                        >
                          LinkedIn
                        </label>
                        <input
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="linkedin.com/in/seu-perfil"
                          className={`w-full bg-transparent text-sm outline-none mt-0.5 ${ui.textTitle}`}
                        />
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-4 border p-2 pr-4 rounded-2xl focus-within:border-zinc-500/50 focus-within:ring-4 focus-within:ring-zinc-500/10 transition-all group ${ui.input}`}
                    >
                      <div
                        className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center group-focus-within:text-zinc-800 dark:group-focus-within:text-white group-focus-within:bg-zinc-500/10 transition-colors ${ui.iconBox}`}
                      >
                        <Github size={20} />
                      </div>
                      <div className="flex-1 py-1">
                        <label
                          className={`text-[10px] font-black uppercase tracking-widest group-focus-within:text-zinc-800 dark:group-focus-within:text-white transition-colors ${ui.textMuted}`}
                        >
                          GitHub
                        </label>
                        <input
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="github.com/usuario"
                          className={`w-full bg-transparent text-sm outline-none mt-0.5 ${ui.textTitle}`}
                        />
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-4 border p-2 pr-4 rounded-2xl focus-within:border-pink-500/50 focus-within:ring-4 focus-within:ring-pink-500/10 transition-all group ${ui.input}`}
                    >
                      <div
                        className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center group-focus-within:text-pink-500 group-focus-within:bg-pink-500/10 transition-colors ${ui.iconBox}`}
                      >
                        <Instagram size={20} />
                      </div>
                      <div className="flex-1 py-1">
                        <label
                          className={`text-[10px] font-black uppercase tracking-widest group-focus-within:text-pink-500 transition-colors ${ui.textMuted}`}
                        >
                          Instagram
                        </label>
                        <input
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@seu.perfil"
                          className={`w-full bg-transparent text-sm outline-none mt-0.5 ${ui.textTitle}`}
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
                {/* Status & Fuso */}
                <div
                  className={`${ui.card} border rounded-3xl p-8 transition-all`}
                >
                  <h3
                    className={`text-lg font-bold mb-6 flex items-center gap-2 ${ui.textTitle}`}
                  >
                    <Clock size={18} className="text-indigo-500" />{" "}
                    Disponibilidade
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className={`text-xs font-black uppercase tracking-widest ${ui.textMuted}`}
                      >
                        Status Atual
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={statusEmoji}
                          onChange={(e) => setStatusEmoji(e.target.value)}
                          maxLength={2}
                          className={`w-16 border rounded-xl text-center text-xl outline-none ${ui.input}`}
                        />
                        <input
                          value={statusText}
                          onChange={(e) => setStatusText(e.target.value)}
                          className={`flex-1 border rounded-xl px-4 py-3.5 text-sm outline-none ${ui.input}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-xs font-black uppercase tracking-widest ${ui.textMuted}`}
                      >
                        Fuso Horário
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3.5 text-sm outline-none cursor-pointer appearance-none ${ui.input}`}
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
                <div
                  className={`${ui.card} border rounded-3xl p-8 transition-all`}
                >
                  <h3
                    className={`text-lg font-bold mb-6 flex items-center gap-2 ${ui.textTitle}`}
                  >
                    <Bell size={18} className="text-indigo-500" /> Notificações
                    de E-mail
                  </h3>
                  <div className="space-y-4">
                    <div
                      className={`flex items-center justify-between p-4 border rounded-2xl ${ui.input}`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${ui.textTitle}`}>
                          Tarefas Atribuídas
                        </p>
                        <p className={`text-xs ${ui.textMuted}`}>
                          Avisar quando eu receber novas demandas.
                        </p>
                      </div>
                      <Toggle
                        active={notifAssign}
                        onClick={() => setNotifAssign(!notifAssign)}
                        theme={theme}
                      />
                    </div>
                    <div
                      className={`flex items-center justify-between p-4 border rounded-2xl ${ui.input}`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${ui.textTitle}`}>
                          Menções em Chat
                        </p>
                        <p className={`text-xs ${ui.textMuted}`}>
                          Notificar quando meu @ for citado.
                        </p>
                      </div>
                      <Toggle
                        active={notifMention}
                        onClick={() => setNotifMention(!notifMention)}
                        theme={theme}
                      />
                    </div>
                    <div
                      className={`flex items-center justify-between p-4 border rounded-2xl ${ui.input}`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${ui.textTitle}`}>
                          Mudança de Status
                        </p>
                        <p className={`text-xs ${ui.textMuted}`}>
                          Avisar quando moverem as minhas tarefas.
                        </p>
                      </div>
                      <Toggle
                        active={notifStatus}
                        onClick={() => setNotifStatus(!notifStatus)}
                        theme={theme}
                      />
                    </div>
                  </div>
                </div>

                {/* Interface */}
                <div
                  className={`${ui.card} border rounded-3xl p-8 transition-all`}
                >
                  <h3
                    className={`text-lg font-bold mb-6 flex items-center gap-2 ${ui.textTitle}`}
                  >
                    <Layout size={18} className="text-indigo-500" /> Interface
                    (Quadro)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ${ui.textMuted}`}
                      >
                        Tema
                      </label>
                      <div
                        className={`flex border rounded-xl p-1 ${theme === "dark" ? "bg-[#050505] border-white/5" : "bg-zinc-100 border-zinc-200"}`}
                      >
                        <button
                          onClick={() => setTheme("dark")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${theme === "dark" ? "bg-indigo-500 text-white shadow-md" : "text-zinc-500"}`}
                        >
                          <Moon size={14} /> Escuro
                        </button>
                        <button
                          onClick={() => setTheme("light")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${theme === "light" ? "bg-indigo-500 text-white shadow-md" : "text-zinc-500"}`}
                        >
                          <Sun size={14} /> Claro
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ${ui.textMuted}`}
                      >
                        Densidade
                      </label>
                      <div
                        className={`flex border rounded-xl p-1 ${theme === "dark" ? "bg-[#050505] border-white/5" : "bg-zinc-100 border-zinc-200"}`}
                      >
                        <button
                          onClick={() => setDensity("compact")}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${density === "compact" ? "bg-indigo-500 text-white shadow-md" : "text-zinc-500"}`}
                        >
                          Compacto
                        </button>
                        <button
                          onClick={() => setDensity("detailed")}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${density === "detailed" ? "bg-indigo-500 text-white shadow-md" : "text-zinc-500"}`}
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
                  <div
                    className={`${ui.card} border p-6 rounded-3xl relative overflow-hidden group transition-all`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />
                    <CheckCircle2 size={24} className="text-indigo-500 mb-4" />
                    <h4 className={`text-4xl font-black mb-1 ${ui.textTitle}`}>
                      124
                    </h4>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${ui.textMuted}`}
                    >
                      Tarefas Concluídas
                    </p>
                  </div>
                  <div
                    className={`${ui.card} border p-6 rounded-3xl relative overflow-hidden transition-all`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full" />
                    <Zap size={24} className="text-emerald-500 mb-4" />
                    <h4 className={`text-4xl font-black mb-1 ${ui.textTitle}`}>
                      450
                    </h4>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${ui.textMuted}`}
                    >
                      Story Points
                    </p>
                  </div>
                  <div
                    className={`${ui.card} border p-6 rounded-3xl relative overflow-hidden transition-all`}
                  >
                    <Activity size={24} className="text-amber-500 mb-4" />
                    <h4 className={`text-4xl font-black mb-1 ${ui.textTitle}`}>
                      12 <span className={`text-lg ${ui.textMuted}`}>dias</span>
                    </h4>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${ui.textMuted}`}
                    >
                      Sequência de Entregas
                    </p>
                  </div>
                  <div
                    className={`${ui.card} border p-6 rounded-3xl relative overflow-hidden transition-all`}
                  >
                    <Briefcase size={24} className="text-purple-500 mb-4" />
                    <h4 className={`text-4xl font-black mb-1 ${ui.textTitle}`}>
                      4
                    </h4>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${ui.textMuted}`}
                    >
                      Projetos Ativos
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- ABA SEGURANÇA --- */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div
                  className={`${ui.card} border rounded-3xl p-8 transition-all`}
                >
                  <h3
                    className={`text-lg font-bold mb-6 flex items-center gap-2 ${ui.textTitle}`}
                  >
                    <Lock size={18} className="text-indigo-500" /> Acesso e
                    Senha
                  </h3>
                  <div
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border rounded-2xl mb-4 gap-4 ${ui.input}`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${ui.textTitle}`}>
                        Redefinir Senha
                      </p>
                      <p className={`text-xs ${ui.textMuted}`}>
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
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0"
                    >
                      Enviar E-mail
                    </button>
                  </div>

                  {/* Sessões */}
                  <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-white/5">
                    <h4
                      className={`text-xs font-black uppercase tracking-widest mb-4 ${ui.textMuted}`}
                    >
                      Sessões Ativas
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <Monitor size={20} className="text-indigo-500" />
                          <div>
                            <p className={`text-sm font-bold ${ui.textTitle}`}>
                              Computador Local • Chrome
                            </p>
                            <p className="text-xs text-indigo-500">
                              Sessão Atual
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center justify-between p-4 border rounded-2xl ${ui.input}`}
                      >
                        <div className="flex items-center gap-4">
                          <Smartphone size={20} className="text-zinc-500" />
                          <div>
                            <p className={`text-sm font-bold ${ui.textTitle}`}>
                              Telemóvel • Safari
                            </p>
                            <p className={`text-xs ${ui.textMuted}`}>
                              Último acesso ontem
                            </p>
                          </div>
                        </div>
                        <button className="text-[10px] font-black uppercase text-zinc-500 hover:text-red-500 transition-colors">
                          Sair
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`${ui.card} border rounded-3xl p-8 transition-all`}
                >
                  <h3
                    className={`text-lg font-bold mb-6 flex items-center gap-2 ${ui.textTitle}`}
                  >
                    <Zap size={18} className="text-indigo-500" /> Integrações
                    Pessoais
                  </h3>
                  <div className="space-y-4">
                    <div
                      className={`flex items-center justify-between p-5 border rounded-2xl ${ui.input}`}
                    >
                      <div className="flex items-center gap-4">
                        <Slack size={24} className={ui.textTitle} />
                        <div>
                          <p className={`text-sm font-bold ${ui.textTitle}`}>
                            Slack
                          </p>
                          <p className={`text-xs ${ui.textMuted}`}>
                            Receba notificações via DM.
                          </p>
                        </div>
                      </div>
                      <button
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${theme === "dark" ? "bg-white/5 border-white/5 text-zinc-300" : "bg-zinc-200 border-zinc-300 text-zinc-700"}`}
                      >
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

function TabButton({ icon, label, active, onClick, theme }: any) {
  const activeStyle = active
    ? theme === "dark"
      ? "bg-white/5 text-white border-white/10 shadow-sm"
      : "bg-white text-zinc-900 border-zinc-200 shadow-md"
    : theme === "dark"
      ? "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-transparent"
      : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50 border-transparent";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-[13px] font-bold transition-all border ${activeStyle}`}
    >
      <div className={active ? "text-indigo-500" : "text-zinc-500"}>{icon}</div>
      {label}
    </button>
  );
}