import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface OrderPinModalProps {
  correctPin?: string;
  onUnlock: () => void;
}

export const OrderPinModal: React.FC<OrderPinModalProps> = ({ correctPin, onUnlock }) => {
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Se não tiver PIN configurado na loja, libera geral (ou trava, dependendo da sua regra. Aqui libero 0000)
    const targetPin = correctPin || '0000'; 
    
    if (inputPin === targetPin) {
      onUnlock();
    } else {
      setError(true);
      setInputPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
          <Lock size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
        <p className="text-gray-500 text-sm mb-6">
          Digite a senha do estabelecimento para acessar e imprimir este pedido.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="tel"
            maxLength={4}
            value={inputPin}
            onChange={(e) => {
              setError(false);
              setInputPin(e.target.value);
            }}
            className={`w-full text-center text-3xl font-mono tracking-[0.5em] p-4 border rounded-xl outline-none transition-all mb-4 ${
              error 
                ? 'border-red-500 bg-red-50 text-red-600' 
                : 'border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50'
            }`}
            placeholder="••••"
          />
          
          {error && <p className="text-red-500 text-xs font-bold mb-4">Senha incorreta</p>}

          <button 
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Acessar Pedido <ArrowRight size={18} />
          </button>
        </form>
        
        {!correctPin && (
          <p className="text-xs text-gray-400 mt-4">
            * Senha padrão: 0000 (Configure no painel)
          </p>
        )}
      </div>
    </div>
  );
};