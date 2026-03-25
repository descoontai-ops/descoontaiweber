import React, { useState } from 'react';
import { processCreditCardPayment } from '../services/subscriptionService';
import { Button } from '../../../components/ui/Button';
import { CreditCard, Calendar, Lock, User, AlertCircle } from 'lucide-react';

interface CreditCardFormProps {
  restaurantId: string;
  onSuccess: () => void;
  isRecurrent: boolean; // Agora aceita a prop que o PaymentModal envia
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({ restaurantId, onSuccess, isRecurrent }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
    cpfCnpj: '',
    phone: '',
    postalCode: '',
    addressNumber: ''
  });

  // Formatações automáticas
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formatted = value;

    if (name === 'number') formatted = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
    if (name === 'expiry') formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 5);
    if (name === 'cvv') formatted = value.replace(/\D/g, '').substring(0, 4);
    if (name === 'cpfCnpj') formatted = value.replace(/\D/g, '').substring(0, 14); // Limita tamanho
    
    setFormData(prev => ({ ...prev, [name]: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação Básica Frontend
    if (formData.number.length < 16) { setError("Número do cartão incompleto."); setLoading(false); return; }
    if (formData.cpfCnpj.length < 11) { setError("CPF/CNPJ inválido (Mínimo 11 dígitos)."); setLoading(false); return; }

    try {
      await processCreditCardPayment(restaurantId, {
         ...formData,
         email: 'financeiro@restaurante.com' // Pode pegar do user se tiver
      }, isRecurrent);
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao processar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
       
       {error && (
         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} />
            {error}
         </div>
       )}

       <div className="space-y-3">
          {/* Número do Cartão */}
          <div className="relative">
             <CreditCard className="absolute left-3 top-3 text-gray-400" size={18} />
             <input 
               name="number"
               placeholder="0000 0000 0000 0000"
               value={formData.number}
               onChange={handleChange}
               className="w-full pl-10 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
               required
             />
          </div>

          {/* Nome no Cartão */}
          <div className="relative">
             <User className="absolute left-3 top-3 text-gray-400" size={18} />
             <input 
               name="holder"
               placeholder="Nome impresso no cartão"
               value={formData.holder}
               onChange={e => setFormData({...formData, holder: e.target.value.toUpperCase()})}
               className="w-full pl-10 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
               required
             />
          </div>

          {/* Validade e CVV */}
          <div className="flex gap-3">
             <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  name="expiry"
                  placeholder="MM/AA"
                  value={formData.expiry}
                  onChange={handleChange}
                  className="w-full pl-10 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  required
                />
             </div>
             <div className="relative w-1/3">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  name="cvv"
                  placeholder="CVV"
                  value={formData.cvv}
                  onChange={handleChange}
                  className="w-full pl-10 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  required
                />
             </div>
          </div>

          <hr className="border-gray-100 my-2" />
          
          <p className="text-xs text-gray-500 font-medium">Dados do Titular (Obrigatório pelo Banco)</p>

          {/* CPF e Celular */}
          <div className="flex gap-3">
             <input 
               name="cpfCnpj"
               placeholder="CPF/CNPJ do Titular"
               value={formData.cpfCnpj}
               onChange={handleChange}
               className="flex-1 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
               required
             />
             <input 
               name="phone"
               placeholder="Celular (DDD)"
               value={formData.phone}
               onChange={handleChange}
               className="flex-1 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
               required
             />
          </div>

          {/* Endereço Simplificado */}
          <div className="flex gap-3">
             <input 
               name="postalCode"
               placeholder="CEP"
               value={formData.postalCode}
               onChange={handleChange}
               className="w-1/3 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
               required
             />
             <input 
               name="addressNumber"
               placeholder="Número da Casa"
               value={formData.addressNumber}
               onChange={handleChange}
               className="flex-1 p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
               required
             />
          </div>
       </div>

       <Button 
         type="submit" 
         fullWidth 
         size="lg" 
         isLoading={loading}
         className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold"
       >
          {loading ? 'Processando...' : `Pagar ${isRecurrent ? 'Assinatura' : ''}`}
       </Button>
    </form>
  );
};