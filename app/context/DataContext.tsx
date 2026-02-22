"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase"; // Ajuste o caminho se necessário

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

        // Se ainda não houver projeto ativo selecionado, seleciona o primeiro
        if (projectsData.length > 0 && !activeProject) {
          setActiveProject(projectsData[0]);
        } else if (projectsData.length === 0) {
          setActiveProject(null);
        }
      });

      return () => unsubscribeProjects();
    });

    return () => unsubscribeAuth();
  }, []); // Sem dependência no activeProject para evitar loops infinitos

  return (
    <DataContext.Provider value={{ projects, activeProject, setActiveProject }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
