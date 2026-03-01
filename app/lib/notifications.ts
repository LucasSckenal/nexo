import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// No arquivo notifications.ts, atualize a interface e a função:
interface NotificationData {
  userId: string;
  senderName: string;
  senderPhoto?: string; // <-- Adicione aqui
  title: string;
  message: string;
  type: NotificationData;
  taskId?: string;
  projectId?: string;
}

export async function sendNotification(data: NotificationData) {
  try {
    await addDoc(collection(db, "notifications"), {
      ...data, // Isso já vai incluir o senderPhoto que passamos no handleDrop
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
}