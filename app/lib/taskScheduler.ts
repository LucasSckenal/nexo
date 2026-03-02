// lib/taskScheduler.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  collectionGroup,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";

export class TaskSchedulerService {
  static async checkUpcomingDeadlines(userId: string) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    // 1. Busca tasks que vencem amanhã onde o user é membro
    const q = query(
      collectionGroup(db, "tasks"),
      where("members", "array-contains", userId),
      where("dueDate", ">=", startOfTomorrow),
      where("dueDate", "<=", endOfTomorrow),
      where("status", "!=", "done")
    );

    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      const task = docSnap.data();
      const taskId = docSnap.id;
      const todayStr = today.toISOString().split('T')[0]; // Ex: "2023-10-27"

      // 2. Lógica de Trava: Criamos um ID único para este aviso de hoje
      // Formato: aviso_IDDATASK_DATAHOJE
      const alertId = `alert_${taskId}_${todayStr}`;
      const alertRef = doc(db, "users", userId, "alerts_history", alertId);

      const alertCheck = await getDoc(alertRef);

      // Se esse aviso ainda não existir para hoje, criamos a notificação
      if (!alertCheck.exists()) {
        await addDoc(collection(db, "notifications"), {
          userId: userId,
          senderName: "Sistema",
          senderPhoto: "https://cdn-icons-png.flaticon.com/512/179/179386.png",
          title: "Prazo amanhã! ⏰",
          message: `A tarefa "${task.title}" vence em 24h.`,
          type: "system",
          taskId: taskId,
          read: false,
          createdAt: serverTimestamp(),
        });

        // 3. Salva que já avisamos hoje para não repetir no F5
        await setDoc(alertRef, {
          sentAt: serverTimestamp(),
          taskId: taskId
        });
      }
    }
  }
}