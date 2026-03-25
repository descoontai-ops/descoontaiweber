import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Auth/context/AuthContext';
import { listenToUserOrders } from '../services/myOrdersService';
import { OrderData } from '../../Orders/types';
import { OrderHistoryCard } from '../components/OrderHistoryCard';
import { OrderDetailsModal } from '../components/OrderDetailsModal'; // NOVO: Importando o Modal
import { Loader2, Receipt, AlertTriangle } from 'lucide-react';

export const MyOrdersScreen: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<string | null>(null);
  
  // NOVO: Estado para saber qual pedido está selecionado para abrir o Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    if (!user?.uid) {
       setLoading(false);
       return;
    }

    setLoading(true);
    setErrorType(null);
    
    const unsubscribe = listenToUserOrders(user.uid, (data, err) => {
      if (err) setErrorType(err);
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-4 px-4 pb-24 relative">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Receipt size={24} className="text-brand-600" /> Meus Pedidos
        </h1>
        <p className="text-gray-500 text-sm">Acompanhe seu histórico de compras.</p>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
            <p className="text-gray-500 text-sm">Buscando seus pedidos...</p>
        </div>
      ) : errorType === 'permission-denied' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h3 className="font-bold text-gray-800 mb-2">Bloqueado pelo Firebase</h3>
            <p className="text-sm text-gray-600">O Firestore está bloqueando a leitura por falta de permissão nas "Rules". Vá ao painel do Firebase e permita a leitura na coleção de orders.</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-1">
            {orders.map((order) => (
                <OrderHistoryCard 
                    key={order.id} 
                    order={order} 
                    onClick={() => setSelectedOrder(order)} // NOVO: Ativando o clique
                />
            ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Receipt size={32} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">Nenhum pedido ainda</h3>
            <p className="text-sm text-gray-500">Seus pedidos aparecerão aqui.</p>
        </div>
      )}

      {/* NOVO: Renderiza o Modal se tiver um pedido selecionado */}
      {selectedOrder && (
          <OrderDetailsModal 
              order={selectedOrder} 
              onClose={() => setSelectedOrder(null)} 
          />
      )}
    </div>
  );
};