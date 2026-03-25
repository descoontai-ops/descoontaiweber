import React from 'react';
import { OrderData } from '../../Orders/types';
import { Store, Clock, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';

interface OrderHistoryCardProps {
  order: OrderData;
  onClick: () => void; // NOVO: Propriedade para detectar o clique
}

export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({ order, onClick }) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
  const formattedDate = orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const isConfirmed = order.status === 'accepted';

  return (
    // NOVO: Adicionei o onClick e cursor-pointer na div principal
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
    >
      <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                <Store size={20} />
            </div>
            <div>
                <h4 className="font-bold text-gray-800 line-clamp-1">{order.merchantName || "Restaurante"}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> {formattedDate} às {formattedTime}
                </p>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-600">{order.items?.length || 0} itens</span>
        <span className="font-bold text-gray-800">{formatCurrency(order.total || 0)}</span>
      </div>

      <div className="flex justify-between items-center pt-2">
        {isConfirmed ? (
            <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <CheckCircle size={14} /> Confirmado
            </div>
        ) : (
            <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                <Loader2 size={14} className="animate-spin" /> Aguardando Loja
            </div>
        )}

        <button className="text-brand-600 text-xs font-bold flex items-center gap-1">
            Ver detalhes <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};