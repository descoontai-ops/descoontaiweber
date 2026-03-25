import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Restaurant } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Lock, Save, FileText, CheckCircle2 } from 'lucide-react';

interface MerchantOrderSettingsProps {
  restaurant: Restaurant;
}

export const MerchantOrderSettings: React.FC<MerchantOrderSettingsProps> = ({ restaurant }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Carrega o PIN atual se existir (Verifica as duas possibilidades)
    if (restaurant.orderPin) {
      setPin(restaurant.orderPin);
    } else if ((restaurant as any).adminPin) {
      setPin((restaurant as any).adminPin);
    }
  }, [restaurant]);

  const handleSave = async () => {
    if (pin.length !== 4) {
      alert("A senha deve ter exatamente 4 números.");
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'merchants', restaurant.id);
      
      // Salva tanto em orderPin quanto adminPin para garantir que 
      // qualquer tela do app consiga ler a senha corretamente
      await updateDoc(docRef, {
        orderPin: pin,
        adminPin: pin
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar PIN:", error);
      alert("Erro ao salvar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">Segurança de Impressão</h3>
            <p className="text-sm text-gray-500">Proteja os links dos pedidos com uma senha.</p>
          </div>
        </div>

        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha de Acesso (PIN de 4 dígitos)
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-center text-2xl tracking-widest font-mono"
            />
            <Button onClick={handleSave} disabled={loading} className="w-32">
              {loading ? 'Salvando...' : (success ? <CheckCircle2 /> : <><Save size={18} className="mr-2"/> Salvar</>)}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Esta senha será solicitada sempre que alguém clicar no link "Imprimir Pedido" enviado no WhatsApp.
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
        <div className="flex items-start gap-3">
          <FileText className="text-yellow-600 mt-1" size={20} />
          <div>
            <h4 className="font-bold text-yellow-800 text-sm">Como funciona?</h4>
            <p className="text-sm text-yellow-700 mt-1">
              1. O cliente faz o pedido e envia no WhatsApp.<br/>
              2. No final da mensagem vai um link: <u>descoontai.app/imprimir/ID</u><br/>
              3. Ao clicar, pediremos essa senha que você definiu acima.<br/>
              4. Se a senha estiver correta, a nota fiscal aparece para edição e impressão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};