"use client";

import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ClientModal } from "../../components/modals/ClientModal"; // Ajuste o caminho da importação
import {
  Briefcase,
  Plus,
  Search,
  Trash2,
  Mail,
  Globe,
  Phone,
  FileText,
  ExternalLink,
  Edit2,
} from "lucide-react";

export default function ClientesPage() {
  const { activeProject } = useData();
  const [searchTerm, setSearchTerm] = useState("");

  // Controle do Modal Externo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);

  if (!activeProject) return null;

  if (activeProject.category !== "design") {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505] text-zinc-500">
        Esta página está disponível apenas para projetos de Design.
      </div>
    );
  }

  const clients = activeProject.clients || [];
  const filteredClients = clients.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openNewClientModal = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const openEditClientModal = (client: any) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleRemoveClient = async (clientId: string, clientName: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja remover o cliente "${clientName}"?`,
      )
    ) {
      try {
        const updatedClients = clients.filter((c: any) => c.id !== clientId);
        await updateDoc(doc(db, "projects", activeProject.id), {
          clients: updatedClients,
        });
      } catch (error) {
        console.error("Erro ao remover cliente:", error);
      }
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "lead":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "inativo":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#000000] relative overflow-hidden">
      {/* Efeitos Glow */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* CABEÇALHO */}
      <header className="shrink-0 px-8 py-8 border-b border-white/[0.05] bg-white/[0.01] backdrop-blur-2xl flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-[10px] uppercase tracking-[0.4em]">
            <Briefcase size={12} />
            <span>Gestão de Relacionamento (CRM)</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
              Carteira de Clientes
            </h1>
            <p className="text-sm text-zinc-500">
              Faça a gestão dos clientes e associe-os às tarefas do quadro
              Kanban.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden lg:block">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors"
            />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:border-purple-500/50 outline-none transition-all shadow-inner"
            />
          </div>
          <button
            onClick={openNewClientModal}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(168,85,247,0.2)] active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={3} /> Novo Cliente
          </button>
        </div>
      </header>

      {/* LISTA DE CLIENTES */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
        {clients.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <Briefcase size={48} className="text-zinc-600 mb-4" />
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-black mb-2">
              Nenhum Cliente Registrado
            </span>
            <p className="text-zinc-500 text-sm">
              Adicione o seu primeiro cliente para começar.
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex justify-center py-20 text-zinc-500 text-sm">
            Nenhum cliente encontrado com esse nome.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredClients.map((client: any) => (
                <motion.div
                  key={client.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-[#0A0A0C] border border-white/[0.05] hover:border-purple-500/30 rounded-[2rem] p-6 transition-all duration-300 shadow-xl hover:-translate-y-1 overflow-hidden relative flex flex-col"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-4">
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/10 shadow-md bg-zinc-900"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100 mb-1 group-hover:text-white transition-colors leading-tight">
                          {client.name}
                        </h3>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getStatusStyle(client.status || "ativo")}`}
                        >
                          {client.status || "ativo"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditClientModal(client)}
                        className="text-zinc-600 hover:text-purple-400 p-2 rounded-xl hover:bg-purple-500/10 transition-colors"
                        title="Editar Cliente"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveClient(client.id, client.name)
                        }
                        className="text-zinc-600 hover:text-red-500 p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                        title="Remover Cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10 mb-5 flex-1">
                    {client.email && (
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <Mail size={14} className="text-zinc-500" />{" "}
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <Phone size={14} className="text-zinc-500" />{" "}
                        {client.phone}
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-3 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                        <Globe size={14} />
                        <a
                          href={
                            client.website.startsWith("http")
                              ? client.website
                              : `https://${client.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          {client.website.replace(/^https?:\/\//, "")}{" "}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                    {client.notes && (
                      <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          <FileText size={12} /> Observações
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {client.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between relative z-10 mt-auto">
                    <span className="text-[10px] text-zinc-600 font-medium">
                      Adicionado em{" "}
                      {new Date(client.addedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Componente Modal de Clientes Renderizado Aqui */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={clientToEdit}
        projectId={activeProject.id}
        currentClients={clients}
      />
    </main>
  );
}
