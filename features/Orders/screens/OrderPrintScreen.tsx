import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Printer, Loader2, Edit2, AlertTriangle, Plus, X, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useOrderPrint } from '../hooks/useOrderPrint';
import { PrintableTicket } from '../components/PrintableTicket';
import { OrderPinModal } from '../components/OrderPinModal';
import { updateOrderStatus } from '../services/orderService';

export const OrderPrintScreen: React.FC = () => {
  const params = useParams();
  const location = useLocation();

  const getOrderIdFromUrl = () => {
    if (params.orderId) return params.orderId;
    if (params.id) return params.id;
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && !['imprimir', 'print'].includes(lastSegment)) return lastSegment;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('id') || searchParams.get('orderId');
  };

  const orderId = getOrderIdFromUrl();
  const { 
    order, loading, error, merchantPin,
    editableItems, editableTotal, editableObs, 
    addItem, updateItem, removeItem, setEditableObs 
  } = useOrderPrint(orderId);

  const [isLocked, setIsLocked] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (order?.merchantId) {
      const sessionKey = `merchant_session_${order.merchantId}`;
      const savedSession = localStorage.getItem(sessionKey);
      if (savedSession) {
        try {
          const { timestamp } = JSON.parse(savedSession);
          if (Date.now() - timestamp < 12 * 60 * 60 * 1000) setIsLocked(false);
        } catch (e) {}
      }
      setCheckingSession(false);
    } else if (!loading && !order) {
       setCheckingSession(false);
    }
  }, [order, loading]);

  const handleUnlock = () => {
    setIsLocked(false);
    if (order?.merchantId) {
      localStorage.setItem(`merchant_session_${order.merchantId}`, JSON.stringify({ timestamp: Date.now() }));
    }
  };

  const handleAddNewItem = () => {
    if (newItemName && newItemPrice) {
        const price = parseFloat(newItemPrice.replace(',', '.')) || 0;
        addItem(newItemQty, newItemName, price);
        setShowAddItem(false);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemQty(1);
    }
  };

  // NOVA FUNÇÃO: À PROVA DE FALHAS
  const handleConfirmAndPrint = async () => {
    if (!orderId) {
        alert("Erro: ID do pedido não encontrado.");
        return;
    }
    setIsConfirming(true);
    try {
      // Usa 'accepted' que é o status oficial do seu app
      await updateOrderStatus(orderId, 'accepted');
    } catch (err: any) {
      console.error("Erro ao confirmar:", err);
      // Se falhar (ex: por falta de login no app), avisa, mas DEIXA IMPRIMIR!
      const msg = err.message || "";
      if (msg.includes('permission') || msg.includes('Missing')) {
          alert("Aviso: O pedido será impresso, mas como você não está logado no painel, o status do cliente não será atualizado.");
      } else {
          alert("Erro de conexão ao atualizar status, mas o cupom será impresso mesmo assim!");
      }
    } finally {
      setShowConfirmModal(false);
      setIsConfirming(false);
      // Imprime de qualquer jeito
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  if (loading || checkingSession) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><Loader2 className="animate-spin text-brand-600" size={40}/></div>;
  if (error || !order) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4"><AlertTriangle size={32} className="text-red-500 mb-2"/><p className="text-gray-600">{error || "Erro ao carregar."}</p></div>;
  if (isLocked) return <OrderPinModal correctPin={merchantPin} onUnlock={handleUnlock} />;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center animate-in fade-in">
      
      <div className="print:hidden w-full max-w-[80mm] mb-6 space-y-3">
        <Button onClick={() => setShowConfirmModal(true)} className="w-full bg-gray-900 text-white hover:bg-black h-12 text-lg shadow-xl">
          <Printer size={20} className="mr-2" /> IMPRIMIR
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddItem(true)} className="bg-white border-dashed border-2 border-brand-200 text-brand-700 hover:bg-brand-50">
                <Plus size={16} className="mr-1"/> Adicionar Item
            </Button>
            <div className="flex items-center justify-center text-xs text-gray-500 bg-white rounded border border-gray-200">
                <Edit2 size={12} className="mr-1 text-blue-500"/> Edite na nota abaixo
            </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 print:hidden">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={28} />
                </div>
                <h3 className="font-bold text-xl text-gray-800 mb-2">Confirmar Pedido?</h3>
                <p className="text-sm text-gray-600 mb-6">Ao confirmar, o cliente será avisado que o pedido está sendo preparado e a nota será impressa.</p>
                <div className="space-y-2">
                    <Button fullWidth onClick={handleConfirmAndPrint} disabled={isConfirming}>
                        {isConfirming ? <Loader2 size={20} className="animate-spin" /> : "Sim, Confirmar e Imprimir"}
                    </Button>
                    <Button fullWidth variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isConfirming}>
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
      )}

      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
            <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Adicionar Item Extra</h3>
                    <button onClick={() => setShowAddItem(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="w-20">
                            <label className="text-xs font-bold text-gray-500">Qtd</label>
                            <input type="number" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full p-2 border rounded bg-gray-50 font-bold text-center" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500">Nome do Item</label>
                            <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-2 border rounded bg-gray-50" placeholder="Ex: Bebida Extra" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Valor Unitário (R$)</label>
                        <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-full p-2 border rounded bg-gray-50" placeholder="0.00" />
                    </div>
                    <Button fullWidth onClick={handleAddNewItem}>Adicionar à Nota</Button>
                </div>
            </div>
        </div>
      )}

      <PrintableTicket 
        order={order}
        items={editableItems}
        total={editableTotal}
        obs={editableObs}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
        onUpdateObs={setEditableObs}
      />

      <style>{`@media print { body { background: white; } @page { margin: 0; size: auto; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
};