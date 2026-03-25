import React from 'react';
import { Star, ShoppingBag, Truck, MessageCircle } from 'lucide-react';
import { RatingBreakdown } from '../../../types';

interface Props {
  data?: RatingBreakdown;
}

export const RatingDisplay: React.FC<Props> = ({ data }) => {
  const breakdown = data || { product: 0, delivery: 0, service: 0, count: 0 };
  const hasRatings = breakdown.count > 0;

  const items = [
    { label: 'Produto', value: breakdown.product, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Entrega', value: breakdown.delivery, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Atendimento', value: breakdown.service, icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Qualidade do Serviço</h4>
        {hasRatings && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Baseado em {breakdown.count} avaliações</span>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${item.bg} ${item.border} transition-all hover:scale-105`}>
             <div className={`mb-2 p-2 bg-white rounded-full shadow-sm ${item.color}`}><item.icon size={16} strokeWidth={2.5} /></div>
             <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wide">{item.label}</span>
             <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-gray-100">
               <span className="text-base font-black text-gray-800">{hasRatings ? item.value.toFixed(1) : '-'}</span>
               <Star size={12} className="fill-yellow-400 text-yellow-400" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};