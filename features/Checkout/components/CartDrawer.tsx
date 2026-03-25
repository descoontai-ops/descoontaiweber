import React, { useRef } from 'react';
import { X, Loader2, ShoppingBag, AlertCircle } from 'lucide-react'; 
import { Button } from '../../../components/ui/Button';
import { AddressManagerModal } from '../../Settings/components/AddressManagerModal';
import { OrderReviewModal } from '../../Reviews/components/OrderReviewModal';

// Imports da Fatoração
import { useCartDrawerLogic } from '../hooks/useCartDrawerLogic';
import { CartItemList } from './CartDrawer/CartItemList';
import { DeliverySection } from './CartDrawer/DeliverySection';
import { CouponSection } from './CartDrawer/CouponSection';
import { PaymentSection } from './CartDrawer/PaymentSection';
import { CartFooter } from './CartDrawer/CartFooter';

// Componente Container Auxiliar
const DrawerContainer: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[60] flex justify-end">
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
    <div className="relative w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-white/50">
      {children}
    </div>
  </div>
);

export const CartDrawer: React.FC = () => {
  // O Hook cuida de tudo! 🧠
  const logic = useCartDrawerLogic();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!logic.isCartOpen && !logic.showReviewModal) return null;

  // --- Modal de Review ---
  if (logic.showReviewModal) {
    if (!logic.activeRestaurant || logic.isLoadingRestaurant) {
       return (
         <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex items-center justify-center">
            <Loader2 size={48} className="animate-spin text-brand-600" />
         </div>
       );
    }
    return (
      <OrderReviewModal 
        isOpen={true} 
        onClose={() => {
          localStorage.removeItem('descoontai_pending_review'); 
          logic.setShowReviewModal(false);
          logic.setIsCartOpen(false);
        }}
        onReviewSubmit={logic.handleReviewComplete}
        restaurantId={logic.activeRestaurant.id}
        restaurantName={logic.activeRestaurant.name}
      />
    );
  }

  // --- Loading ---
  if (logic.isLoadingRestaurant) return <DrawerContainer onClose={() => logic.setIsCartOpen(false)}><div className="flex flex-col items-center justify-center h-full text-brand-600"><Loader2 size={40} className="animate-spin" /></div></DrawerContainer>;
  
  // --- Carrinho Vazio ---
  if (logic.items.length === 0) return (
    <DrawerContainer onClose={() => logic.setIsCartOpen(false)}>
      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-2">
           <ShoppingBag size={40} className="opacity-30" />
        </div>
        <div className="text-center px-8">
           <h3 className="text-xl font-bold text-gray-800 mb-2">Sua sacola está vazia</h3>
           <p className="text-gray-500 text-sm mb-8">Parece que você ainda não escolheu seus pratos favoritos.</p>
           <Button onClick={() => logic.setIsCartOpen(false)} variant="secondary" className="px-8 rounded-full">Voltar para o Cardápio</Button>
        </div>
      </div>
    </DrawerContainer>
  );
  
  // --- Loja não encontrada ---
  if (!logic.activeRestaurant) return <DrawerContainer onClose={() => logic.setIsCartOpen(false)}><div className="flex flex-col items-center justify-center h-full p-6 text-center"><AlertCircle size={48} className="text-red-500 mb-4" /><p>Loja não encontrada.</p></div></DrawerContainer>;

  return (
    <>
      <DrawerContainer onClose={() => logic.setIsCartOpen(false)}>
          {/* Header */}
          <div className="flex flex-col px-6 pt-6 pb-4 bg-white z-10 sticky top-0">
            <div className="flex items-center justify-between mb-1">
               <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sacola</h2>
               <button onClick={() => logic.setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 font-medium">{logic.activeRestaurant.name}</p>
          </div>

          {/* Conteúdo com Scroll */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 pb-64 space-y-8 no-scrollbar scroll-smooth">
              <CartItemList 
                  items={logic.items} 
                  onRemove={logic.removeFromCart} 
                  onUpdateQuantity={logic.updateQuantity} 
              />
              
              <div className="w-full h-px bg-gray-100" />

              <DeliverySection 
                  orderType={logic.orderType}
                  setOrderType={logic.setOrderType}
                  finalDeliveryAddress={logic.finalDeliveryAddress}
                  activeRestaurant={logic.activeRestaurant}
                  onOpenAddressManager={() => logic.setShowAddressManager(true)}
                  onOpenMap={logic.openMap}
              />

              <CouponSection 
                  isBlocked={logic.isCouponBlocked}
                  appliedCoupon={logic.appliedCoupon}
                  onRemoveCoupon={logic.removeCoupon}
                  couponInput={logic.couponInput}
                  setCouponInput={logic.setCouponInput}
                  onApplyCoupon={logic.handleApplyCoupon}
                  isApplying={logic.isApplying}
                  message={logic.couponMsg}
              />

              <PaymentSection 
                  customerName={logic.customerName}
                  setCustomerName={logic.setCustomerName}
                  paymentMethod={logic.paymentMethod}
                  setPaymentMethod={logic.setPaymentMethod}
                  availableMethods={logic.availablePaymentMethods}
                  changeAmount={logic.changeAmount}
                  setChangeAmount={logic.setChangeAmount}
              />
          </div>

          {/* Footer */}
          <CartFooter 
              subtotal={logic.cartTotal}
              discount={logic.discountAmount}
              deliveryFee={logic.effectiveDeliveryFee}
              total={logic.finalTotalToPay}
              couponCode={logic.appliedCoupon?.code}
              onCheckout={logic.handleCheckout}
              isDisabled={logic.isDeliveryWithoutAddress || logic.customerName === '' || logic.paymentMethod === ''}
          />
      </DrawerContainer>
      
      <AddressManagerModal isOpen={logic.showAddressManager} onClose={() => logic.setShowAddressManager(false)} />
    </>
  );
};