import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { CartItem, Product, SelectedGrouping } from '../../../types';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Definição do tipo do Cupom para o Carrinho
interface AppliedCoupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue: number;
  merchantId: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, restaurantId: string, selectedGroups?: SelectedGrouping[], note?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  
  // --- MÉTODOS PARA CUPOM ---
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string, merchantId: string) => Promise<{success: boolean, message: string}>;
  removeCoupon: () => void;
  discountAmount: number;
  totalWithDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializa items do localStorage se existirem
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('@descoontai:cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Salva no localStorage sempre que items mudar
  useEffect(() => {
    localStorage.setItem('@descoontai:cart', JSON.stringify(items));
  }, [items]);

  // 1. Cálculo do Subtotal (Sem desconto)
  const cartTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      let addonsPrice = 0;
      if (item.selectedGroups) {
        item.selectedGroups.forEach(group => {
          group.items.forEach(addon => {
            addonsPrice += addon.price;
          });
        });
      }
      const unitTotal = item.price + addonsPrice;
      return sum + (unitTotal * item.quantity);
    }, 0);
  }, [items]);

  // 2. MONITORAMENTO AUTOMÁTICO DO CUPOM
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrderValue > 0) {
      if (cartTotal < appliedCoupon.minOrderValue) {
        setAppliedCoupon(null);
      }
    }
  }, [cartTotal, appliedCoupon]);

  // 3. Cálculo do Desconto
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartTotal < appliedCoupon.minOrderValue) return 0;

    if (appliedCoupon.type === 'percent') {
      return cartTotal * (appliedCoupon.value / 100);
    } else {
      return Math.min(appliedCoupon.value, cartTotal);
    }
  }, [appliedCoupon, cartTotal]);

  const totalWithDiscount = Math.max(0, cartTotal - discountAmount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // 4. Função para Aplicar Cupom
  const applyCoupon = async (code: string, merchantId: string) => {
    try {
      const cleanCode = code.toUpperCase().trim();
      
      const q = query(
        collection(db, 'merchants', merchantId, 'coupons'),
        where('code', '==', cleanCode),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: "Cupom inválido ou expirado." };
      }

      const couponData = querySnapshot.docs[0].data();
      const couponId = querySnapshot.docs[0].id;

      if (cartTotal < (couponData.minOrderValue || 0)) {
        return { 
          success: false, 
          message: `Adicione mais R$ ${(couponData.minOrderValue - cartTotal).toFixed(2)} para usar este cupom.` 
        };
      }

      setAppliedCoupon({
        id: couponId,
        code: cleanCode,
        type: couponData.type,
        value: couponData.value,
        minOrderValue: couponData.minOrderValue || 0,
        merchantId: merchantId
      });

      return { success: true, message: "Cupom aplicado com sucesso! 🎉" };

    } catch (error) {
      console.error("Erro ao aplicar cupom:", error);
      return { success: false, message: "Erro ao validar cupom." };
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  // --- ADD TO CART (COM CORREÇÃO PARA NÃO ABRIR O CARRINHO SOZINHO) ---
  const addToCart = (product: Product, quantity: number, restaurantId: string, selectedGroups?: SelectedGrouping[], note?: string) => {
    
    // 1. Verificação de Conflito de Restaurante
    if (items.length > 0) {
        const currentRestaurantId = items[0].restaurantId;
        
        if (currentRestaurantId !== restaurantId) {
            const confirmSwitch = window.confirm(
                "⚠️ Atenção\n\nVocê já tem itens de outro restaurante na sacola. Deseja limpar a sacola atual para adicionar itens deste novo restaurante?"
            );

            if (confirmSwitch) {
                setAppliedCoupon(null);
                const uniqueId = `${product.id}-${Date.now()}`; 
                const newItem: CartItem = {
                    ...product,
                    id: uniqueId, 
                    quantity,
                    restaurantId: restaurantId,
                    note: note || '',
                    selectedGroups: selectedGroups || []
                };
                setItems([newItem]);
                return;
            } else {
                return;
            }
        }
    }

    // 2. Fluxo Normal
    setItems(prev => {
      const uniqueId = `${product.id}-${Date.now()}`; 
      const newItem: CartItem = {
        ...product,
        id: uniqueId, 
        quantity,
        restaurantId: restaurantId,
        note: note || '',
        selectedGroups: selectedGroups || []
      };
      return [...prev, newItem];
    });
    
    // REMOVI A LINHA: setIsCartOpen(true);
    // Agora o carrinho fica fechado até o usuário clicar no botão flutuante.
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    if (items.length <= 1) setAppliedCoupon(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem('@descoontai:cart');
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      itemCount,
      isCartOpen,
      setIsCartOpen,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      discountAmount,
      totalWithDiscount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};