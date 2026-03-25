import React, { useState, useEffect, useRef } from 'react';
import { generatePixPayment, checkPixStatus } from '../services/subscriptionService';
import { Loader2, Copy, Check, QrCode, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PixPaymentFormProps {
  restaurantId: string;
  onSuccess: () => void;
}

export const PixPaymentForm: React.FC<PixPaymentFormProps> = ({ restaurantId, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<{payload: string, qrCodeImage: string, paymentId: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null); // Feedback visual
  
  // Controle de CPF Inválido
  const [needsCpf, setNeedsCpf] = useState(false);
  const [cpfInput, setCpfInput] = useState('');
  
  const intervalRef = useRef<any>(null);

  const tryGeneratePix = async (cpf?: string) => {
    setLoading(true);
    setError(null);
    setNeedsCpf(false);

    try {
        const data = await generatePixPayment(restaurantId, cpf);
        setPixData(data);
    } catch (e: any) {
        console.error(e);
        if (e.message === "CPF_INVALIDO" || e.message.includes("CPF")) {
            setNeedsCpf(true);
        } else {
            setError(e.message || "Erro ao gerar QR Code.");
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    tryGeneratePix();
    return () => stopPolling();
  }, [restaurantId]);

  useEffect(() => {
    if (pixData?.paymentId) {
      startPolling(pixData.paymentId);
    }
  }, [pixData]);

  const startPolling = (paymentId: string) => {
    stopPolling();
    intervalRef.current = setInterval(async () => {
       // Verificação silenciosa
       const { paid } = await checkPixStatus(paymentId, restaurantId);
       if (paid) {
         stopPolling();
         onSuccess();
       }
    }, 5000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleCopy = () => {
    if (pixData) {
        navigator.clipboard.writeText(pixData.payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualCheck = async () => {
      if (!pixData?.paymentId) return;

      setIsVerifying(true);
      setStatusMessage(null);

      const { paid, status } = await checkPixStatus(pixData.paymentId, restaurantId);
      
      setIsVerifying(false);
      
      if (paid) {
          if (status === "DB_ERROR") {
             alert("Pagamento recebido, mas houve um erro ao ativar sua loja. Entre em contato com o suporte.");
          }
          onSuccess();
      } else {
          // Traduz o status para o usuário
          let msg = "Ainda não confirmado.";
          if (status === 'PENDING') msg = "O banco informa que o pagamento ainda está Pendente. Aguarde alguns instantes.";
          if (status === 'NETWORK_ERROR') msg = "Erro de conexão ao verificar. Tente novamente.";
          
          setStatusMessage(msg);
      }
  };

  // --- TELA DE CPF ---
  if (needsCpf) {
      return (
          <div className="flex flex-col items-center text-center p-4 animate-in fade-in">
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-full mb-4">
                  <AlertCircle size={32} />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Dados Incompletos</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                  Para gerar o PIX com segurança, o banco exige um CPF válido.
              </p>
              
              <div className="w-full max-w-xs space-y-3">
                  <input 
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpfInput}
                      onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setCpfInput(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all text-center text-lg tracking-widest"
                  />
                  
                  <Button 
                      fullWidth 
                      size="lg" 
                      onClick={() => tryGeneratePix(cpfInput)}
                      disabled={cpfInput.replace(/\D/g, '').length < 11}
                      className="bg-brand-600 hover:bg-brand-700 text-white"
                  >
                      Gerar PIX Agora <ArrowRight size={18} className="ml-2" />
                  </Button>
              </div>
          </div>
      );
  }

  if (loading) {
      return <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="animate-spin text-brand-600" size={40} />
          <p className="text-sm text-gray-500 font-medium">Gerando cobrança...</p>
      </div>;
  }

  if (error) {
      return <div className="text-red-500 text-center p-6 bg-red-50 rounded-xl border border-red-100 m-2">
          <p className="font-bold mb-2">Ops!</p>
          {error}
      </div>;
  }

  if (!pixData) return null;

  // --- TELA QR CODE ---
  return (
    <div className="flex flex-col items-center text-center space-y-6 pt-2 animate-in slide-in-from-right">
       
       <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 relative group">
          <img src={pixData.qrCodeImage} alt="QR Code Pix" className="w-48 h-48 object-contain mix-blend-multiply" />
       </div>

       <div className="w-full">
          <p className="text-sm text-gray-500 mb-2 flex items-center justify-center gap-2">
             <QrCode size={16} /> Código Pix Copia e Cola:
          </p>
          <div className="flex gap-2">
             <input 
               readOnly 
               value={pixData.payload} 
               className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 text-xs text-gray-600 outline-none font-mono"
             />
             <button 
               onClick={handleCopy}
               className={`p-3 rounded-lg transition-all active:scale-95 ${copied ? 'bg-green-500 text-white shadow-green-200' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200'} shadow-lg`}
             >
                {copied ? <Check size={20} /> : <Copy size={20} />}
             </button>
          </div>
       </div>

       {/* FEEDBACK STATUS */}
       <div className={`p-4 rounded-xl text-sm border w-full flex items-start gap-3 text-left transition-all ${statusMessage ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
          <div className={`p-2 rounded-full shrink-0 ${statusMessage ? 'bg-orange-100' : 'bg-blue-100'}`}>
             {statusMessage ? <AlertCircle size={18} className="text-orange-600" /> : <Loader2 size={18} className="animate-spin text-blue-600" />} 
          </div>
          <div>
              <p className="font-bold mb-0.5">{statusMessage ? 'Atenção:' : 'Aguardando confirmação...'}</p>
              <p className="text-xs leading-relaxed opacity-90">
                 {statusMessage || "Abra o app do seu banco e pague. A confirmação é automática."}
              </p>
          </div>
       </div>

       <Button 
         fullWidth 
         variant="outline"
         onClick={handleManualCheck} 
         isLoading={isVerifying}
         className="border-gray-300 text-gray-600 hover:bg-gray-50"
       >
          <RefreshCw size={16} className={`mr-2 ${isVerifying ? 'animate-spin' : ''}`} /> 
          Verificar Pagamento Agora
       </Button>
    </div>
  );
};