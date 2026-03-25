import React, { useRef } from 'react';
import { Store, Edit2, Check, Tag, Clock, Phone } from 'lucide-react';
import { CATEGORIES } from '../../../constants';

interface ProfileIdentityProps {
  formData: any;
  previews: { logo: string; cover: string };
  onChange: (field: string, value: any) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => void;
  restaurantId: string;
}

// Opções pré-definidas de tempo para evitar erros de digitação
const DELIVERY_TIME_OPTIONS = [
    { value: '10-20', label: '10-20 min (Rápido)' },
    { value: '20-30', label: '20-30 min' },
    { value: '30-40', label: '30-40 min' },
    { value: '30-45', label: '30-45 min (Padrão)' },
    { value: '40-50', label: '40-50 min' },
    { value: '45-60', label: '45-60 min' },
    { value: '50-70', label: '50-70 min' },
    { value: '60-90', label: '60-90 min (Longo)' },
];

export const ProfileIdentity: React.FC<ProfileIdentityProps> = ({
  formData,
  previews,
  onChange,
  onImageChange,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const availableCategories = CATEGORIES.filter(c => c.id !== 'all');

  // --- MÁSCARA DE WHATSAPP CORRIGIDA ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Limpa tudo que não for número
    let raw = e.target.value.replace(/\D/g, '');
    
    // 2. Limita a 11 dígitos (DDD + 9 + 8 dígitos)
    if (raw.length > 11) raw = raw.slice(0, 11);

    let formatted = raw;

    // 3. Reconstrói a máscara passo a passo
    if (raw.length > 0) {
        formatted = `(${raw}`;
    }
    if (raw.length > 2) {
        formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 3) {
         // Adiciona o espaço após o 9: (88) 9 9...
         formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 3)} ${raw.slice(3)}`;
    }
    if (raw.length > 7) {
         // Adiciona o traço: (88) 9 9998-1618
         formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 3)} ${raw.slice(3, 7)}-${raw.slice(7)}`;
    }
    
    onChange('phone', formatted);
  };

  const toggleTag = (tagId: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tagId)) {
        onChange('tags', currentTags.filter((t: string) => t !== tagId));
    } else {
        onChange('tags', [...currentTags, tagId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: LOGO (CENTRADO E ORGANIZADO) */}
      <div className="flex flex-col items-center justify-center pb-4 border-b border-gray-100">
          <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden relative">
                {previews.logo ? (
                    <img src={previews.logo} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                    <Store className="w-12 h-12 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
                
                {/* Overlay de Edição ao passar o mouse */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Edit2 className="text-white" size={24} />
                </div>
            </div>
            
            {/* Botão flutuante para mobile/indicação visual */}
            <div className="absolute bottom-1 right-1 bg-brand-600 text-white p-2 rounded-full shadow-md border-2 border-white hover:bg-brand-700 transition-colors">
                <Edit2 size={16} />
            </div>
          </div>
          
          <p className="text-sm font-medium text-gray-500 mt-3">Logo do Estabelecimento</p>
          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => onImageChange(e, 'logo')}/>
      </div>

      {/* SEÇÃO 2: INFORMAÇÕES BÁSICAS */}
      <div className="space-y-4">
          {/* NOME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
            <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => onChange('name', e.target.value)} 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-shadow" 
                placeholder="Ex: Pizzaria do João"
                required 
            />
          </div>

          {/* O CAMPO SLUG (LINK) FOI REMOVIDO DAQUI POIS AGORA ESTÁ NO PAINEL PRINCIPAL */}
      </div>

      {/* SEÇÃO 3: CATEGORIZAÇÃO E DESCRIÇÃO */}
      <div className="space-y-4 pt-2">
          {/* CATEGORIA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principal</label>
            <div className="relative">
                <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={formData.category} onChange={(e) => onChange('category', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm appearance-none cursor-pointer">
                    <option value="" disabled>Selecione...</option>
                    {availableCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
            </div>
          </div>

          {/* TAGS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades (Tags)</label>
            <div className="flex flex-wrap gap-2">
                {availableCategories.map(cat => {
                    const isSelected = formData.tags?.includes(cat.id);
                    if (cat.id === formData.category) return null; 
                    return (
                        <button key={cat.id} type="button" onClick={() => toggleTag(cat.id)} className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            {isSelected && <Check size={12} />} {cat.name}
                        </button>
                    );
                })}
            </div>
          </div>

          {/* BIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta (Bio)</label>
            <textarea 
                value={formData.description} 
                onChange={(e) => onChange('description', e.target.value)} 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none" 
                placeholder="Conte um pouco sobre sua loja para os clientes..." 
            />
          </div>
      </div>

      {/* SEÇÃO 4: CONTATO E OPERAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* WhatsApp */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Pedidos</label>
            <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handlePhoneChange} 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" 
                    placeholder="(99) 9 9999-9999" 
                    maxLength={16} 
                />
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-1">Para receber os pedidos</p>
        </div>

        {/* Tempo de Entrega */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Médio</label>
            <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select 
                    value={formData.deliveryTime} 
                    onChange={(e) => onChange('deliveryTime', e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm appearance-none cursor-pointer"
                >
                    <option value="" disabled>Selecione...</option>
                    {DELIVERY_TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
             <p className="text-xs text-gray-400 mt-1 ml-1">Estimativa para o cliente</p>
        </div>
      </div>
    </div>
  );
};