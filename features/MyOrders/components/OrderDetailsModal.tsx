import React from 'react';
import { OrderData } from '../../Orders/types';
import { X, MapPin, Store, CreditCard, Clock, StickyNote, Receipt, CheckCircle, Loader2 } from 'lucide-react';

interface OrderDetailsModalProps {
  order: OrderData;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
  const formattedDate = orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const isConfirmed = order.status === 'accepted';
  const safeNum = (val: any) => Number(val) || 0;

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      {/* Clicar fora para fechar */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md h-[90vh] md:h-auto md:max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-4">
        
        {/* CABEÇALHO FIXO */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white rounded-t-2xl z-10 shrink-0">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Receipt size={20} className="text-brand-600" /> Detalhes do Pedido
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ÁREA DE SCROLL (CONTEÚDO) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Status e Loja */}
          <div className="text-center">
             <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mx-auto mb-3">
                 <Store size={32} />
             </div>
             <h3 className="font-black text-xl text-gray-900 mb-1">{order.merchantName || "Restaurante"}</h3>
             <p className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-1">
                <Clock size={14} /> Feito em {formattedDate} às {formattedTime}
             </p>
             
             {isConfirmed ? (
                <div className="inline-flex items-center gap-2 text-sm font-bold text-green-700 bg-green-100 px-4 py-2 rounded-full">
                    <CheckCircle size={18} /> Pedido Confirmado pela Loja
                </div>
             ) : (
                <div className="inline-flex items-center gap-2 text-sm font-bold text-orange-700 bg-orange-100 px-4 py-2 rounded-full">
                    <Loader2 size={18} className="animate-spin" /> Aguardando Confirmação
                </div>
             )}
          </div>

          <div className="w-full h-px bg-gray-100 border-dashed border-b border-gray-200"></div>

          {/* ITENS DO PEDIDO */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3 uppercase text-xs tracking-wider">Itens do Pedido</h4>
            <div className="space-y-3">
               {order.items?.map((item, index) => (
                   <div key={index} className="flex flex-col text-sm border-b border-gray-50 pb-2 last:border-0">
                       <div className="flex justify-between items-start font-medium text-gray-800">
                           <span><span className="text-brand-600 font-bold">{item.quantity}x</span> {item.name}</span>
                           <span>{formatCurrency(safeNum(item.quantity) * safeNum(item.price))}</span>
                       </div>
                       
                       {/* Adicionais */}
                       {item.selectedGroups && item.selectedGroups.map((group: any, gIndex: number) => (
                           group.items && group.items.map((addon: any, aIndex: number) => (
                               <div key={`addon-${index}-${gIndex}-${aIndex}`} className="flex justify-between text-xs text-gray-500 mt-1 pl-5">
                                   <span>+ {addon.name}</span>
                                   <span>{safeNum(addon.price) > 0 ? formatCurrency(safeNum(addon.price) * safeNum(item.quantity)) : 'Grátis'}</span>
                               </div>
                           ))
                       ))}
                   </div>
               ))}
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          {order.obs && (
             <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-700 mb-1">
                   <StickyNote size={14} className="text-gray-500" /> Observações do cliente:
                </div>
                <p className="text-sm text-gray-600 italic">"{order.obs}"</p>
             </div>
          )}

          {/* ENTREGA OU RETIRADA */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3 uppercase text-xs tracking-wider">
               {order.deliveryMethod === 'pickup' ? 'Retirada na Loja' : 'Endereço de Entrega'}
            </h4>
            
            {order.deliveryMethod === 'pickup' ? (
                <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-blue-800">
                    <Store size={20} className="shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-bold">O pedido será retirado no local.</p>
                        <p className="text-xs opacity-80 mt-1">Dirija-se ao estabelecimento para buscar.</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-700">
                    <MapPin size={20} className="shrink-0 mt-0.5 text-gray-500" />
                    <div className="text-sm">
                        <p className="font-bold">{order.customer?.address?.street}, {order.customer?.address?.number}</p>
                        <p className="text-xs mt-0.5">{order.customer?.address?.neighborhood}</p>
                        {order.customer?.address?.complement && <p className="text-xs italic mt-0.5">Ref: {order.customer?.address?.complement}</p>}
                    </div>
                </div>
            )}
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3 uppercase text-xs tracking-wider">Pagamento</h4>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-700">
                <CreditCard size={20} className="shrink-0 text-gray-500" />
                <div className="text-sm font-bold uppercase">
                    {order.paymentMethod === 'pix' ? 'PIX' : 
                     order.paymentMethod === 'credit_card' ? 'Cartão pelo App' : 
                     order.paymentMethod === 'card_machine' ? 'Cartão na Maquineta' : order.paymentMethod}
                </div>
            </div>
          </div>

          {/* RESUMO DOS VALORES */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-sm text-gray-600">
             <div className="flex justify-between">
                <span>Subtotal dos itens</span>
                <span>{formatCurrency(safeNum(order.subtotal))}</span>
             </div>
             {order.deliveryMethod !== 'pickup' && (
                 <div className="flex justify-between">
                    <span>Taxa de Entrega</span>
                    <span>{formatCurrency(safeNum(order.deliveryFee))}</span>
                 </div>
             )}
             {safeNum((order as any).discount) > 0 && (
                 <div className="flex justify-between text-green-600 font-bold">
                    <span>Desconto Aplicado</span>
                    <span>-{formatCurrency(safeNum((order as any).discount))}</span>
                 </div>
             )}
             <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-200 mt-2">
                <span>Total Pago</span>
                <span>{formatCurrency(safeNum(order.total))}</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};