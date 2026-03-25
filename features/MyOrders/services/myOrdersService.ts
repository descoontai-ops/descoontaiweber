import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { OrderData } from '../../Orders/types';

export const listenToUserOrders = (userId: string, callback: (orders: OrderData[], errorMsg?: string) => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderData));
    
    const sortedOrders = orders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
    });

    callback(sortedOrders);
  }, (error: any) => {
    console.error("Erro no Listener de Pedidos em tempo real:", error);
    // Se o Firebase bloquear a leitura, manda o aviso de erro para a tela
    if (error.code === 'permission-denied') {
        callback([], 'permission-denied');
    } else {
        callback([]); 
    }
  });

  return unsubscribe;
};