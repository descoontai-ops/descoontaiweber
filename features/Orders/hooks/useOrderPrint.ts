import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { OrderData } from '../types';
import { getOrderById } from '../services/orderService';

export const useOrderPrint = (orderId: string | undefined) => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Edição
  const [merchantPin, setMerchantPin] = useState('0000'); // Começa com padrão, mas atualiza
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [editableTotal, setEditableTotal] = useState(0);
  const [editableObs, setEditableObs] = useState('');

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);
        if (!orderId) {
            setError("ID inválido.");
            setLoading(false);
            return;
        }

        const data = await getOrderById(orderId);

        if (data) {
          setOrder(data);
          
          // Prepara itens garantindo que são numéricos para evitar NaN
          const safeItems = (data.items || []).map(item => ({
            ...item,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            total: (Number(item.quantity) || 1) * (Number(item.price) || 0)
          }));

          setEditableItems(safeItems);
          setEditableTotal(Number(data.total) || 0);
          setEditableObs(data.observation || '');

          // BUSCA O PIN ATUALIZADO DA LOJA (CORRIGIDO)
          if (data.merchantId) {
            const merchantRef = doc(db, 'merchants', data.merchantId);
            const merchantSnap = await getDoc(merchantRef);
            if (merchantSnap.exists()) {
                const mData = merchantSnap.data();
                // Agora ele procura o orderPin primeiro (que é o que o painel salva)
                setMerchantPin(mData.orderPin || mData.adminPin || '0000');
            }
          }
        } else {
          setError("Pedido não encontrado.");
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar pedido.");
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  // --- FUNÇÕES DE EDIÇÃO PROFISSIONAL ---

  // Recalcula o total geral baseado nos itens + taxa de entrega
  const recalculateTotal = (items: any[]) => {
    const itemsTotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const deliveryFee = Number(order?.deliveryFee) || 0;
    setEditableTotal(itemsTotal + deliveryFee);
  };

  const addItem = (qty: number, name: string, price: number) => {
    const newItem = {
        quantity: qty,
        name: name,
        price: price,
        total: qty * price
    };
    const newItems = [...editableItems, newItem];
    setEditableItems(newItems);
    recalculateTotal(newItems);
  };

  const updateItem = (index: number, field: 'quantity' | 'name' | 'price', value: any) => {
    const newItems = [...editableItems];
    const item = { ...newItems[index] };

    if (field === 'quantity') {
        item.quantity = Number(value) || 0;
        item.total = item.quantity * item.price;
    } else if (field === 'price') {
        item.price = Number(value) || 0;
        item.total = item.quantity * item.price;
    } else {
        item.name = value;
    }

    newItems[index] = item;
    setEditableItems(newItems);
    recalculateTotal(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...editableItems];
    newItems.splice(index, 1);
    setEditableItems(newItems);
    recalculateTotal(newItems);
  };

  return {
    order, loading, error, merchantPin,
    editableItems, editableTotal, editableObs,
    addItem, updateItem, removeItem, setEditableObs
  };
};