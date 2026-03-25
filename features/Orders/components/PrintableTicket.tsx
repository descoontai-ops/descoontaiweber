import React from 'react';
import { OrderData } from '../types';
import { X, MapPin, Phone, StickyNote, Store } from 'lucide-react';

// --- FUNÇÃO PARA TOTAIS (COM R$) ---
const formatCurrency = (value: number | string) => {
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numberValue);
};

// --- FUNÇÃO PARA TABELA (SEM R$) ---
const formatNumber = (value: number | string) => {
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue);
};
// -----------------------------------------------

interface PrintableTicketProps {
  order: OrderData;
  items: any[];
  total: number;
  obs: string;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: 'quantity' | 'name' | 'price', value: any) => void;
  onUpdateObs: (val: string) => void;
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({
  order, items, total, obs, onRemoveItem, onUpdateItem, onUpdateObs
}) => {
  
  const safeNum = (val: any) => Number(val) || 0;

  // Tratamento de compatibilidade entre as versões de dados
  const customerName = order.customer?.name || (order as any).customerName;
  const customerPhone = order.customer?.phone || (order as any).customerPhone;
  
  const addressStreet = order.customer?.address?.street || (order as any).deliveryAddress?.street;
  const addressNumber = order.customer?.address?.number || (order as any).deliveryAddress?.number;
  const addressNeighborhood = order.customer?.address?.neighborhood || (order as any).deliveryAddress?.neighborhood;
  const addressComplement = order.customer?.address?.complement || (order as any).deliveryAddress?.complement;

  return (
    <div id="printable-area" className="bg-white p-4 w-full max-w-[80mm] text-black font-mono text-sm shadow-lg print:shadow-none mb-10 print:mb-0">
      
      {/* CABEÇALHO */}
      <div className="text-center border-b border-black border-dashed pb-3 mb-3">
        <h1 className="text-xl font-black uppercase mb-1 leading-tight">{order.merchantName || "RESTAURANTE"}</h1>
        <div className="text-[10px] leading-tight">
             <p>{new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
             <p className="font-bold mt-1">PEDIDO #{order.id?.slice(-6).toUpperCase() || "000000"}</p>
        </div>
      </div>

      {/* CLIENTE E ENDEREÇO / RETIRADA */}
      <div className="mb-4 border-b border-black border-dashed pb-3">
        <p className="font-bold text-base mb-1">{customerName}</p>
        {customerPhone && (
          <p className="flex items-center gap-1 text-xs mb-1">
            <Phone size={10} /> {customerPhone}
          </p>
        )}
        
        {/* LÓGICA DE ENTREGA OU RETIRADA */}
        {order.deliveryMethod === 'pickup' ? (
            <div className="flex items-start gap-1 mt-2 bg-gray-100 print:bg-transparent p-1 rounded border border-black print:border-dashed">
                <Store size={12} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold leading-tight uppercase">RETIRADA NA LOJA</p>
                    <p className="text-[10px] uppercase mt-0.5">O cliente irá retirar no local</p>
                </div>
            </div>
        ) : (
            <div className="flex items-start gap-1 mt-2 bg-gray-100 print:bg-transparent p-1 rounded">
                <MapPin size={12} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold leading-tight">
                        {addressStreet}, {addressNumber}
                    </p>
                    <p className="text-xs">{addressNeighborhood}</p>
                    {addressComplement && (
                        <p className="text-[10px] italic mt-0.5">Ref: {addressComplement}</p>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* ITENS (TABELA EDITÁVEL COM ADICIONAIS) */}
      <div className="mb-4">
        
        {/* CABEÇALHO DA TABELA - FONTE REDUZIDA */}
        <div className="flex font-bold border-b border-black mb-2 pb-1 text-[10px]">
            <span className="w-8 text-center">QTD</span>
            <span className="flex-1 px-1">ITEM</span>
            <span className="w-12 text-center">V. UNT</span>
            <span className="w-14 text-right">V. TOT</span>
            <span className="w-5 print:hidden"></span>
        </div>

        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={index} className="flex flex-col text-[11px] group relative border-b border-gray-100 border-dashed pb-1 last:border-0">
                    
                    {/* LINHA DO ITEM PRINCIPAL */}
                    <div className="flex items-start">
                        {/* QTD */}
                        <input 
                            type="number"
                            min="1"
                            value={safeNum(item.quantity)}
                            onChange={(e) => onUpdateItem(index, 'quantity', e.target.value)}
                            className="w-8 text-center font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black outline-none p-0 text-[11px]"
                        />
                        
                        {/* NOME */}
                        <textarea 
                            value={item.name}
                            onChange={(e) => onUpdateItem(index, 'name', e.target.value)}
                            rows={1}
                            className="flex-1 px-1 resize-none bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black outline-none overflow-hidden h-auto leading-tight text-[11px] font-bold"
                            style={{ minHeight: '1.2em' }}
                        />
                        
                        {/* PREÇO UNITÁRIO (CENTRALIZADO E SEM R$) */}
                        <div className="w-12 text-center">
                            <input 
                                type="number"
                                step="0.01"
                                value={safeNum(item.price)}
                                onChange={(e) => onUpdateItem(index, 'price', e.target.value)}
                                className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black outline-none p-0 text-[11px]"
                            />
                        </div>

                        {/* PREÇO TOTAL (ALINHADO À DIREITA PARA FICAR BONITO, SEM R$) */}
                        <div className="w-14 text-right font-bold pt-[1px] text-[11px]">
                            <span>{formatNumber(safeNum(item.quantity) * safeNum(item.price))}</span>
                        </div>

                        {/* DELETE BUTTON */}
                        <button 
                            onClick={() => onRemoveItem(index)}
                            className="w-5 flex justify-center text-red-500 opacity-0 group-hover:opacity-100 print:hidden"
                        >
                            <X size={12} />
                        </button>
                    </div>

                    {/* LÓGICA PARA EXIBIR OS ADICIONAIS (SE HOUVER) */}
                    {item.selectedGroups && item.selectedGroups.map((group: any, gIndex: number) => (
                        group.items && group.items.map((addon: any, aIndex: number) => (
                            <div key={`addon-${index}-${gIndex}-${aIndex}`} className="flex items-start text-[10px] text-gray-700 mt-1">
                                <span className="w-8"></span> {/* Espaço em branco embaixo da QTD */}
                                <span className="flex-1 px-1 pl-2 leading-tight">↳ {addon.name}</span>
                                
                                <span className="w-12 text-center">
                                    {safeNum(addon.price) > 0 ? formatNumber(safeNum(addon.price)) : 'Grátis'}
                                </span>
                                
                                <span className="w-14 text-right">
                                    {safeNum(addon.price) > 0 ? formatNumber(safeNum(addon.price) * safeNum(item.quantity)) : 'Grátis'}
                                </span>
                                <span className="w-5 print:hidden"></span>
                            </div>
                        ))
                    ))}
                </div>
            ))}
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="mb-4 border-t border-black border-dashed pt-2">
         <div className="flex items-center gap-1 font-bold text-xs mb-1">
            <StickyNote size={12}/> OBSERVAÇÕES:
         </div>
         <textarea 
            value={obs}
            onChange={(e) => onUpdateObs(e.target.value)}
            className="w-full bg-gray-50 print:bg-transparent p-2 text-xs border border-gray-200 print:border-none rounded resize-none focus:outline-none"
            rows={2}
            placeholder="Nenhuma observação."
         />
      </div>

      {/* TOTAIS (AQUI MANTEMOS O R$ PARA FICAR DESTACADO) */}
      <div className="border-t-2 border-black pt-3 space-y-1 text-right text-xs">
         <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(items.reduce((a, b) => a + (safeNum(b.quantity) * safeNum(b.price)), 0))}</span>
         </div>
         
         {/* A taxa de entrega só aparece se não for retirada */}
         {order.deliveryMethod !== 'pickup' && (
             <div className="flex justify-between">
                <span>Entrega:</span>
                <span>{formatCurrency(safeNum(order.deliveryFee))}</span>
             </div>
         )}
         
         {safeNum((order as any).discount) > 0 && (
             <div className="flex justify-between text-black font-bold">
                <span>Desconto:</span>
                <span>-{formatCurrency(safeNum((order as any).discount))}</span>
             </div>
         )}
         
         <div className="flex justify-between text-base font-black mt-2 pt-2 border-t border-black border-dashed">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
         </div>
      </div>

      {/* PAGAMENTO */}
      <div className="mt-4 text-center border-2 border-black p-2 rounded">
         <p className="text-xs font-bold uppercase mb-1">FORMA DE PAGAMENTO</p>
         <p className="text-sm uppercase font-bold">
            {order.paymentMethod === 'pix' ? 'PIX (PAGO)' : 
             order.paymentMethod === 'credit_card' ? 'CARTÃO DE CRÉDITO (APP)' : 
             order.paymentMethod === 'cash' ? `DINHEIRO (Troco p/ ${formatCurrency(safeNum((order as any).changeFor))})` : 
             order.paymentMethod === 'card_machine' ? 'CARTÃO (MAQUINETA)' : order.paymentMethod}
         </p>
      </div>

      {/* RODAPÉ NOVO - COM AVISO E SITE */}
      <div className="mt-6 pt-3 border-t-2 border-black border-dashed text-center space-y-2">
        <div className="border border-black p-1 rounded">
             <p className="text-xs font-black uppercase">*** CONFIRA SEU PEDIDO ***</p>
             <p className="text-[10px]">Confira os itens no ato da entrega ou retirada.</p>
        </div>
        
        <div className="pt-2">
            <p className="text-[10px]">Peça novamente em:</p>
            <p className="text-sm font-black">www.descoontai.app</p>
        </div>
      </div>

    </div>
  );
};