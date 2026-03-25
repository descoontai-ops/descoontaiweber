import { useState, useEffect } from 'react';
import { Restaurant } from '../../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export const useSubscriptionAutoCheck = (restaurant?: Restaurant) => {
  const [isOverdue, setIsOverdue] = useState(false);
  const [isDueToday, setIsDueToday] = useState(false);

  useEffect(() => {
    if (!restaurant || !restaurant.nextDueDate) return;

    const checkStatus = async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let dueDate: Date;

      // Tratamento para Timestamp do Firebase ou String
      if (restaurant.nextDueDate?.seconds) {
        dueDate = new Date(restaurant.nextDueDate.seconds * 1000);
      } else {
        dueDate = new Date(restaurant.nextDueDate);
      }
      // Ajuste de Fuso Horário simples para evitar erro de "Dia anterior"
      // Adicionamos 3 horas para garantir que não caia no dia anterior por causa de UTC-3 (Brasília)
      dueDate.setHours(dueDate.getHours() + 3); 
      dueDate.setHours(0, 0, 0, 0);

      // 1. Verifica se é HOJE
      const isToday = now.getTime() === dueDate.getTime();
      setIsDueToday(isToday);

      // 2. Verifica se JÁ PASSOU (Vencido)
      const isPast = now.getTime() > dueDate.getTime();
      setIsOverdue(isPast);

      // 3. Verifica se é FUTURO (Em dia)
      const isFuture = now.getTime() < dueDate.getTime();

      const currentStatus = restaurant.subscriptionStatus;

      // --- AUTOCORREÇÃO INTELIGENTE (BIDIRECIONAL) ---
      
      // CASO A: Venceu mas está como "Active" -> CORRIGE PARA OVERDUE
      if (isPast && (currentStatus === 'active' || currentStatus === 'trial')) {
        console.log("⚠️ Auto-Check: Vencido detectado. Bloqueando...");
        try {
          await updateDoc(doc(db, 'merchants', restaurant.id), {
             subscriptionStatus: 'overdue'
          });
        } catch (error) {
          console.error("Erro ao atualizar status:", error);
        }
      }

      // CASO B: Data é Futura (ou Hoje) mas está como "Overdue" -> CORRIGE PARA ACTIVE
      // (Isso resolve seu problema atual: você mudou a data, ele vai perceber e liberar)
      if ((isFuture || isToday) && currentStatus === 'overdue') {
        console.log("✅ Auto-Check: Data válida detectada. Desbloqueando...");
        try {
          await updateDoc(doc(db, 'merchants', restaurant.id), {
             subscriptionStatus: 'active'
          });
        } catch (error) {
          console.error("Erro ao reativar status:", error);
        }
      }
    };

    checkStatus();
  }, [restaurant]); // Roda sempre que os dados do restaurante mudarem

  return { isOverdue, isDueToday };
};