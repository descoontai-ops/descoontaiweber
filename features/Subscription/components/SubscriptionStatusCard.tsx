import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Smartphone, CalendarDays, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SubscriptionStatus } from '../../../types';

interface SubscriptionStatusCardProps {
  status?: SubscriptionStatus;
  dueDate?: any;
  isDueToday?: boolean; // Nova prop para forçar o visual de "Hoje"
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({ status, dueDate, isDueToday }) => {
  
  const formatDate = (date: any) => {
    if (!date) return '---';
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
    }
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formattedDate = formatDate(dueDate);

  // 1. CASO ESPECIAL: VENCE HOJE (Prioridade visual)
  if (isDueToday) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-bold text-yellow-900 text-sm">Vence Hoje!</h3>
          <p className="text-yellow-800 text-sm mt-1">
            Sua assinatura expira hoje. Realize o pagamento para evitar o bloqueio automático amanhã.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-yellow-900 bg-yellow-200/50 p-1.5 rounded w-fit">
              <CalendarDays size={14} />
              Vencimento: {formattedDate}
           </div>
        </div>
      </div>
    );
  }

  // 2. TRIAL PENDING (Bloqueado esperando liberação)
  if (status === 'trial_pending') {
    const whatsappLink = "https://wa.me/5588999981618?text=Ol%C3%A1%2C%20acabei%20de%20me%20cadastrar%20no%20App%20Descoonta%C3%AD%20e%20gostaria%20de%20liberar%20meu%20teste%20gr%C3%A1tis%21";

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 z-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Clock size={24} /></div>
            <div>
              <h3 className="font-bold text-gray-900">Aguardando Liberação</h3>
              <p className="text-sm text-gray-500">Sua conta foi criada com sucesso!</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Para segurança da plataforma, liberamos o período de teste manualmente. 
            Clique abaixo para falar com o suporte e ativar sua loja agora mesmo.
          </p>
          <Button fullWidth onClick={() => window.open(whatsappLink, '_blank')} className="bg-green-600 hover:bg-green-700 text-white border-none">
            <Smartphone size={18} className="mr-2" /> Peça seu teste aqui
          </Button>
        </div>
      </div>
    );
  }

  // 3. TRIAL (Ativo)
  if (status === 'trial') {
    return (
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="text-brand-600 shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-bold text-brand-900 text-sm">Período de Teste Ativo</h3>
          <p className="text-brand-700 text-sm mt-1">Aproveite todas as funcionalidades gratuitamente.</p>
          {dueDate && (
             <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-800 bg-brand-100/50 p-1.5 rounded w-fit">
                <CalendarDays size={14} /> Encerra em: {formattedDate}
             </div>
          )}
        </div>
      </div>
    );
  }

  // 4. SUSPENSO / VENCIDO (Bloqueado)
  if (status === 'suspended' || status === 'overdue') {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-bold text-red-900 text-sm">Assinatura Pendente</h3>
          <p className="text-red-700 text-sm mt-1">Algumas funções estão bloqueadas. Regularize sua assinatura.</p>
          {dueDate && (
             <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-800 bg-red-100/50 p-1.5 rounded w-fit">
                <CalendarDays size={14} /> Venceu em: {formattedDate}
             </div>
          )}
        </div>
      </div>
    );
  }

  // 5. ATIVO (Pago)
  return (
    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
      <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <h3 className="font-bold text-green-900 text-sm">Assinatura Ativa</h3>
        <p className="text-green-700 text-sm mt-1">Sua loja está online e operando normalmente.</p>
        {dueDate && (
           <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-800 bg-green-100/50 p-1.5 rounded w-fit">
              <CalendarDays size={14} /> Próxima renovação: {formattedDate}
           </div>
        )}
      </div>
    </div>
  );
};