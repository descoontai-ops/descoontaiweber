import React from 'react';
import { Restaurant } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Clock, MapPin, Wallet, Star, Utensils, Bike, Smile, X } from 'lucide-react';
import { PAYMENT_METHODS } from '../../../constants';

interface RestaurantInfoModalProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantInfoModal: React.FC<RestaurantInfoModalProps> = ({ restaurant, isOpen, onClose }) => {
  const availableMethods = (restaurant.paymentMethods && restaurant.paymentMethods.length > 0) 
    ? restaurant.paymentMethods 
    : PAYMENT_METHODS;

  const getTodayScheduleDisplay = () => {
    if (!restaurant.schedule) return "Consulte o status no topo.";

    const date = new Date();
    const dayIndex = date.getDay(); 
    
    const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const displayMap: Record<string, string> = {
      'Dom': 'Domingo',
      'Seg': 'Segunda-feira',
      'Ter': 'Terça-feira',
      'Qua': 'Quarta-feira',
      'Qui': 'Quinta-feira',
      'Sex': 'Sexta-feira',
      'Sáb': 'Sábado'
    };

    const key = keysMap[dayIndex];
    const today = restaurant.schedule[key];

    if (!today) return "Horário não cadastrado";

    if (!today.isOpen) return "Fechado hoje";
    return `${today.open} às ${today.close}`;
  };

  // Helper Minimalista para Avaliações (Mesmo padrão do Card)
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        
        {/* Header com Título Clean */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Informações da Loja</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 1. AVALIAÇÕES MINIMALISTAS (Cópia fiel do padrão do Card) */}
        <div className="w-full mb-8">
           {restaurant.ratingBreakdown ? (
             <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-2 py-4 border border-gray-100/50">
               {renderRatingItem('Comida', restaurant.ratingBreakdown.product, Utensils)}
               <div className="w-px h-8 bg-gray-200/80"></div> {/* Divisor Vertical */}
               {renderRatingItem('Entrega', restaurant.ratingBreakdown.delivery, Bike)}
               <div className="w-px h-8 bg-gray-200/80"></div> {/* Divisor Vertical */}
               {renderRatingItem('Serviço', restaurant.ratingBreakdown.service, Smile)}
             </div>
           ) : (
             /* Fallback Geral Clean */
             <div className="flex justify-center w-full bg-gray-50 rounded-2xl py-4 border border-gray-100/50">
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
        
        <div className="space-y-6">
          
          {/* Address - Estilo "Clean Row" */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-50 rounded-full text-gray-900 shrink-0">
               <MapPin size={20} strokeWidth={2} />
            </div>
            <div className="flex flex-col pt-1">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Endereço</h4>
              <p className="text-sm font-medium text-gray-900 leading-relaxed">{restaurant.address}</p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-50"></div>

          {/* Hours - Estilo "Clean Row" */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-50 rounded-full text-gray-900 shrink-0">
               <Clock size={20} strokeWidth={2} />
            </div>
            <div className="flex flex-col pt-1">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Horário de Hoje</h4>
              <p className="text-sm font-medium text-gray-900">
                {getTodayScheduleDisplay()}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-50"></div>

          {/* Payment Methods */}
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gray-50 rounded-full text-gray-900 shrink-0">
                  <Wallet size={20} strokeWidth={2} />
               </div>
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">Pagamento na Entrega</h4>
            </div>
            
            <div className="flex flex-wrap gap-2 pl-[3.25rem]"> {/* Indentação para alinhar com o texto acima */}
                {availableMethods.map((method) => (
                  <span 
                    key={method} 
                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {method}
                  </span>
                ))}
            </div>
          </div>

        </div>

        {/* Footer Discreto */}
        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
           <p className="text-xs text-gray-400">
             Dúvidas? Entre em contato pelo WhatsApp da loja.
           </p>
        </div>

      </div>
    </Modal>
  );
};