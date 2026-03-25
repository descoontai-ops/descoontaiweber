import React from 'react';
import { Star, Clock, Ticket } from 'lucide-react'; 
import { Restaurant } from '../../../types';
import { CATEGORIES } from '../../../constants'; 
import { useLocation } from '../../Location/context/LocationContext';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  customRating?: number; // Permite exibir uma nota específica (Ex: nota de entrega)
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick, customRating }) => {
  const { location } = useLocation();

  // Define qual nota exibir: A personalizada (se houver) ou a geral
  const displayRating = customRating !== undefined ? customRating : restaurant.rating;

  // --- LÓGICA DE CÁLCULO INTELIGENTE (CORRIGIDA) ---
  const getDeliveryInfo = () => {
    // 1. Verifica se a loja tem a configuração avançada de entrega
    if (restaurant.deliveryConfig) {
        
        // Caso 1: Taxa Fixa para a cidade toda
        if (restaurant.deliveryConfig.type === 'fixed') {
            const price = restaurant.deliveryConfig.fixedPrice || 0;
            return { 
                text: price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`, 
                isFree: price === 0 
            };
        }

        // Caso 2: Por Bairro (Iguatu)
        if (restaurant.deliveryConfig.type === 'neighborhood') {
            
            // AQUI ESTAVA O PROBLEMA: Agora verificamos se o usuário tem bairro definido
            if (location && location.neighborhood && restaurant.deliveryConfig.neighborhoodPrices) {
                // Busca o preço exato para o bairro do usuário
                const priceForUser = restaurant.deliveryConfig.neighborhoodPrices[location.neighborhood];
                
                // Se encontrou um preço específico (mesmo que seja 0), usa ele!
                if (priceForUser !== undefined) {
                    return { 
                        text: priceForUser === 0 ? 'Grátis' : `R$ ${priceForUser.toFixed(2)}`, 
                        isFree: priceForUser === 0 
                    };
                }
            }
            
            // Se o usuário NÃO tem bairro ou o bairro dele não está na lista:
            // Mostra a taxa base padrão (deliveryFee) como fallback
            return { 
                text: restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee.toFixed(2)}`,
                isFree: restaurant.deliveryFee === 0
            };
        }
    }

    // Fallback legado (para lojas antigas sem config)
    const legacyPrice = restaurant.deliveryFee || 0;
    return { 
        text: legacyPrice === 0 ? 'Grátis' : `R$ ${legacyPrice.toFixed(2)}`, 
        isFree: legacyPrice === 0 
    };
  };

  const deliveryInfo = getDeliveryInfo();

  return (
    <div 
      onClick={onClick}
      className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
    >
      {/* Badge de Fechado */}
      {!restaurant.isOpen && (
        <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[1px]">
           <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
             Fechado
           </span>
        </div>
      )}

      {/* Image */}
      <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden relative border border-gray-100">
        <img 
          src={restaurant.image} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Badge de Cupom na Imagem */}
        {restaurant.hasCoupons && (
           <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[8px] font-bold px-1 py-0.5 text-center flex justify-center items-center gap-0.5 z-10 shadow-sm">
             <Ticket size={8} className="stroke-[3]" />
             <span>CUPOM</span>
           </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start gap-2">
           <h3 className="font-bold text-gray-900 text-sm truncate">{restaurant.name}</h3>
           
           {/* Nota Dinâmica */}
           <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100 shrink-0">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-yellow-700">
                {displayRating ? displayRating.toFixed(1) : 'New'}
              </span>
           </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
          {CATEGORIES.find(cat => cat.id === restaurant.category)?.name || restaurant.category}
        </p>
        
        <div className="flex items-center gap-3 mt-2">
           <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              <span>{restaurant.deliveryTime} min</span>
           </div>
           
           <div className={`text-xs font-bold flex items-center gap-1 ${deliveryInfo.isFree ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{deliveryInfo.text}</span>
           </div>
        </div>
      </div>
    </div>
  );
};