import React from 'react';
import { Ticket, AlertTriangle, Tag, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface CouponSectionProps {
  isBlocked: boolean;
  appliedCoupon: any;
  onRemoveCoupon: () => void;
  couponInput: string;
  setCouponInput: (val: string) => void;
  onApplyCoupon: () => void;
  isApplying: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
}

export const CouponSection: React.FC<CouponSectionProps> = ({
  isBlocked, appliedCoupon, onRemoveCoupon, couponInput, setCouponInput, onApplyCoupon, isApplying, message
}) => {
  return (
    <div className={`bg-white border rounded-2xl p-4 shadow-sm transition-colors ${isBlocked ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3 tracking-wider"><Ticket size={14} /> Cupom</label>
      {isBlocked ? (
         <div className="flex items-start gap-3"><AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} /><p className="text-xs text-orange-800 font-medium leading-relaxed">Ofertas ativas na sacola. O uso de cupons está <strong>temporariamente suspenso</strong> para este pedido.</p></div>
      ) : appliedCoupon ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-xl animate-in zoom-in-95">
          <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-lg shadow-sm"><Tag size={14} className="text-green-600" /></div>
              <div>
                  <p className="font-bold text-green-800 text-sm">{appliedCoupon.code}</p>
                  <p className="text-[10px] text-green-600 font-medium">Desconto aplicado com sucesso!</p>
              </div>
          </div>
          <button onClick={onRemoveCoupon} className="text-xs text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Remover</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 relative">
            <input 
              type="text" 
              value={couponInput} 
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())} 
              placeholder="Código do cupom" 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none uppercase font-bold transition-all placeholder:font-normal placeholder:normal-case" 
            />
            <Button size="sm" onClick={onApplyCoupon} isLoading={isApplying} disabled={!couponInput} className="rounded-xl px-4">Aplicar</Button>
          </div>
          {message && <p className={`text-[11px] font-bold flex items-center gap-1 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {message.type === 'error' && <AlertCircle size={12}/>}
              {message.text}
          </p>}
        </div>
      )}
    </div>
  );
};