"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

interface DataContextType {
  projects: any[];
  activeProject: any | null;
  setActiveProject: (project: any) => void;
}

const DataContext = createContext<DataContextType>({
  projects: [],
  activeProject: null,
  setActiveProject: () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any | null>(null);

  // 1. Função wrapper que atualiza o estado e também guarda no disco do navegador
  const handleSetActiveProject = (project: any) => {
    setActiveProject(project);
    if (typeof window !== "undefined") {
      if (project?.id) {
        localStorage.setItem("@Keepe:lastActiveProjectId", project.id);
      } else {
        localStorage.removeItem("@Keepe:lastActiveProjectId");
      }
    }
  };

  useEffect(() => {
    // Ouve as mudanças de autenticação
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user || !user.email) {
        setProjects([]);
        setActiveProject(null);
        return;
      }

      // Procura apenas os projetos onde o meu email existe na lista de membros (memberEmails)
      const q = query(
        collection(db, "projects"),
        where("memberEmails", "array-contains", user.email),
      );

      const unsubscribeProjects = onSnapshot(q, (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjects(projectsData);

        // Usamos callback no setter para garantir que temos sempre o valor mais atual do estado
        setActiveProject((currentActive) => {
          // Se já houver um projeto ativo na sessão, procuramos a sua versão mais recente no snapshot (caso tenha sido editado)
          if (currentActive) {
            const updatedActive = projectsData.find(
              (p) => p.id === currentActive.id,
            );
            if (updatedActive) return updatedActive;
          }

          // Se não houver projeto ativo (ex: o utilizador acabou de dar F5)
          if (projectsData.length > 0) {
            // Vamos procurar se havia algo guardado no navegador
            const savedProjectId =
              typeof window !== "undefined"
                ? localStorage.getItem("@Keepe:lastActiveProjectId")
                : null;

            if (savedProjectId) {
              const projectToRestore = projectsData.find(
                (p) => p.id === savedProjectId,
              );
              if (projectToRestore) {
                return projectToRestore; // Restaura o projeto que estavas a ver!
              }
            }

            // Se o projeto guardado foi apagado ou se for o primeiro acesso de sempre, devolve o primeiro da lista
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "@Keepe:lastActiveProjectId",
                projectsData[0].id,
              );
            }
            return projectsData[0];
          }

          // Se o utilizador não tiver nenhum projeto
          return null;
        });
      });

      return () => unsubscribeProjects();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <DataContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject: handleSetActiveProject, // Expor a função modificada
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
