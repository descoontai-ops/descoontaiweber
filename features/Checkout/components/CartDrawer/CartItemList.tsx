import React from 'react';
import { Trash2 } from 'lucide-react';
import { CartItem } from '../../../../types';
import { QuantitySelector } from '../../../../components/ui/QuantitySelector';

interface CartItemListProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({ items, onRemove, onUpdateQuantity }) => {
  return (
    <div className="space-y-6">
      {items.map(item => (
        <div key={item.id} className="group flex gap-4 animate-in slide-in-from-right-4 duration-500">
          <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-50 relative shadow-sm group-hover:shadow-md transition-shadow">
             <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
             {item.originalPrice && item.originalPrice > item.price && (
                <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">-%</div>
             )}
          </div>
          <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
            <div className="flex justify-between items-start gap-2">
               <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{item.name}</h4>
               <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-2 -mt-1"><Trash2 size={16} /></button>
            </div>
            
            {item.selectedGroups && item.selectedGroups.length > 0 && (
                <div className="text-[10px] text-gray-500 leading-tight my-1">
                    {item.selectedGroups.map(g => g.items.map(i => i.name).join(', ')).join(', ')}
                </div>
            )}

            <div className="flex items-center justify-between">
               <div className="flex items-baseline gap-2">
                  <span className="font-bold text-brand-600 text-base">R$ {item.price.toFixed(2)}</span>
                  {item.originalPrice && item.originalPrice > item.price && <span className="text-xs text-gray-400 line-through">R$ {item.originalPrice.toFixed(2)}</span>}
               </div>
               <QuantitySelector size="sm" quantity={item.quantity} onIncrease={() => onUpdateQuantity(item.id, 1)} onDecrease={() => onUpdateQuantity(item.id, -1)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};