import { CartItem } from '../../Restaurant/context/CartContext';

export interface OrderCustomer {
  name: string;
  phone: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    city?: string;
    state?: string;
    reference?: string;
  };
}

export interface OrderData {
  id?: string;
  userId?: string; // <-- A MÁGICA ACONTECE AQUI
  merchantId: string;
  merchantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: 'delivery' | 'pickup';
  customer: OrderCustomer;
  paymentMethod: string;
  obs?: string;
  couponCode?: string;
  createdAt: any;
  status: 'pending' | 'accepted' | 'rejected';
}