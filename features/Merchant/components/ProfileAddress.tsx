import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { IBGEState, IBGECity } from '../../../types';
import { IGUATU_NEIGHBORHOODS } from '../../../constants';
import { getStates, getCitiesByState } from '../../Location/services/ibge';

interface ProfileAddressProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const ProfileAddress: React.FC<ProfileAddressProps> = ({ formData, onChange }) => {
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carrega Estados ao iniciar
  useEffect(() => {
    const loadStates = async () => {
        const ufs = await getStates();
        setStates(ufs);
        // Se já tiver UF, carrega cidades
        if (formData.uf) {
            handleStateChange(formData.uf, true);
        }
    };
    loadStates();
  }, []);

  // Sincroniza o termo de busca quando a cidade externa muda
  useEffect(() => {
     if (formData.city && !citySearchTerm) {
         setCitySearchTerm(formData.city);
     }
  }, [formData.city]);

  const handleStateChange = async (uf: string, initialLoad = false) => {
    if (!initialLoad) {
        onChange('uf', uf);
        onChange('city', '');
        setCitySearchTerm('');
    }
    setIsLoading(true);
    const citiesData = await getCitiesByState(uf);
    setCities(citiesData);
    setIsLoading(false);
  };

  const filteredCities = useMemo(() => {
    if (!citySearchTerm) return cities;
    return cities.filter(c => c.nome.toLowerCase().includes(citySearchTerm.toLowerCase()));
  }, [cities, citySearchTerm]);

  const handleCitySelect = (cityName: string) => {
    onChange('city', cityName);
    setCitySearchTerm(cityName);
    setIsCityDropdownOpen(false);
  };

  const isIguatu = formData.city === 'Iguatu' && formData.uf === 'CE';
  const inputClassName = "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm";
  const selectClassName = "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm appearance-none cursor-pointer";
  const iconClassName = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400";

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase">
            <MapPin size={16} /> Endereço da Loja
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
            {/* ESTADO (UF) */}
            <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">UF</label>
                <div className="relative">
                    <select value={formData.uf} onChange={e => handleStateChange(e.target.value)} className={selectClassName} style={{ paddingLeft: '0.5rem' }} required>
                        <option value="">UF</option>
                        {states.map(state => (<option key={state.id} value={state.sigla}>{state.sigla}</option>))}
                    </select>
                </div>
            </div>

            {/* CIDADE COM BUSCA */}
            <div className="col-span-2 relative">
                <label className="block text-xs font-bold text-gray-500 mb-1">Cidade {isLoading && '(Carregando...)'}</label>
                <div className="relative">
                    <Search className={iconClassName} size={16} />
                    <input 
                        type="text"
                        value={citySearchTerm}
                        onChange={(e) => {
                            setCitySearchTerm(e.target.value);
                            setIsCityDropdownOpen(true);
                            if(e.target.value === '') onChange('city', '');
                        }}
                        onFocus={() => setIsCityDropdownOpen(true)}
                        disabled={!formData.uf}
                        placeholder={formData.uf ? "Buscar cidade..." : "Selecione UF"}
                        className={inputClassName}
                        autoComplete="off"
                    />
                    {citySearchTerm && <button type="button" onClick={() => { setCitySearchTerm(''); onChange('city', ''); setIsCityDropdownOpen(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={14} /></button>}
                </div>
                
                {/* LISTA FLUTUANTE DE CIDADES */}
                {isCityDropdownOpen && formData.uf && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {filteredCities.length === 0 ? <div className="p-3 text-gray-400 text-xs text-center">Nenhuma cidade</div> : filteredCities.map(city => (
                            <button key={city.id} type="button" onClick={() => handleCitySelect(city.nome)} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm border-b border-gray-50 last:border-0">{city.nome}</button>
                        ))}
                    </div>
                )}
                {isCityDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsCityDropdownOpen(false)} />}
            </div>
        </div>

        {/* BAIRRO */}
        <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">Bairro</label>
        {isIguatu ? (
            <div className="relative">
                <MapPin className={iconClassName} size={16} />
                <select value={formData.neighborhood} onChange={e => onChange('neighborhood', e.target.value)} className={selectClassName} required>
                    <option value="">Selecione o bairro...</option>
                    {IGUATU_NEIGHBORHOODS.map(b => (<option key={b} value={b}>{b}</option>))}
                </select>
            </div>
        ) : (
            <div className="relative">
                <MapPin className={iconClassName} size={16} />
                <input type="text" value={formData.neighborhood} onChange={e => onChange('neighborhood', e.target.value)} className={inputClassName} placeholder="Bairro" required />
            </div>
        )}
        </div>

        {/* RUA E NUMERO */}
        <div className="flex gap-4">
            <div className="flex-[3]">
            <label className="block text-xs font-bold text-gray-500 mb-1">Rua</label>
            <input type="text" value={formData.street} onChange={e => onChange('street', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Nome da rua" required />
            </div>
            <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">Nº</label>
            <input type="text" value={formData.number} onChange={e => onChange('number', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="123" required />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Referência</label>
            <input type="text" value={formData.reference} onChange={e => onChange('reference', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Ex: Próximo ao mercado..." />
        </div>
    </div>
  );
};