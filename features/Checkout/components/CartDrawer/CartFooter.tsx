import React from 'react';
import { Button } from '../../../../components/ui/Button';

interface CartFooterProps {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  onCheckout: () => void;
  isDisabled: boolean;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  subtotal, discount, deliveryFee, total, couponCode, onCheckout, isDisabled
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100/50 z-20">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
        {discount > 0 && <div className="flex justify-between text-sm text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-lg -mx-2"><span>Desconto ({couponCode})</span><span>- R$ {discount.toFixed(2)}</span></div>}
        <div className="flex justify-between text-sm text-gray-500"><span>Taxa de Entrega</span><span>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span></div>
        
        <div className="flex justify-between items-end pt-3 mt-1">
          <span className="font-bold text-gray-800 text-lg">Total</span>
          <span className="font-extrabold text-2xl text-brand-600 tracking-tight">R$ {total.toFixed(2)}</span>
        </div>
      </div>
      
      <Button 
          fullWidth 
          size="lg" 
          onClick={onCheckout} 
          disabled={isDisabled} 
          className="h-14 rounded-2xl text-base shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform"
      >
          Finalizar Pedido no WhatsApp
      </Button>
    </div>
  );
};