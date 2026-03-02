import { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, 
  orderBy, updateDoc, doc, deleteDoc, writeBatch 
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Agora o hook aceita o projectId como segundo parâmetro
export function useNotifications(userId: string | undefined, projectId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se não tiver userId OU não tiver projectId selecionado, limpa as notificações
    if (!userId || !projectId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("projectId", "==", projectId), // <-- NOVO FILTRO
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, projectId]); // <-- Re-executa se mudar de usuário ou de projeto

  const markAsRead = (id: string) => updateDoc(doc(db, "notifications", id), { read: true });
  
  const deleteNotif = (id: string) => deleteDoc(doc(db, "notifications", id));

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead, deleteNotif, markAllAsRead };
}