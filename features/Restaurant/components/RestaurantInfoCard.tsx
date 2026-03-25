import React from 'react';
import { Restaurant } from '../../../types';
import { MapPin, Clock, Info, ChevronRight, Store, Star, Utensils, Bike, Smile, Ticket, Copy } from 'lucide-react';
import { useCart } from '../hooks/useCart'; // Import para permitir copiar cupom (opcional, ou apenas visual)

interface RestaurantInfoCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
  shopCoupons?: any[]; 
}

export const RestaurantInfoCard: React.FC<RestaurantInfoCardProps> = ({ restaurant, onClick, shopCoupons }) => {
  // 1. LÓGICA
  const categoryDisplay = restaurant.category || restaurant.categories?.[0] || 'Restaurante';
  const isOpen = restaurant.isOpen !== undefined ? restaurant.isOpen : true;
  const profileImage = restaurant.logo || restaurant.image || restaurant.coverImage || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Código ${text} copiado!`);
  };

  // Helper Minimalista para Avaliações
  const renderRatingItem = (label: string, value: number, Icon: React.ElementType) => (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} className="text-gray-400 stroke-[2.5]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-bold text-gray-900">{value.toFixed(1)}</span>
        <Star size={12} className="fill-gray-900 text-gray-900" />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-b-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] mb-8 pb-8 pt-2 animate-in fade-in duration-700">
      <div className="flex flex-col items-center px-6">
        
        {/* 2. HEADER ULTRA CLEAN */}
        <div className="relative mt-2 mb-5">
           <div className="w-24 h-24 rounded-[1.8rem] bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-1">
              <img 
                src={profileImage} 
                alt={restaurant.name} 
                className="w-full h-full object-cover rounded-[1.5rem]"
              />
           </div>
           <div className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {isOpen && <div className="h-1.5 w-1.5 rounded-full bg-white opacity-80" />}
           </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight text-center">
           {restaurant.name}
        </h1>

        <div className="flex items-center gap-2 mb-8 text-sm text-gray-500 font-medium">
           <div className="flex items-center gap-1.5">
             <Store size={14} className="text-gray-400" />
             <span>{categoryDisplay}</span>
           </div>
           <span className="text-gray-300 text-[10px]">•</span>
           <span className={`${isOpen ? 'text-emerald-600' : 'text-red-500'} font-semibold text-xs tracking-wide`}>
              {isOpen ? 'Aberto agora' : 'Fechado'}
           </span>
        </div>

        {/* 3. AVALIAÇÕES MINIMALISTAS */}
        <div className="w-full mb-6">
           {restaurant.ratingBreakdown ? (
             <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-2 py-4 border border-gray-100/50">
               {renderRatingItem('Comida', restaurant.ratingBreakdown.product, Utensils)}
               <div className="w-px h-8 bg-gray-200/80"></div> 
               {renderRatingItem('Entrega', restaurant.ratingBreakdown.delivery, Bike)}
               <div className="w-px h-8 bg-gray-200/80"></div> 
               {renderRatingItem('Serviço', restaurant.ratingBreakdown.service, Smile)}
             </div>
           ) : (
             <div className="flex justify-center w-full">
                <div className="flex flex-col items-center">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-bold text-gray-900 tracking-tighter">{restaurant.rating.toFixed(1)}</span>
                      <Star size={24} className="fill-yellow-400 text-yellow-400" />
                   </div>
                   <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Avaliação Geral</span>
                </div>
             </div>
           )}
        </div>

        {/* --- 4. LISTA DE CUPONS (NOVO) --- */}
        {/* Reinserindo os cupons que haviam sumido */}
        {shopCoupons && shopCoupons.length > 0 && (
          <div className="w-full mb-8 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-1">
               <Ticket size={14} className="text-brand-600" />
               <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Cupons Disponíveis</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
               {shopCoupons.map((coupon) => (
                  <button 
                    key={coupon.id}
                    onClick={() => copyToClipboard(coupon.code)}
                    className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-2.5 min-w-[200px] hover:bg-green-100 transition-colors group relative overflow-hidden"
                  >
                     {/* Efeito Picotado Esquerda */}
                     <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-green-200" />
                     {/* Efeito Picotado Direita */}
                     <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-green-200" />

                     <div className="bg-white p-1.5 rounded text-green-600 shadow-sm ml-1">
                        <Ticket size={16} />
                     </div>
                     <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-green-800">{coupon.code}</span>
                        <span className="text-[10px] text-green-600 font-medium">
                           {coupon.type === 'percent' ? `${coupon.value}% OFF` : `R$ ${coupon.value} OFF`}
                        </span>
                     </div>
                     <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy size={14} className="text-green-600" />
                     </div>
                  </button>
               ))}
            </div>
          </div>
        )}

        {/* 5. INFO GRID (Tempo e Taxa) */}
        <div className="flex w-full items-center justify-between px-4 mb-2">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-50 rounded-full text-gray-900">
                 <Clock size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tempo</span>
                 <span className="text-sm font-bold text-gray-900">
                   {restaurant.deliveryTime || '30-45'} min
                 </span>
              </div>
           </div>

           <div className="w-px h-8 bg-gray-100"></div> 

           <div className="flex items-center gap-3 justify-end">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entrega</span>
                 <span className={`text-sm font-bold ${restaurant.deliveryConfig?.fixedPrice === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                   {restaurant.deliveryConfig?.fixedPrice === 0 
                      ? 'Grátis' 
                      : `R$ ${restaurant.deliveryConfig?.fixedPrice?.toFixed(2) || '5,00'}`
                   }
                 </span>
              </div>
              <div className={`p-2.5 rounded-full ${restaurant.deliveryConfig?.fixedPrice === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-900'}`}>
                 <MapPin size={18} strokeWidth={2.5} />
              </div>
           </div>
        </div>

        {/* 6. FOOTER LINK */}
        {onClick && (
          <div className="w-full mt-6 pt-6 border-t border-gray-50">
            <button 
              onClick={onClick}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors group px-2"
            >
              <span className="flex items-center gap-2">
                 <Info size={14} className="text-gray-400" />
                 Mais informações
              </span>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};