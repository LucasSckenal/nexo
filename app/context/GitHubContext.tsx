"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface GitHubContextType {
  branches: string[];
  isLoading: boolean;
  fetchBranches: (repoSlug: string, token?: string) => Promise<void>;
  createBranch: (
    repoSlug: string,
    branchName: string,
    token: string,
  ) => Promise<boolean>;
  clearBranches: () => void;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export function GitHubProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBranches = useCallback(async (repoSlug: string, token?: string) => {
    if (!repoSlug) return;
    setIsLoading(true);
    try {
      const headers: any = { Accept: "application/vnd.github.v3+json" };
      // Se o projeto tiver token (repositório privado), usa-o!
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${repoSlug}/branches`,
        { headers },
      );

      if (response.ok) {
        const data = await response.json();
        setBranches(data.map((b: any) => b.name));
      } else {
        console.error("Erro ao buscar branches");
      }
    } catch (error) {
      console.error("Erro de rede ao carregar branches:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBranch = async (
    repoSlug: string,
    branchName: string,
    token: string,
  ) => {
    const cleanRepoSlug = repoSlug.trim();
    setIsLoading(true);

    try {
      const headers = {
        Authorization: `Bearer ${token}`, // <-- AGORA ELE USA O TOKEN QUE VEM DO PROJETO!
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };

      // 1. Descobrir a branch padrão (main/master)
      const repoRes = await fetch(
        `https://api.github.com/repos/${cleanRepoSlug}`,
        { headers },
      );
      if (!repoRes.ok)
        throw new Error(
          "Repositório não encontrado. Verifique o nome e o token.",
        );
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch;

      // 2. Descobrir o SHA
      const baseRes = await fetch(
        `https://api.github.com/repos/${cleanRepoSlug}/git/refs/heads/${defaultBranch}`,
        { headers },
      );
      if (!baseRes.ok)
        throw new Error(
          `Não foi possível encontrar a branch ${defaultBranch}.`,
        );
      const baseData = await baseRes.json();
      const sha = baseData.object.sha;

      // 3. Criar a nova branch
      const newBranchRes = await fetch(
        `https://api.github.com/repos/${cleanRepoSlug}/git/refs`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: sha,
          }),
        },
      );

      if (newBranchRes.ok) {
        await fetchBranches(cleanRepoSlug, token); // Atualiza a lista usando o token
        return true;
      } else {
        const errorData = await newBranchRes.json();
        console.error("Erro ao criar branch:", errorData.message);
        return false;
      }
    } catch (error) {
      console.error("Erro de rede ao criar branch:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearBranches = () => setBranches([]);

  return (
    <GitHubContext.Provider
      value={{ branches, isLoading, fetchBranches, clearBranches, createBranch}}
    >
      {children}
    </GitHubContext.Provider>
  );
}

export const useGitHub = () => {
  const context = useContext(GitHubContext);
  if (!context)
    throw new Error("useGitHub deve ser usado dentro de um GitHubProvider");
  return context;
};
