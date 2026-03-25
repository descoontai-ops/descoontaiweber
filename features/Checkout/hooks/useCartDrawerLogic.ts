import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../Restaurant/hooks/useCart';
import { useLocation } from '../../Location/context/LocationContext';
import { useAuth } from '../../Auth/context/AuthContext';
import { Restaurant } from '../../../types';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { generateWhatsAppLink } from '../utils/whatsappGenerator';
import { PAYMENT_METHODS } from '../../../constants';
import { createOrder } from '../../Orders/services/orderService';

export const useCartDrawerLogic = () => {
  const { 
    items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, 
    cartTotal, clearCart, appliedCoupon, applyCoupon, removeCoupon, 
    discountAmount, totalWithDiscount 
  } = useCart();

  const { location } = useLocation();
  const { user, savedAddresses } = useAuth();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phoneNumber || ''); 
  const [paymentMethod, setPaymentMethod] = useState('');
  const [changeAmount, setChangeAmount] = useState(''); 
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [observation, setObservation] = useState('');
  
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(() => {
    return !!localStorage.getItem('descoontai_pending_review');
  });

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      let restaurantId = null;

      if (items.length > 0) {
        restaurantId = items[0].restaurantId;
      } else {
        const pendingReviewId = localStorage.getItem('descoontai_pending_review');
        if (pendingReviewId && showReviewModal) {
          restaurantId = pendingReviewId;
        }
      }

      if (!restaurantId) {
        setActiveRestaurant(null);
        return;
      }

      if (activeRestaurant?.id === restaurantId) return;

      setIsLoadingRestaurant(true);
      try {
        const docRef = doc(db, 'merchants', restaurantId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setActiveRestaurant({ id: docSnap.id, ...docSnap.data() } as Restaurant);
        } else {
          console.error("Loja não encontrada no banco (merchants). ID:", restaurantId);
          setActiveRestaurant(null);
          if (items.length === 0) {
             setShowReviewModal(false);
             localStorage.removeItem('descoontai_pending_review');
          }
        }
      } catch (error) {
        console.error("Erro ao buscar restaurante:", error);
      } finally {
        setIsLoadingRestaurant(false);
      }
    };

    fetchRestaurant();
  }, [items, activeRestaurant, showReviewModal]); 

  useEffect(() => {
    if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
  }, [user]);

  const finalDeliveryAddress = useMemo(() => {
    if (user && savedAddresses.length > 0) {
      const selected = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
      return selected;
    }
    
    if (location) {
       return {
         street: location.address || '',
         number: location.number || '',
         neighborhood: location.district || '',
         city: location.city || '',
         state: location.state || '',
         complement: '',
         reference: ''
       };
    }
    return null;
  }, [user, savedAddresses, location]);

  const isDeliveryWithoutAddress = orderType === 'delivery' && !finalDeliveryAddress;

  const effectiveDeliveryFee = useMemo(() => {
    if (orderType === 'pickup') return 0;
    return activeRestaurant?.deliveryPrice || 0;
  }, [orderType, activeRestaurant]);

  const finalTotalToPay = Math.max(0, totalWithDiscount + effectiveDeliveryFee);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !activeRestaurant) return;
    setIsApplying(true);
    setCouponMsg(null);

    const result = await applyCoupon(couponInput, activeRestaurant.id);
    
    if (result.success) {
      setCouponMsg({ type: 'success', text: 'Cupom aplicado com sucesso!' });
      setCouponInput(''); 
    } else {
      setCouponMsg({ type: 'error', text: result.message || 'Cupom inválido.' });
    }
    setIsApplying(false);
  };

  const isCouponBlocked = !activeRestaurant;

  const handleReviewComplete = () => {
    localStorage.removeItem('descoontai_pending_review');
    setShowReviewModal(false);
  };

  const handleCheckout = async () => {
    if (!activeRestaurant) return;

    if (orderType === 'delivery' && !finalDeliveryAddress) {
      alert('Por favor, informe um endereço de entrega ou faça login.');
      setShowAddressManager(true);
      return;
    }

    if (!paymentMethod) {
      alert('Selecione uma forma de pagamento.');
      return;
    }
    
    if (!customerName.trim()) {
      alert('Por favor, digite seu nome.');
      return;
    }

    setIsGeneratingLink(true);

    try {
      let addressStr = '';
      if (orderType === 'delivery' && finalDeliveryAddress) {
        addressStr = `${finalDeliveryAddress.street}, ${finalDeliveryAddress.number} - ${finalDeliveryAddress.neighborhood}`;
        if (finalDeliveryAddress.complement) addressStr += ` (${finalDeliveryAddress.complement})`;
        if (finalDeliveryAddress.reference) addressStr += `\nRef: ${finalDeliveryAddress.reference}`;
      } else {
        addressStr = 'Retirada no Local';
      }

      // 1. CRIA O PEDIDO NO BANCO AGORA COM O USER ID
      const orderData = {
        userId: user?.uid || null, // <-- SALVANDO QUEM FEZ A COMPRA
        merchantId: activeRestaurant.id,
        merchantName: activeRestaurant.name,
        items: items,
        subtotal: cartTotal,
        deliveryFee: effectiveDeliveryFee,
        total: finalTotalToPay,
        deliveryMethod: orderType,
        customer: {
          name: customerName,
          phone: customerPhone,
          address: orderType === 'delivery' ? finalDeliveryAddress : null 
        },
        paymentMethod: paymentMethod === 'Dinheiro' && changeAmount 
          ? `Dinheiro (Troco para ${changeAmount})` 
          : paymentMethod,
        obs: observation,
        couponCode: appliedCoupon?.code || null 
      };

      const orderId = await createOrder(orderData as any);
      
      const baseUrl = window.location.origin;
      const printLink = `${baseUrl}/imprimir/${orderId}`;
      const printMessage = `\n\n🖨️ *IMPRIMIR PEDIDO (Link Editável):*\n${printLink}`;

      let link = generateWhatsAppLink(
        activeRestaurant,
        {
          customerName,
          paymentMethod,
          orderType,
          items,
          total: finalTotalToPay,
          deliveryFee: effectiveDeliveryFee,
          address: addressStr,
          changeFor: paymentMethod === 'Dinheiro' ? changeAmount : undefined,
          couponCode: appliedCoupon?.code,
          discountAmount: discountAmount
        }
      );
      
      link = `${link}${encodeURIComponent(printMessage)}`;

      localStorage.setItem('descoontai_pending_review', activeRestaurant.id);
      window.open(link, '_blank');
      
      setShowReviewModal(true);
      clearCart();
      setIsCartOpen(false);

    } catch (error) {
      console.error("Erro ao gerar pedido", error);
      alert("Erro ao processar o pedido. Tente novamente.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const openMap = () => {
    if (activeRestaurant?.address) {
      const query = encodeURIComponent(activeRestaurant.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const availablePaymentMethods = activeRestaurant?.paymentMethods || PAYMENT_METHODS;

  return {
    items, isCartOpen, setIsCartOpen, activeRestaurant, isLoadingRestaurant,
    updateQuantity, removeFromCart, clearCart,
    cartTotal, discountAmount, effectiveDeliveryFee, finalTotalToPay,
    finalDeliveryAddress, showAddressManager, setShowAddressManager, isDeliveryWithoutAddress, openMap,
    customerName, setCustomerName, paymentMethod, setPaymentMethod, availablePaymentMethods,
    changeAmount, setChangeAmount, orderType, setOrderType, handleCheckout,
    appliedCoupon, isCouponBlocked, couponInput, setCouponInput, handleApplyCoupon, removeCoupon, couponMsg, isApplying,
    showReviewModal, setShowReviewModal, handleReviewComplete,
    observation, setObservation,
    isGeneratingLink,
    customerPhone, setCustomerPhone
  };
};