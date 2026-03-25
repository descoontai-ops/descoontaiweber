import React, { useRef, useEffect } from 'react';
import { User, Check, QrCode, Banknote, CreditCard, Wallet } from 'lucide-react';

interface PaymentSectionProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  availableMethods: string[];
  changeAmount: string;
  setChangeAmount: (val: string) => void;
}

// Helper local para ícones
const getPaymentIcon = (method: string) => {
  const m = method.toLowerCase();
  if (m.includes('pix')) return <QrCode size={20} />;
  if (m.includes('dinheiro')) return <Banknote size={20} />;
  if (m.includes('crédito') || m.includes('débito') || m.includes('cartão')) return <CreditCard size={20} />;
  return <Wallet size={20} />;
};

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  customerName, setCustomerName, paymentMethod, setPaymentMethod, availableMethods, changeAmount, setChangeAmount
}) => {
  const changeInputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll quando dinheiro é selecionado
  useEffect(() => {
    if (paymentMethod === 'Dinheiro') {
        setTimeout(() => {
            changeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
  }, [paymentMethod]);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2 tracking-wider"><User size={16} /> Finalização</h3>
      
      <div className="space-y-4">
          {/* Input Nome */}
          <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
                  <User size={18} />
              </div>
              <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  placeholder="Seu Nome Completo" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
              />
          </div>

          {/* Seletor de Pagamento */}
          <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {availableMethods.map((method) => {
                   const isSelected = paymentMethod === method;
                   return (
                     <button
                       key={method}
                       onClick={() => setPaymentMethod(method)}
                       className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ease-out group ${
                          isSelected 
                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20 shadow-md transform scale-[1.02]' 
                            : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                       }`}
                     >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-brand-600 animate-in zoom-in spin-in-90 duration-300">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                        
                        <div className={`mb-2 p-2 rounded-full transition-colors ${isSelected ? 'bg-white text-brand-600' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}`}>
                           {getPaymentIcon(method)}
                        </div>
                        <span className="text-xs font-bold text-center leading-tight">{method}</span>
                     </button>
                   );
                })}
              </div>
          </div>

          {/* Troco */}
          {paymentMethod === 'Dinheiro' && (
              <div ref={changeInputRef} className="relative animate-in slide-in-from-top-2 fade-in scroll-mt-32">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-600">
                      <Banknote size={18} />
                  </div>
                  <input 
                      type="text" 
                      value={changeAmount} 
                      onChange={(e) => setChangeAmount(e.target.value)} 
                      placeholder="Troco para quanto? (Ex: 50,00)" 
                      className="w-full pl-10 pr-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 placeholder:text-green-800/50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium" 
                  />
              </div>
          )}
      </div>
    </div>
  );
};