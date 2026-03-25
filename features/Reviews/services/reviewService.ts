import { db, auth } from '../../../lib/firebase';
import { doc, runTransaction, collection, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Restaurant } from '../../../types';

export const submitReview = async (
  restaurantId: string, 
  ratings: { product: number; delivery: number; service: number },
  userName?: string
) => {
  try {
    if (!restaurantId) throw new Error("ID do restaurante inválido");

    // Pega o usuário logado atual
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuário precisa estar logado.");

    // --- TRAVA DE SEGURANÇA (COOLDOWN DE 3 DIAS / 72H) ---
    // Busca a última avaliação deste usuário para este restaurante
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('restaurantId', '==', restaurantId),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const lastReview = snapshot.docs[0].data();
      
      // Se tiver data de criação, verifica o tempo
      if (lastReview.createdAt) {
        const lastDate = lastReview.createdAt.toDate();
        const now = new Date();
        const diffInHours = Math.abs(now.getTime() - lastDate.getTime()) / 36e5; // Converte ms para horas

        // ALTERADO AQUI: De 24 para 72 horas (3 dias)
        if (diffInHours < 72) {
          throw new Error("Você já avaliou este estabelecimento recentemente. Aguarde 3 dias para avaliar novamente!");
        }
      }
    }
    // ----------------------------------------------

    const restaurantRef = doc(db, 'merchants', restaurantId);

    await runTransaction(db, async (transaction) => {
      const restaurantDoc = await transaction.get(restaurantRef);
      if (!restaurantDoc.exists()) throw new Error("Restaurante não encontrado");

      const data = restaurantDoc.data() as Restaurant;
      
      const currentBreakdown = data.ratingBreakdown || {
        product: 0,
        delivery: 0,
        service: 0,
        count: 0
      };

      const currentCount = Number(currentBreakdown.count) || 0;
      const currentProduct = Number(currentBreakdown.product) || 0;
      const currentDelivery = Number(currentBreakdown.delivery) || 0;
      const currentService = Number(currentBreakdown.service) || 0;

      const newCount = currentCount + 1;

      const newProductAvg = ((currentProduct * currentCount) + ratings.product) / newCount;
      const newDeliveryAvg = ((currentDelivery * currentCount) + ratings.delivery) / newCount;
      const newServiceAvg = ((currentService * currentCount) + ratings.service) / newCount;

      const generalAvg = (newProductAvg + newDeliveryAvg + newServiceAvg) / 3;

      const finalRating = isNaN(generalAvg) ? 5 : Number(generalAvg.toFixed(1));

      transaction.update(restaurantRef, {
        rating: finalRating,
        ratingBreakdown: {
          product: isNaN(newProductAvg) ? 5 : Number(newProductAvg.toFixed(1)),
          delivery: isNaN(newDeliveryAvg) ? 5 : Number(newDeliveryAvg.toFixed(1)),
          service: isNaN(newServiceAvg) ? 5 : Number(newServiceAvg.toFixed(1)),
          count: newCount
        }
      });

      const reviewRef = doc(collection(db, 'reviews'));
      const newReview = {
        restaurantId,
        userId: currentUser.uid, 
        userName: userName || 'Anônimo',
        ratings,
        createdAt: serverTimestamp()
      };
      
      transaction.set(reviewRef, newReview);
    });

    return true;
  } catch (error: any) {
    console.error("Erro detalhado ao enviar avaliação:", error);
    throw error;
  }
};