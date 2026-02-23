import { NextResponse } from "next/server";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ajusta este caminho para o teu ficheiro do firebase

export async function POST(req: Request) {
  try {
    // 1. Ler os dados enviados pelo GitHub
    const payload = await req.json();
    const event = req.headers.get("x-github-event");

    // Só nos interessam os eventos de "push" (commits enviados)
    if (event === "push") {
      const repoFullName = payload.repository.full_name; // Ex: "LucasSckenal/nexo"
      const commits = payload.commits;

      // 2. Procurar na base de dados qual é o projeto que tem este repositório
      const projectsRef = collection(db, "projects");
      const qProject = query(projectsRef, where("githubRepo", "==", repoFullName));
      const projectSnap = await getDocs(qProject);

      if (projectSnap.empty) {
        return NextResponse.json({ message: "Projeto não encontrado" }, { status: 404 });
      }

      const projectId = projectSnap.docs[0].id;
      const projectKey = projectSnap.docs[0].data().key || "NEX"; // Ex: "NEX"

      // 3. Analisar cada commit para encontrar IDs de tarefas (Ex: NEX-123)
      for (const commit of commits) {
        const message = commit.message;
        
        // Expressão regular para encontrar "NEX-1" até "NEX-999"
        const regex = new RegExp(`${projectKey}-\\d+`, "gi");
        const matches = message.match(regex);

        if (matches) {
          for (const match of matches) {
            const taskKey = match.toUpperCase(); // Garante que fica "NEX-123"

            // 4. Procurar a tarefa específica dentro deste projeto
            const tasksRef = collection(db, "projects", projectId, "tasks");
            const qTask = query(tasksRef, where("key", "==", taskKey));
            const taskSnap = await getDocs(qTask);

            if (!taskSnap.empty) {
              const taskId = taskSnap.docs[0].id;

              // 5. Lógica inteligente de Status
              let newStatus = "in-progress"; // Por padrão, se mencionou, está em progresso
              const lowerMsg = message.toLowerCase();
              
              // Palavras mágicas para concluir a tarefa automaticamente
              const doneKeywords = ["fix", "fixes", "fixed", "close", "closes", "closed", "resolve", "resolves", "done"];
              
              if (doneKeywords.some(keyword => lowerMsg.includes(keyword))) {
                newStatus = "done";
              }

              // 6. Atualizar a tarefa no Firebase
              await updateDoc(doc(db, "projects", projectId, "tasks", taskId), {
                status: newStatus,
                lastCommitMessage: message,
                lastCommitUrl: commit.url
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processado" });
  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}