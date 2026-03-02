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
  ShieldCheck,
  Palette,
  Bell,
  Github,
  Linkedin,
  Briefcase,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  Layout,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

// --- COMPONENTE DE TOGGLE ---
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
    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
      active
        ? "bg-accentPurple"
        : theme === "dark"
          ? "bg-zinc-800"
          : "bg-zinc-300"
    }`}
  >
    <div
      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${active ? "translate-x-5" : "translate-x-0"}`}
    />
  </button>
);

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme, density, setDensity } = useTheme();

  // Estados de Carregamento e UI
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");

  // Estados dos Dados Restaurados
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [statusEmoji, setStatusEmoji] = useState("💻");
  const [notifEmail, setNotifEmail] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
        setPhotoURL(currentUser.photoURL || "");

        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRole(data.role || "");
          setBio(data.bio || "");
          setLinkedin(data.socials?.linkedin || "");
          setGithub(data.socials?.github || "");
          setStatusEmoji(data.statusEmoji || "💻");
          setNotifEmail(data.notifications?.email ?? true);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName,
          role,
          bio,
          statusEmoji,
          socials: { linkedin, github },
          notifications: { email: notifEmail },
          updatedAt: new Date(),
        },
        { merge: true },
      );
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-accentPurple" size={32} />
      </div>
    );

  return (
    <div className="min-h-full bg-bgMain lg:p-8 p-4 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER DO PERFIL */}
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <div className="relative group mx-auto md:mx-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-4 border-bgSurface shadow-2xl">
              <img
                src={
                  photoURL ||
                  `https://ui-avatars.com/api/?name=${displayName}&background=8b5cf6&color=fff`
                }
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-textPrimary tracking-tight">
                {displayName || "Utilizador"}
              </h1>
              <span className="text-2xl">{statusEmoji}</span>
            </div>
            <p className="text-textSecondary font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
              <Briefcase size={14} className="text-accentPurple" />
              {role || "Cargo não definido"}
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO OTIMIZADA (SEM SCROLL NO MOBILE) */}
        <div className="flex border-b border-borderSubtle gap-2 p-1">
          <TabButton
            active={activeTab === "perfil"}
            onClick={() => setActiveTab("perfil")}
            label="Perfil"
            icon={<User size={18} />}
            theme={theme}
          />
          <TabButton
            active={activeTab === "preferencias"}
            onClick={() => setActiveTab("preferencias")}
            label="Preferências"
            icon={<Palette size={18} />}
            theme={theme}
          />
          <TabButton
            active={activeTab === "seguranca"}
            onClick={() => setActiveTab("seguranca")}
            label="Segurança"
            icon={<ShieldCheck size={18} />}
            theme={theme}
          />
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === "perfil" && (
                <motion.div
                  key="perfil"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="bg-bgSurface border border-borderSubtle rounded-[2rem] p-6 md:p-8 shadow-sm">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-textMuted ml-1">
                            Nome de Exibição
                          </label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-3 text-textPrimary outline-none focus:ring-2 ring-accentPurple/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-textMuted ml-1">
                            Cargo / Role
                          </label>
                          <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="Ex: Lead Designer"
                            className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-3 text-textPrimary outline-none focus:ring-2 ring-accentPurple/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-textMuted ml-1">
                          Biografia
                        </label>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-3 text-textPrimary outline-none focus:ring-2 ring-accentPurple/20 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-textMuted ml-1 flex items-center gap-2">
                            <Linkedin size={14} /> LinkedIn
                          </label>
                          <input
                            type="text"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-3 text-textPrimary outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-textMuted ml-1 flex items-center gap-2">
                            <Github size={14} /> GitHub
                          </label>
                          <input
                            type="text"
                            value={github}
                            onChange={(e) => setGithub(e.target.value)}
                            className="w-full bg-bgMain border border-borderSubtle rounded-2xl px-4 py-3 text-textPrimary outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-accentPurple hover:bg-accentPurpleDark text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-accentPurple/20"
                      >
                        {saving ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <Save size={20} />
                        )}
                        Salvar Alterações
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === "preferencias" && (
                <motion.div
                  key="pref"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="bg-bgSurface border border-borderSubtle rounded-[2rem] p-6 md:p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Layout size={18} className="text-accentPurple" />{" "}
                      Interface
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-textMuted">
                          Tema do Sistema
                        </p>
                        <div className="flex bg-bgMain p-1 rounded-xl border border-borderSubtle">
                          <button
                            onClick={() => setTheme("dark")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${theme === "dark" ? "bg-accentPurple text-white" : "text-textSecondary"}`}
                          >
                            Escuro
                          </button>
                          <button
                            onClick={() => setTheme("light")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${theme === "light" ? "bg-accentPurple text-white" : "text-textSecondary"}`}
                          >
                            Claro
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-textMuted">
                          Densidade Visual
                        </p>
                        <div className="flex bg-bgMain p-1 rounded-xl border border-borderSubtle">
                          <button
                            onClick={() => setDensity("compact")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${density === "compact" ? "bg-accentPurple text-white" : "text-textSecondary"}`}
                          >
                            Compacto
                          </button>
                          <button
                            onClick={() => setDensity("detailed")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${density === "detailed" ? "bg-accentPurple text-white" : "text-textSecondary"}`}
                          >
                            Detalhado
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "seguranca" && (
                <motion.div
                  key="sec"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {/* VERIFICAÇÃO */}
                  <div className="bg-bgSurface border border-borderSubtle rounded-[2rem] p-6 md:p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-accentPurple" />{" "}
                      Segurança da Conta
                    </h3>
                    <div
                      className={`flex items-center justify-between p-5 rounded-2xl border ${user?.emailVerified ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${user?.emailVerified ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}
                        >
                          {user?.emailVerified ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <AlertTriangle size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {user?.emailVerified
                              ? "Email Verificado"
                              : "Email Pendente"}
                          </p>
                          <p className="text-xs text-textSecondary">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DISPOSITIVO */}
                  <div className="bg-bgSurface border border-borderSubtle rounded-[2rem] p-6 md:p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Monitor size={18} className="text-accentPurple" /> Sessão
                      Ativa
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-bgMain rounded-2xl border border-accentPurple/20">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-accentPurple text-white rounded-xl shadow-lg shadow-accentPurple/20">
                          <Monitor size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Navegador Atual</p>
                          <p className="text-[10px] text-textMuted uppercase font-medium">
                            Protegido por SSL/TLS
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">
                        Online
                      </span>
                    </div>
                  </div>

                  {/* SENHA */}
                  <div className="bg-bgSurface border border-borderSubtle rounded-[2rem] p-6 md:p-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Lock size={18} className="text-accentPurple" />{" "}
                      Credenciais
                    </h3>
                    <button
                      onClick={async () => {
                        await sendPasswordResetEmail(auth, user.email);
                        alert("Link enviado para seu email!");
                      }}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-bgMain border border-borderSubtle hover:bg-bgSurfaceActive text-textPrimary px-6 py-3 rounded-xl font-bold transition-all"
                    >
                      <Mail size={18} /> Alterar senha por email
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SIDEBAR DE STATUS */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-accentPurple to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrendingUp size={80} />
              </div>
              <h4 className="text-xl font-bold mb-1">Produtividade</h4>
              <p className="text-white/70 text-sm mb-6">
                Foco total esta semana!
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span>Progresso Geral</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[78%] rounded-full" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm("Deseja sair?")) signOut(auth);
              }}
              className="w-full flex justify-center items-center gap-2 px-4 py-4 rounded-2xl border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
            >
              <LogOut size={16} /> Encerrar Sessão
            </button>
          </div>
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
    : "text-textMuted hover:text-textPrimary border-transparent";

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${activeStyle} flex-1 md:flex-none`}
      title={label}
    >
      <span className={`${active ? "text-accentPurple" : ""}`}>{icon}</span>
      <span className="hidden md:block">{label}</span>
    </button>
  );
}
