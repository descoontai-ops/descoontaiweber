import React, { useState } from 'react';
import { Restaurant } from '../../../types';
import { SubscriptionStatusCard } from '../components/SubscriptionStatusCard';
import { PaymentModal } from '../components/PaymentModal';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, Beaker, CheckCircle2 } from 'lucide-react';
import { IS_SANDBOX } from '../config/asaasConfig';
import { useSubscriptionAutoCheck } from '../hooks/useSubscriptionAutoCheck';

interface MerchantSubscriptionScreenProps {
  restaurant: Restaurant;
}

export const MerchantSubscriptionScreen: React.FC<MerchantSubscriptionScreenProps> = ({ restaurant }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Hook que verifica datas e corrige o banco se necessário
  const { isDueToday, isOverdue } = useSubscriptionAutoCheck(restaurant);

  const status = restaurant.subscriptionStatus || 'trial';
  const isAutoSubscription = restaurant.subscriptionPaymentMethod === 'CREDIT_CARD';
  
  // Valor fixo do plano (simulado)
  const PLAN_PRICE = "R$ 49,90"; 

  const handleCancelSubscription = () => {
    const message = encodeURIComponent(`Olá, sou da loja *${restaurant.name}* e gostaria de solicitar o cancelamento da minha assinatura automática.`);
    window.open(`https://wa.me/5588999981618?text=${message}`, '_blank');
  };

  // Lógica para liberar o pagamento:
  // Libera se: Não for ativo OU for dia de pagar OU já tiver vencido
  const isPaymentAvailable = status !== 'active' || isDueToday || isOverdue;
  
  return (
    <div className="pb-24 animate-in fade-in">
       
       {/* Header da Tela */}
       <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-1">Financeiro & Assinatura</h2>
            <p className="text-gray-500 text-sm">Gerencie o pagamento da mensalidade do app.</p>
          </div>
          {IS_SANDBOX && (
             <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-orange-200 flex items-center gap-1 shadow-sm">
                <Beaker size={12} /> Modo Teste
             </div>
          )}
       </div>

       {/* Card de Status (Agora controla o aviso amarelo internamente via isDueToday) */}
       <SubscriptionStatusCard 
          status={status} 
          dueDate={restaurant.nextDueDate}
          isDueToday={isDueToday}
       />

       {/* Card do Plano */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 mt-6">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="font-bold text-gray-900 text-lg">Plano Parceiro PRO</h3>
                <p className="text-sm text-gray-500">Acesso completo a todas as funcionalidades.</p>
             </div>
             <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg font-bold text-lg">
                {PLAN_PRICE}<span className="text-xs font-normal">/mês</span>
             </div>
          </div>

          <ul className="space-y-2 text-sm text-gray-600 mb-6">
             <li className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" /> Cardápio Digital Ilimitado
             </li>
             <li className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" /> Painel de Gestão
             </li>
             <li className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" /> Link Personalizado
             </li>
             <li className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" /> Suporte Prioritário
             </li>
          </ul>

          {/* RENDERIZAÇÃO CONDICIONAL DOS BOTÕES */}
          
          {status === 'active' && isAutoSubscription && !isDueToday && !isOverdue ? (
              // CASO 1: Assinatura Automática Ativa (Botão Cancelar)
              <div className="space-y-3">
                 <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle2 size={16} />
                    <span>Sua assinatura está ativa e renovará automaticamente.</span>
                 </div>
                 <Button 
                    fullWidth 
                    variant="outline" 
                    onClick={handleCancelSubscription} 
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                 >
                    Cancelar Assinatura
                 </Button>
              </div>

          ) : !isPaymentAvailable ? (
             // CASO 2: Mensalidade em Dia (Botão Bloqueado Cinza Sólido)
             <Button 
                fullWidth 
                disabled 
                className="!bg-gray-200 !text-gray-500 !border-none cursor-not-allowed !opacity-100 hover:!bg-gray-200 shadow-none"
             >
                <CheckCircle2 size={18} className="mr-2 text-gray-500" /> 
                Mensalidade em Dia
             </Button>

          ) : (
             // CASO 3: Precisa Pagar (Trial, Vencido ou Vence Hoje)
             <Button 
               fullWidth 
               onClick={() => setShowPaymentModal(true)}
               variant="primary"
               className={isDueToday ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700" : ""}
             >
                {status === 'trial' ? 'Assinar Agora' : isDueToday ? 'Renovar Hoje' : 'Pagar Mensalidade'}
             </Button>
          )}
          
          {IS_SANDBOX && status !== 'active' && (
             <p className="text-center text-xs text-orange-500 mt-3 font-medium bg-orange-50 p-2 rounded">
                ⚠️ Atenção: Pagamentos neste modo são fictícios. O dinheiro não será cobrado.
             </p>
          )}
       </div>

       {/* Modal de Pagamento */}
       <PaymentModal 
          isOpen={showPaymentModal} 
          onClose={() => setShowPaymentModal(false)} 
          restaurant={restaurant} 
       />
    </div>
  );
};