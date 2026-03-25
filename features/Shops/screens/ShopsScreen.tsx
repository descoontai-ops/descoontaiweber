import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { Restaurant } from '../../../types';
import { RestaurantCard } from '../../Home/components/RestaurantCard';
import { Loader2, Star, Truck, ShoppingBag, MessageCircle, Store } from 'lucide-react';
import { useLocation } from '../../Location/context/LocationContext';
import { CATEGORIES } from '../../../constants'; // Import das categorias
import { getCategoryIcon } from '../../Home/utils/categoryIcons'; // Import dos ícones

interface ShopsScreenProps {
  onSelectRestaurant: (id: string) => void;
}

type SortCriteria = 'general' | 'delivery' | 'service' | 'product';

export const ShopsScreen: React.FC<ShopsScreenProps> = ({ onSelectRestaurant }) => {
  const [merchants, setMerchants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [activeSort, setActiveSort] = useState<SortCriteria>('general');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const { location } = useLocation();

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'merchants'), where('isApproved', '==', true));
        const snapshot = await getDocs(q);
        const data: Restaurant[] = [];
        const now = new Date();

        snapshot.forEach((doc) => {
          const merchantData = doc.data() as Restaurant;
          
          // --- REGRA DE OURO: O FISCAL DO CLIENTE ---
          
          // 1. Bloqueio por status explícito
          if (merchantData.subscriptionStatus === 'suspended') return;

          // 2. Bloqueio por cálculo de data
          if (merchantData.nextDueDate && merchantData.subscriptionStatus !== 'trial') {
             let dueDate: Date;
             
             if (merchantData.nextDueDate instanceof Timestamp) {
                dueDate = merchantData.nextDueDate.toDate();
             } else if ((merchantData.nextDueDate as any).seconds) {
                dueDate = new Date((merchantData.nextDueDate as any).seconds * 1000);
             } else {
                dueDate = new Date(merchantData.nextDueDate as any);
             }

             const diffTime = now.getTime() - dueDate.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

             if (diffDays > 5) {
                return;
             }
          }

          data.push({ ...merchantData, id: doc.id });
        });
        setMerchants(data);
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  const isRestaurantOpen = (restaurant: Restaurant): boolean => {
    // Verifica flag manual
    if (!restaurant.isOpen) return false;
    
    // Se não tem agenda, assume aberto se a flag estiver true
    if (!restaurant.schedule) return true;

    const now = new Date();
    const dayIndex = now.getDay();
    const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const currentKey = keysMap[dayIndex];
    const todaySchedule = restaurant.schedule[currentKey];

    if (!todaySchedule || !todaySchedule.isOpen) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
    
    const openTime = openH * 60 + openM;
    let closeTime = closeH * 60 + closeM;

    // Ajuste para horários que viram o dia (Ex: 18:00 as 02:00)
    if (closeTime < openTime) closeTime += 24 * 60;

    return currentMinutes >= openTime && currentMinutes <= closeTime;
  };

  const sortedMerchants = useMemo(() => {
    // 1. Filtra por Categoria (se não for 'all')
    let filtered = merchants;
    if (activeCategory !== 'all') {
        filtered = filtered.filter(m => m.category === activeCategory);
    }

    // 2. Mapeia adicionando o status calculado de aberto/fechado
    const mapped = filtered.map(m => ({
      ...m,
      _isOpen: isRestaurantOpen(m)
    }));

    // 3. Ordena
    return mapped.sort((a, b) => {
      // 1º CRITÉRIO: STATUS (Aberto > Fechado)
      if (a._isOpen && !b._isOpen) return -1;
      if (!a._isOpen && b._isOpen) return 1;

      // 2º CRITÉRIO: PONTUAÇÃO ESPECÍFICA (Maior > Menor)
      let scoreA = 0;
      let scoreB = 0;

      const breakdownA = a.ratingBreakdown || { product: 0, delivery: 0, service: 0 };
      const breakdownB = b.ratingBreakdown || { product: 0, delivery: 0, service: 0 };

      switch (activeSort) {
        case 'delivery':
          scoreA = breakdownA.delivery;
          scoreB = breakdownB.delivery;
          break;
        case 'service':
          scoreA = breakdownA.service;
          scoreB = breakdownB.service;
          break;
        case 'product':
          scoreA = breakdownA.product;
          scoreB = breakdownB.product;
          break;
        default: // 'general'
          scoreA = a.rating || 0;
          scoreB = b.rating || 0;
      }

      // Se as notas forem iguais, desempata por nome
      if (scoreB === scoreA) {
          return (a.name || '').localeCompare(b.name || '');
      }

      return scoreB - scoreA;
    });
  }, [merchants, activeSort, activeCategory]);

  // Função auxiliar para obter a nota correta para exibir no card
  const getDisplayRating = (merchant: Restaurant) => {
      const breakdown = merchant.ratingBreakdown || { product: 0, delivery: 0, service: 0 };
      switch (activeSort) {
          case 'delivery': return breakdown.delivery;
          case 'service': return breakdown.service;
          case 'product': return breakdown.product;
          default: return undefined; // undefined faz o card usar a nota geral
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
        <p className="text-gray-400 text-sm">Carregando lojas...</p>
      </div>
    );
  }

  // CORREÇÃO APLICADA AQUI:
  // Filtramos a lista CATEGORIES para garantir que não exista duplicidade de IDs 'all' ou nomes 'Todos'
  const categoryList = [
      { id: 'all', name: 'Todos' }, 
      ...CATEGORIES.filter(c => c.id !== 'all' && c.name !== 'Todos')
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Fixo */}
      <div className="bg-white sticky top-0 z-10 shadow-sm pt-safe-top">
         <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               <Store className="text-brand-600" /> Todos os estabelecimentos
            </h1>
            <p className="text-xs text-gray-500 mt-1">
               Encontre o que você procura filtrando por categoria e qualidade.
            </p>
         </div>

         {/* 1. FILTRO DE CATEGORIAS (Carrossel) */}
         <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
            {categoryList.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex flex-col items-center gap-1 min-w-[60px] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isSelected ? 'bg-brand-50 border-brand-600 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                            {getCategoryIcon(cat.id, 32)}
                        </div>
                        <span className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? 'text-brand-700' : 'text-gray-500'}`}>
                            {cat.name}
                        </span>
                    </button>
                )
            })}
         </div>

         {/* 2. FILTROS DE QUALIDADE (Ordenação) */}
         <div className="flex px-4 pb-4 gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 pt-3">
            <button 
               onClick={() => setActiveSort('general')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'general' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <Star size={12} className={activeSort === 'general' ? 'fill-white' : ''} /> Geral
            </button>

            <button 
               onClick={() => setActiveSort('delivery')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'delivery' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <Truck size={12} /> Melhor Entrega
            </button>

            <button 
               onClick={() => setActiveSort('product')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'product' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <ShoppingBag size={12} /> Melhor Produto
            </button>

            <button 
               onClick={() => setActiveSort('service')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'service' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <MessageCircle size={12} /> Melhor Atend.
            </button>
         </div>
      </div>

      {/* Lista de Lojas */}
      <div className="px-4 mt-4 space-y-4">
         {sortedMerchants.map((merchant) => (
            <div 
               key={merchant.id} 
               className={`transition-all duration-500 ${!merchant._isOpen ? 'grayscale opacity-60 pointer-events-none select-none filter blur-[0.5px]' : ''}`}
            >
               {/* Label Visual para Fechados */}
               {!merchant._isOpen && (
                  <div className="mb-1 ml-1 text-center">
                     <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase tracking-wide">
                        Fechado Agora
                     </span>
                  </div>
               )}
               
               <RestaurantCard 
                  restaurant={merchant} 
                  customRating={getDisplayRating(merchant)} 
                  onClick={() => {
                      if (merchant._isOpen) {
                          onSelectRestaurant(merchant.id);
                      }
                  }} 
               />
            </div>
         ))}

         {sortedMerchants.length === 0 && (
            <div className="text-center py-10 text-gray-400">
               <p>Nenhuma loja encontrada nesta categoria.</p>
            </div>
         )}
      </div>
    </div>
  );
};