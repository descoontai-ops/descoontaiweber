import React from 'react';
import { Mail, Lock, Eye, EyeOff, Store, Camera, Tag } from 'lucide-react';
import { CATEGORIES } from '../../../../constants';

interface MerchantAccountFormProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  logoPreview: string | null;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const MerchantAccountForm: React.FC<MerchantAccountFormProps> = ({
  formData,
  handleInputChange,
  logoPreview,
  handleLogoUpload,
  fileInputRef
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const inputClassName = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-gray-700 outline-none transition-colors";
  const iconClassName = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400";
  const selectClassName = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-gray-700 outline-none appearance-none cursor-pointer";

  return (
    <>
      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock size={16} /> Dados de Acesso
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className={iconClassName} size={18} />
              <input 
                type="email" 
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={inputClassName}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className={iconClassName} size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className={`${inputClassName} pr-12`}
                placeholder="********"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className={iconClassName} size={18} />
              <input 
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                className={`${inputClassName} pr-12`}
                placeholder="********"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Store size={16} /> Dados da Loja
        </h2>
        
        <div className="flex flex-col items-center mb-6">
          <div 
            className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-50 transition-colors relative group"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Camera size={24} />
                <span className="text-xs mt-1">Logo</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleLogoUpload}
          />
          <p className="text-xs text-gray-400 mt-2">Max. 3MB (Obrigatório)</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Ex: Burger King"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principal <span className="text-red-500">*</span></label>
            <div className="relative">
               <Tag className={iconClassName} size={18} />
               <select 
                 value={formData.category}
                 onChange={e => handleInputChange('category', e.target.value)}
                 className={selectClassName}
                 required
               >
                 <option value="">Selecione o tipo de loja...</option>
                 {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                   <option key={cat.id} value={cat.id}>{cat.name}</option>
                 ))}
               </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea 
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none"
              placeholder="O melhor hambúrguer da cidade..."
            />
          </div>
        </div>
      </section>
    </>
  );
};