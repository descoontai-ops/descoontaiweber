import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Search, X, Loader2, Phone, Instagram } from 'lucide-react';
import { IGUATU_NEIGHBORHOODS } from '../../../../constants';
import { IBGEState, IBGECity } from '../../../../types';
import { getStates, getCitiesByState } from '../../../Location/services/ibge';

interface MerchantAddressFormProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
}

export const MerchantAddressForm: React.FC<MerchantAddressFormProps> = ({
  formData,
  handleInputChange
}) => {
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  useEffect(() => {
    setLoadingLocations(true);
    getStates().then(data => {
      setStates(data);
      setLoadingLocations(false);
    });
  }, []);

  const handleStateChange = async (uf: string) => {
    handleInputChange('uf', uf);
    handleInputChange('city', '');
    setCitySearchTerm('');
    setLoadingLocations(true);
    const citiesData = await getCitiesByState(uf);
    setCities(citiesData);
    setLoadingLocations(false);
  };

  const handleCitySelect = (cityName: string) => {
    handleInputChange('city', cityName);
    setCitySearchTerm(cityName);
    setIsCityDropdownOpen(false);
  };

  // --- MÁSCARA DE WHATSAPP CORRIGIDA ---
  // Formato Exato: (XX) 9 XXXX-XXXX
  // Ex: (88) 9 9998-1618
  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Limpa tudo que não é número
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos (DDD + 9 + 8 dígitos)

    let formatted = value;
    
    // 1. Adiciona DDD: (88) ...
    if (value.length > 2) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    
    // 2. Separa o 9º dígito: (88) 9 ...
    if (value.length > 3) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 3)} ${value.slice(3)}`;
    }
    
    // 3. Formata o restante com hífen: (88) 9 9998-1618
    if (value.length > 7) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 3)} ${value.slice(3, 7)}-${value.slice(7)}`;
    }

    handleInputChange('whatsapp', formatted);
  };

  const filteredCities = useMemo(() => {
    if (!citySearchTerm) return cities;
    return cities.filter(c => c.nome.toLowerCase().includes(citySearchTerm.toLowerCase()));
  }, [cities, citySearchTerm]);

  const isIguatu = formData.city === 'Iguatu' && formData.uf === 'CE';

  const inputClassName = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-gray-700 outline-none transition-colors";
  const iconClassName = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400";
  const selectClassName = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-gray-700 outline-none appearance-none cursor-pointer";

  return (
    <>
      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} /> Endereço da Loja
            </h2>
            {loadingLocations && <Loader2 size={16} className="animate-spin text-brand-600" />}
         </div>

         <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
               <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
                  <div className="relative">
                     <select 
                       value={formData.uf} 
                       onChange={e => handleStateChange(e.target.value)}
                       className={selectClassName}
                       style={{ paddingLeft: '1rem' }}
                       required
                     >
                       <option value="">UF</option>
                       {states.map(state => (
                         <option key={state.id} value={state.sigla}>{state.sigla}</option>
                       ))}
                     </select>
                  </div>
               </div>

               <div className="col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade <span className="text-red-500">*</span></label>
                  <div className="relative">
                     <Search className={iconClassName} size={18} />
                     <input 
                       type="text"
                       value={citySearchTerm} 
                       onChange={(e) => {
                          setCitySearchTerm(e.target.value);
                          setIsCityDropdownOpen(true);
                          if(e.target.value === '') handleInputChange('city', '');
                       }}
                       onFocus={() => setIsCityDropdownOpen(true)}
                       disabled={!formData.uf}
                       placeholder={formData.uf ? "Digite para buscar..." : "Selecione o Estado"}
                       className={inputClassName}
                       autoComplete="off"
                     />
                     {citySearchTerm && (
                       <button 
                         type="button"
                         onClick={() => { setCitySearchTerm(''); handleInputChange('city', ''); setIsCityDropdownOpen(true); }}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                       >
                         <X size={16} />
                       </button>
                     )}
                  </div>

                  {isCityDropdownOpen && formData.uf && (
                     <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredCities.length === 0 ? (
                           <div className="p-3 text-gray-500 text-sm text-center">Nenhuma cidade encontrada</div>
                        ) : (
                           filteredCities.map(city => (
                             <button
                               key={city.id}
                               type="button"
                               onClick={() => handleCitySelect(city.nome)}
                               className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0 text-sm"
                             >
                               {city.nome}
                             </button>
                           ))
                        )}
                     </div>
                  )}
                  {isCityDropdownOpen && (
                     <div className="fixed inset-0 z-40" onClick={() => setIsCityDropdownOpen(false)} />
                  )}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro <span className="text-red-500">*</span></label>
              {isIguatu ? (
                  <div className="relative">
                     <MapPin className={iconClassName} size={18} />
                     <select 
                       value={formData.neighborhood}
                       onChange={e => handleInputChange('neighborhood', e.target.value)}
                       className={selectClassName}
                       required
                     >
                       <option value="">Selecione o bairro...</option>
                       {IGUATU_NEIGHBORHOODS.map(b => (
                         <option key={b} value={b}>{b}</option>
                       ))}
                     </select>
                  </div>
              ) : (
                  <div className="relative">
                     <MapPin className={iconClassName} size={18} />
                     <input 
                       type="text" 
                       value={formData.neighborhood}
                       onChange={e => handleInputChange('neighborhood', e.target.value)}
                       className={inputClassName}
                       placeholder="Ex: Centro"
                       required
                     />
                  </div>
              )}
            </div>

            <div className="flex gap-4">
               <div className="flex-[3]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rua <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.street}
                    onChange={e => handleInputChange('street', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Nome da rua"
                    required
                  />
               </div>
               <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.number}
                    onChange={e => handleInputChange('number', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="123"
                    required
                  />
               </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referência</label>
                <input 
                  type="text" 
                  value={formData.reference}
                  onChange={e => handleInputChange('reference', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Ex: Próximo ao mercado..."
                />
            </div>

         </div>
      </section>

      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Phone size={16} /> Contatos
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp <span className="text-red-500">*</span></label>
            <div className="relative">
               <Phone className={iconClassName} size={18} />
               <input 
                 type="tel" 
                 value={formData.whatsapp}
                 onChange={handleWhatsAppChange} 
                 className={inputClassName}
                 placeholder="(88) 9 9999-9999"
                 required
                 maxLength={16} // (XX) 9 XXXX-XXXX = 16 caracteres
               />
            </div>
            <p className="text-xs text-gray-500 mt-1">Este número receberá os pedidos dos clientes.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram <span className="text-gray-400 font-normal">(Opcional)</span></label>
            <div className="relative">
               <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 value={formData.instagram}
                 onChange={e => handleInputChange('instagram', e.target.value)}
                 className={inputClassName}
                 placeholder="@seurestaurante"
               />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};