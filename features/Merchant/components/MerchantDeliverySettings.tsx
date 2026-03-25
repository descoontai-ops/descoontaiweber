import React, { useState, useEffect } from 'react';
import { Truck, Map, Info, Save, AlertTriangle, Gift } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore'; // Import necessário para salvar
import { db } from '../../../lib/firebase'; // Import do banco de dados
import { DeliveryConfig, Restaurant } from '../../../types';
import { IGUATU_NEIGHBORHOODS } from '../../../constants';
import { Button } from '../../../components/ui/Button';
import { toast } from 'react-hot-toast'; // Opcional, para feedback visual

// CORREÇÃO: Agora aceita o objeto restaurant inteiro, igual a tela Dashboard envia
interface MerchantDeliverySettingsProps {
  restaurant: Restaurant;
}

export const MerchantDeliverySettings: React.FC<MerchantDeliverySettingsProps> = ({ restaurant }) => {
  // BLINDAGEM: Se não tiver config, cria uma padrão na memória para não travar a tela
  const safeConfig: DeliveryConfig = restaurant?.deliveryConfig || {
    type: 'fixed',
    fixedPrice: 0,
    neighborhoodPrices: {}
  };

  const [activeTab, setActiveTab] = useState<'fixed' | 'neighborhood'>(safeConfig.type || 'fixed');
  
  const [fixedPriceStr, setFixedPriceStr] = useState<string>(
    safeConfig.fixedPrice ? safeConfig.fixedPrice.toFixed(2).replace('.', ',') : ''
  );
  
  const [pricesStr, setPricesStr] = useState<Record<string, string>>({});
  const [bulkPriceStr, setBulkPriceStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Carrega os preços ao iniciar (com proteção contra valores nulos)
  useEffect(() => {
    const initialPrices: Record<string, string> = {};
    if (IGUATU_NEIGHBORHOODS) {
        IGUATU_NEIGHBORHOODS.forEach(bairro => {
        const val = safeConfig.neighborhoodPrices?.[bairro];
        initialPrices[bairro] = val !== undefined ? val.toFixed(2).replace('.', ',') : '';
        });
    }
    setPricesStr(initialPrices);
  }, [restaurant]); // Recarrega se o restaurante mudar

  // Função auxiliar para checar se é grátis (Vazio ou 0)
  const isFree = (val?: string) => {
      if (!val) return true;
      const num = parseFloat(val.replace(',', '.'));
      return isNaN(num) || num === 0;
  };

  const handlePriceChange = (bairro: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    setPricesStr(prev => ({
      ...prev,
      [bairro]: cleanValue
    }));
  };

  const applyBulkPrice = () => {
    if (!bulkPriceStr) return;
    const cleanBulk = bulkPriceStr.replace(/[^0-9.,]/g, '');
    const newPrices = { ...pricesStr };
    IGUATU_NEIGHBORHOODS.forEach(bairro => {
      newPrices[bairro] = cleanBulk;
    });
    setPricesStr(newPrices);
  };

  // FUNÇÃO DE SALVAR BLINDADA
  const handleSave = async () => {
    if (!restaurant?.id) return; // Proteção extra

    setIsSaving(true);

    try {
        const fixedPriceNum = parseFloat(fixedPriceStr.replace(',', '.')) || 0;
        const neighborhoodPricesNum: Record<string, number> = {};
        
        Object.keys(pricesStr).forEach(bairro => {
        const valStr = pricesStr[bairro];
        if (valStr && valStr.trim() !== '') {
            const valNum = parseFloat(valStr.replace(',', '.'));
            if (!isNaN(valNum)) {
            neighborhoodPricesNum[bairro] = valNum;
            }
        } else {
            neighborhoodPricesNum[bairro] = 0;
        }
        });

        const newConfig: DeliveryConfig = {
            type: activeTab,
            fixedPrice: fixedPriceNum,
            neighborhoodPrices: neighborhoodPricesNum
        };

        // Salva direto no Firebase
        const docRef = doc(db, 'merchants', restaurant.id);
        await updateDoc(docRef, {
            deliveryConfig: newConfig
        });
        
        // Feedback simples
        alert('Configurações de entrega atualizadas com sucesso!');
        
    } catch (error) {
        console.error("Erro ao salvar entrega:", error);
        alert('Erro ao salvar. Verifique sua conexão.');
    } finally {
        setIsSaving(false);
    }
  };

  const DARK_INPUT_CLASS = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-white placeholder-gray-500";
  const DARK_INPUT_SMALL = "w-full pl-7 pr-3 py-1.5 bg-gray-800 border border-transparent rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none text-right font-medium text-white placeholder-gray-500";

  return (
    <div className="space-y-6">
      
      {/* Alerta Geral Informativo */}
      <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm border border-blue-100">
        <Info className="shrink-0" size={20} />
        <div>
          <p className="font-bold mb-1">Gerenciamento de Taxas</p>
          <p>Configure abaixo quanto seu cliente pagará pela entrega. Valores deixados em branco ou R$ 0,00 serão considerados <strong className="text-green-700">Frete Grátis</strong>.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('fixed')}
          className={`pb-3 px-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'fixed' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Truck size={18} /> Taxa Fixa
        </button>
        <button 
          onClick={() => setActiveTab('neighborhood')}
          className={`pb-3 px-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'neighborhood' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Map size={18} /> Por Bairro (Iguatu)
        </button>
      </div>

      {/* Conteúdo: Taxa Fixa */}
      {activeTab === 'fixed' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 animate-in fade-in shadow-sm">
           <label className="block text-sm font-bold text-gray-700 mb-2">Valor da Entrega (Toda a Cidade)</label>
           
           <div className="relative max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
              <input 
                type="text"
                inputMode="decimal"
                value={fixedPriceStr}
                onChange={(e) => setFixedPriceStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                className={DARK_INPUT_CLASS}
                placeholder="0,00"
              />
           </div>

           {isFree(fixedPriceStr) && (
             <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Gift className="text-brand-600 shrink-0 mt-0.5" size={18} />
                <div>
                   <p className="text-sm font-bold text-gray-800">Atenção: Frete Grátis Ativado</p>
                   <p className="text-xs text-gray-600 mt-0.5">Como o valor está zerado, os clientes não pagarão taxa de entrega.</p>
                </div>
             </div>
           )}

           <p className="text-xs text-gray-500 mt-2">Este valor será cobrado independente do endereço do cliente.</p>
        </div>
      )}

      {/* Conteúdo: Por Bairro */}
      {activeTab === 'neighborhood' && (
        <div className="space-y-4 animate-in fade-in">
          
          <div className="bg-gray-50 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3 border border-gray-200 shadow-inner">
             <div className="flex-1 w-full">
               <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Aplicar valor padrão a todos</label>
               <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={bulkPriceStr}
                    onChange={(e) => setBulkPriceStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium text-white placeholder-gray-500"
                    placeholder="0,00"
                  />
               </div>
             </div>
             <Button variant="secondary" size="sm" onClick={applyBulkPrice} className="bg-white border border-gray-300 shadow-sm hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200">
               Aplicar a Todos
             </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
             <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                {IGUATU_NEIGHBORHOODS.map(bairro => {
                  const free = isFree(pricesStr[bairro]);
                  return (
                    <div key={bairro} className={`flex items-center justify-between p-3 transition-colors group ${free ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                         {free && <AlertTriangle size={14} className="text-yellow-600" title="Frete Grátis neste bairro" />}
                         <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{bairro}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {free && <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide mr-1">Grátis</span>}
                        <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                            <input 
                              type="text"
                              inputMode="decimal"
                              value={pricesStr[bairro] || ''}
                              onChange={(e) => handlePriceChange(bairro, e.target.value)}
                              className={`${DARK_INPUT_SMALL} ${free ? 'ring-1 ring-yellow-400 bg-yellow-900/10 text-yellow-900 placeholder-yellow-700/50' : ''}`}
                              placeholder="0,00"
                            />
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {/* Footer Fixo de Ação */}
      <div className="pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-safe">
        <Button fullWidth size="lg" onClick={handleSave} isLoading={isSaving}>
           {!isSaving && <Save size={18} className="mr-2" />}
           {isSaving ? 'Salvando...' : 'Salvar Configuração de Entrega'}
        </Button>
      </div>
    </div>
  );
};