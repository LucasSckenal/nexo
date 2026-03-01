import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type NotificationType = 'mention' | 'status' | 'assignment' | 'system';

interface NotificationData {
  userId: string;      // Quem vai receber
  senderName: string;  // Quem gerou a ação (ex: "Carlos")
  title: string;       // Ex: "Nova Tarefa"
  message: string;     // Ex: "Carlos atribuiu-te uma tarefa"
  type: NotificationType;
  taskId?: string;     // Opcional: Link para a tarefa
  projectId?: string;
}

export async function sendNotification(data: NotificationData) {
  try {
    await addDoc(collection(db, "notifications"), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
}