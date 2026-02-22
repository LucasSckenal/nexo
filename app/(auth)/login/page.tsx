"use client";

import { useState, useEffect } from "react";
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
import { auth } from "../../lib/firebase";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Github,
  Quote,
} from "lucide-react";

// Array de depoimentos para o carrossel
const TESTIMONIALS = [
  {
    quote:
      "Desde que migrámos para o Nexo, a velocidade de entrega da nossa equipa de engenharia aumentou em 40%. A clareza que temos no Backlog mudou completamente o nosso fluxo de trabalho.",
    name: "Sarah Jenkins",
    role: "VP of Engineering, TechFlow",
    avatar: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    quote:
      "A integração dos repositórios com as tarefas diárias poupou-nos horas de reuniões. O Nexo é o workspace definitivo para equipas ágeis de alto desempenho.",
    name: "Michael Chen",
    role: "Product Manager, InnovateX",
    avatar: "https://i.pravatar.cc/150?u=michael",
  },
  {
    quote:
      "Finalmente uma ferramenta que entende como developers e designers trabalham juntos. A interface é limpa, super rápida e vai direto ao ponto.",
    name: "Elena Rodriguez",
    role: "Lead Designer, StudioV",
    avatar: "https://i.pravatar.cc/150?u=elena",
  },
];

export default function LoginPage() {
  const router = useRouter();

  // Estados de Autenticação
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estado do Carrossel
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Efeito corrigido e à prova de falhas para rodar o carrossel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((atual) => {
        // Se for o último, volta ao 0, senão vai para o próximo
        return atual >= TESTIMONIALS.length - 1 ? 0 : atual + 1;
      });
    }, 4000); // Muda a cada 4 segundos

    // Limpa o temporizador sempre que o componente for desmontado
    return () => clearInterval(timer);
  }, []);

  // Função para quando o utilizador clicar manualmente num pontinho
  const handleManualChange = (index: number) => {
    setActiveTestimonial(index);
  };

  // Lógica de E-mail/Senha
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
      } else {
        if (password.length < 6) {
          throw new Error("A palavra-passe deve ter pelo menos 6 caracteres.");
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        router.push("/");
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Login Social
  const handleSocialLogin = async (providerName: "google" | "github") => {
    setError("");
    setLoading(true);
    try {
      const provider =
        providerName === "google"
          ? new GoogleAuthProvider()
          : new GithubAuthProvider();

      await signInWithPopup(auth, provider);
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
      setError("Este e-mail já está registado.");
    } else if (err.code === "auth/popup-closed-by-user") {
      setError("O login social foi cancelado.");
    } else {
      setError(
        err.message || "Ocorreu um erro ao autenticar. Tente novamente.",
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#09090B] font-sans text-zinc-300 selection:bg-indigo-500/30">
      {/* LADO ESQUERDO: Formulário */}
      <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0 bg-[#09090B] border-r border-[#27272A] flex flex-col justify-center px-8 sm:px-12 relative z-20 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-[340px] mx-auto overflow-y-auto [&::-webkit-scrollbar]:hidden py-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 animate-in fade-in duration-500">
            <Image
              src="/Nexo_small_icon.png"
              alt="Nexo Icon"
              width={36}
              height={36}
              className="w-9 h-9 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white leading-none tracking-tight">
                Nexo
              </span>
              <span className="text-[10px] font-semibold text-indigo-400 tracking-widest uppercase mt-0.5">
                Workspace
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              {isLogin ? "Bem-vindo de volta" : "Crie a sua conta"}
            </h1>
            <p className="text-sm text-zinc-500">
              {isLogin
                ? "Aceda ao seu painel e continue a gerir os seus projetos."
                : "Centralize o fluxo de trabalho da sua equipa hoje mesmo."}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3 text-xs animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <label className="text-[11px] font-medium text-zinc-400 ml-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 shadow-inner"
                    placeholder="Alex Developer"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 ml-1">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 shadow-inner"
                  placeholder="alex@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 ml-1">
                Palavra-passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121214] border border-[#27272A] text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
              {isLogin && (
                <div className="flex justify-end pt-1">
                  <a
                    href="#"
                    className="text-[11px] text-zinc-500 hover:text-indigo-400 transition-colors"
                  >
                    Esqueceu a palavra-passe?
                  </a>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(79,70,229,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Entrar na Plataforma" : "Criar conta agora"}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#27272A]"></div>
            <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
              ou continue com
            </span>
            <div className="flex-1 h-px bg-[#27272A]"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#121214] border border-[#27272A] hover:bg-[#1A1A1E] text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
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
              className="flex items-center justify-center gap-2 bg-[#121214] border border-[#27272A] hover:bg-[#1A1A1E] text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
            >
              <Github size={18} /> GitHub
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-zinc-500">
            {isLogin ? "Não tem uma conta? " : "Já possui conta? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
            >
              {isLogin ? "Registe-se gratuitamente" : "Fazer login"}
            </button>
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Carrossel Automático */}
      <div className="hidden lg:flex flex-1 relative bg-[#09090B] items-center justify-center overflow-hidden p-12">
        {/* Gradients & Grid */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none transition-all duration-1000"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        <div className="relative z-10 w-full max-w-xl">
          <div className="absolute -top-6 -left-6 text-indigo-500/20">
            <Quote size={80} className="transform rotate-180" />
          </div>

          <div className="relative z-10 bg-[#121214]/60 backdrop-blur-xl border border-[#27272A] rounded-2xl p-10 shadow-2xl min-h-[280px] flex flex-col justify-between">
            {/* O "key" no blockquote força o React a recriar o elemento e rodar a animação "fade-in" */}
            <blockquote
              key={activeTestimonial}
              className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <p className="text-xl md:text-2xl font-medium text-zinc-200 leading-snug min-h-[120px]">
                "{TESTIMONIALS[activeTestimonial].quote}"
              </p>

              <footer className="flex items-center gap-4 border-t border-[#27272A] pt-6">
                <img
                  src={TESTIMONIALS[activeTestimonial].avatar}
                  alt={TESTIMONIALS[activeTestimonial].name}
                  className="w-12 h-12 rounded-full border-2 border-indigo-500/30 object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-white">
                    {TESTIMONIALS[activeTestimonial].name}
                  </div>
                  <div className="text-xs text-indigo-400 font-medium">
                    {TESTIMONIALS[activeTestimonial].role}
                  </div>
                </div>
              </footer>
            </blockquote>
          </div>

          {/* Indicadores de Paginação (Dots) clicáveis */}
          <div className="mt-8 flex items-center justify-center gap-2 relative z-20">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleManualChange(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeTestimonial === index
                    ? "w-8 bg-indigo-500"
                    : "w-2 bg-[#27272A] hover:bg-[#3F3F46]"
                }`}
                aria-label={`Ver depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
