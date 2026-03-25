import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { OrderData } from '../types';

export const createOrder = async (data: Omit<OrderData, 'id' | 'createdAt' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<OrderData | null> => {
  try {
    if (!orderId) return null;
    
    const cleanId = orderId.trim();
    console.log("%c[DETETIVE] Buscando pedido ID:", "color: white; background: blue; padding: 4px", cleanId);

    const docRef = doc(db, 'orders', cleanId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("%c[DETETIVE] SUCESSO: Pedido encontrado!", "color: white; background: green; padding: 4px");
      return { id: docSnap.id, ...docSnap.data() } as OrderData;
    } else {
      console.error("%c[DETETIVE] ERRO: O ID " + cleanId + " não existe na coleção 'orders' do Firebase!", "color: white; background: red; padding: 4px");
      return null;
    }
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.error("%c[DETETIVE] ERRO DE PERMISSÃO: O Firebase bloqueou a leitura. Verifique as Rules!", "color: white; background: orange; padding: 4px");
    } else {
      console.error("[DETETIVE] Erro desconhecido:", error);
    }
    return null;
  }
};

// FUNÇÃO ATUALIZADA (Limpando o ID com trim)
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    if (!orderId) throw new Error("ID do pedido ausente");
    const cleanId = orderId.trim(); 
    const docRef = doc(db, 'orders', cleanId);
    await updateDoc(docRef, { status });
    console.log(`Status do pedido ${cleanId} atualizado para ${status}`);
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    throw error;
  }
};