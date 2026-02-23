"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
// Importação do db (Firestore) e funções necessárias
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Github,
  Sparkles,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2000000) {
      setError("A imagem é demasiado grande. O limite é de 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
      } else {
        if (password.length < 6)
          throw new Error("A palavra-passe deve ter pelo menos 6 caracteres.");

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // 1. Atualiza o perfil no Firebase Auth
        await updateProfile(userCredential.user, {
          displayName: name || null,
          photoURL: photoBase64 || null,
        });

        // 2. Salva no Firestore com a data de criação (joinedAt)
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          photoURL: photoBase64 || null,
          joinedAt: serverTimestamp(), // Regista a data atual
          role: "Developer",
          status: "active",
        });

        router.push("/");
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: "google" | "github") => {
    setError("");
    setLoading(true);
    try {
      const provider =
        providerName === "google"
          ? new GoogleAuthProvider()
          : new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;
      // Salva ou atualiza os dados do utilizador social garantindo o campo joinedAt
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          joinedAt: serverTimestamp(),
          role: "Developer",
          status: "active",
        },
        { merge: true }, // Evita apagar outros dados se o utilizador já existir
      );

      router.push("/");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    console.error(err);
    if (
      err.code === "auth/invalid-credential" ||
      err.code === "auth/user-not-found" ||
      err.code === "auth/wrong-password"
    ) {
      setError("E-mail ou palavra-passe incorretos.");
    } else if (err.code === "auth/email-already-in-use") {
      setError("Este e-mail já se encontra registado.");
    } else if (err.code === "auth/popup-closed-by-user") {
      setError("O login social foi cancelado.");
    } else {
      setError(
        err.message || "Ocorreu um erro ao autenticar. Tente novamente.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] font-sans text-zinc-300 relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <motion.div
          animate={{ x: [0, 50, -50, 0], y: [0, -30, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"
        />
        <motion.div
          animate={{ x: [0, -60, 40, 0], y: [0, 40, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-indigo-500/40 blur-xl rounded-full" />
            <div className="w-14 h-14 bg-[#050505] border border-white/10 rounded-2xl flex items-center justify-center relative shadow-2xl">
              <Image
                src="/Nexo_small_icon.png"
                alt="Nexo Icon"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-center text-white mb-2">
            {isLogin ? "Iniciar Sessão" : "Criar Conta"}
          </h1>
          <p className="text-sm text-zinc-400 font-medium text-center px-4">
            {isLogin
              ? "Aceda ao seu workspace e continue a trabalhar."
              : "Junte-se a nós e otimize o seu fluxo de trabalho."}
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] pointer-events-none" />

          <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl relative">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold">
                    <AlertTriangle size={16} className="shrink-0" />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                    accept="image/*"
                  />

                  <div className="flex flex-col items-center justify-center mb-5 mt-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/10 relative group cursor-pointer overflow-hidden border-2 border-white/5 bg-black/40 hover:border-indigo-500/50 transition-all"
                    >
                      {photoBase64 ? (
                        <img
                          src={photoBase64}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera
                          size={24}
                          className="text-zinc-500 group-hover:text-indigo-400 transition-colors"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest">
                      Foto de Perfil
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Nome Completo
                    </label>
                    <div className="relative group">
                      <User
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
                      />
                      <input
                        type="text"
                        required={!isLogin}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  E-mail de Trabalho
                </label>
                <div className="relative group">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                    placeholder="voce@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Palavra-passe
                  </label>
                </div>
                <div className="relative group">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden bg-indigo-600 text-white rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(79,70,229,0.2)] hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] disabled:opacity-50"
                >
                  <div className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        {isLogin ? "Iniciar Sessão" : "Criar Workspace"}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                Ou aceda com
              </span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] text-white rounded-xl px-4 py-3 text-xs font-bold transition-all shadow-sm"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("github")}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] text-white rounded-xl px-4 py-3 text-xs font-bold transition-all shadow-sm"
              >
                <Github size={16} /> GitHub
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-bold text-zinc-500">
          {isLogin ? "Ainda não tem acesso? " : "Já faz parte da equipa? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setPhotoBase64("");
            }}
            className="text-white hover:text-indigo-400 transition-colors ml-1"
          >
            {isLogin ? "Crie a sua conta" : "Iniciar sessão"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
