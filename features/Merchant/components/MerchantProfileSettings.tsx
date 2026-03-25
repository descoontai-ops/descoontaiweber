import React, { useState, useMemo } from 'react';
import { Store, Save, Wallet, Link as LinkIcon, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Restaurant } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../../lib/firebase';
import { compressImage } from '../../../utils/imageCompression';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'; // Adicionado doc e updateDoc

// Importando os sub-componentes existentes
import { ProfileIdentity } from './ProfileIdentity';
import { ProfileAddress } from './ProfileAddress';
import { ProfileSchedule } from './ProfileSchedule';
import { MerchantPaymentSettings } from './MerchantPaymentSettings';

interface MerchantProfileSettingsProps {
  restaurant: Restaurant;
  // Tornamos opcionais para evitar o erro se o pai não passar
  onUpdate?: (data: Partial<Restaurant>) => Promise<void>;
  isSaving?: boolean;
}

export const MerchantProfileSettings: React.FC<MerchantProfileSettingsProps> = ({ 
  restaurant, 
  onUpdate, 
  isSaving: propIsSaving 
}) => {
  const [localSaving, setLocalSaving] = useState(false);
  const isSaving = propIsSaving || localSaving;

  // --- Estados para Validação do Link ---
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugMessage, setSlugMessage] = useState('');

  // --- Função para Parsear o Endereço Antigo ---
  const parseAddress = (fullAddress: string) => {
      try {
          if (!fullAddress) return { street: '', number: '', neighborhood: '', city: '', uf: '', reference: '' };
          const parts = fullAddress.split(' - ');
          if (parts.length >= 3) {
              const [streetAndNum, neighborhoodAndCity, uf] = parts;
              const [street, number] = streetAndNum.split(',').map(s => s.trim());
              const [neighborhood, city] = neighborhoodAndCity.split(',').map(s => s.trim());
              return {
                  street: street || '',
                  number: number || '',
                  neighborhood: neighborhood || '',
                  city: city || '',
                  uf: uf ? uf.slice(0, 2) : '',
                  reference: '' 
              };
          }
      } catch (e) {
          console.log("Erro ao parsear endereço", e);
      }
      return { street: fullAddress, number: '', neighborhood: '', city: '', uf: '', reference: '' };
  };

  const initialAddress = useMemo(() => parseAddress(restaurant.address || ''), []);

  // --- Estado Global do Formulário ---
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    category: restaurant.category || '', 
    tags: restaurant.tags || [], 
    phone: restaurant.phone || restaurant.whatsappNumber || '',
    deliveryTime: restaurant.deliveryTime || '30-45',
    slug: restaurant.slug || restaurant.id,
    
    // Formas de Pagamento
    paymentMethods: restaurant.paymentMethods || [],
    
    // Endereço
    uf: initialAddress.uf,
    city: initialAddress.city,
    neighborhood: restaurant.addressNeighborhood || initialAddress.neighborhood,
    street: initialAddress.street,
    number: initialAddress.number,
    reference: initialAddress.reference,

    // Horários
    schedule: restaurant.schedule || {
        'Seg': { isOpen: true, open: '18:00', close: '23:00' },
        'Ter': { isOpen: true, open: '18:00', close: '23:00' },
        'Qua': { isOpen: true, open: '18:00', close: '23:00' },
        'Qui': { isOpen: true, open: '18:00', close: '23:00' },
        'Sex': { isOpen: true, open: '18:00', close: '23:00' },
        'Sáb': { isOpen: true, open: '18:00', close: '23:00' },
        'Dom': { isOpen: true, open: '18:00', close: '23:00' }
    }
  });

  // --- Estado das Imagens ---
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState({
      logo: restaurant.image || '',
      cover: restaurant.coverImage || ''
  });

  // --- Handlers ---
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitização: apenas letras minúsculas, números e hífen
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug: val }));
    setSlugStatus('idle'); // Reseta status ao digitar
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
     setFormData(prev => ({
         ...prev,
         schedule: {
             ...prev.schedule,
             [day]: { ...prev.schedule[day], [field]: value }
         }
     }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
     const file = e.target.files?.[0];
     if (file) {
         if (type === 'logo') setLogoFile(file);
         if (type === 'cover') setCoverFile(file);
         const url = URL.createObjectURL(file);
         setPreviews(prev => ({ ...prev, [type]: url }));
     }
  };

  // --- LÓGICA DE VALIDAÇÃO DE LINK (SLUG) ---
  const validateSlugAvailability = async () => {
      const slugToCheck = formData.slug;
      
      if (!slugToCheck || slugToCheck.length < 3) {
          setSlugStatus('taken'); 
          setSlugMessage('O link deve ter no mínimo 3 caracteres.');
          return;
      }

      // Se for o mesmo slug que já está salvo no banco, está disponível
      if (slugToCheck === restaurant.slug) {
          setSlugStatus('available');
          setSlugMessage('Este já é o seu link atual.');
          return;
      }

      setSlugStatus('checking');

      try {
          const q = query(collection(db, 'merchants'), where('slug', '==', slugToCheck));
          const snapshot = await getDocs(q);

          // Verifica se existe algum documento E se não é o próprio restaurante
          const isTaken = !snapshot.empty && snapshot.docs[0].id !== restaurant.id;

          if (isTaken) {
              setSlugStatus('taken');
              setSlugMessage('Este link já está em uso. Tente outro.');
          } else {
              setSlugStatus('available');
              setSlugMessage('Link disponível para uso!');
          }
      } catch (error) {
          console.error("Erro ao validar slug:", error);
          setSlugStatus('idle');
          setSlugMessage('Erro ao verificar. Tente salvar.');
      }
  };

  const copyPromotionalLink = () => {
    const identifier = formData.slug || restaurant.id;
    // Link Quiosque (sem botão voltar para reter o cliente)
    const url = `${window.location.origin}/?s=${identifier}`;
    
    // Texto de Marketing Otimizado
    const promoText = `*${formData.name || restaurant.name}* 🍕\n\nOlá! Acesse nosso cardápio digital oficial e faça seu pedido com agilidade:\n\n👇 *CLIQUE NO LINK:*\n${url}\n\nEstamos aguardando seu pedido! 😋`;

    navigator.clipboard.writeText(promoText);
    alert('Link e texto promocional copiados! Agora é só colar no WhatsApp.');
  };

  // --- Salvar Tudo ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bloqueia se o slug estiver marcado como indisponível
    if (slugStatus === 'taken') {
        alert('Por favor, corrija o Link Personalizado antes de salvar.');
        return;
    }

    if (!formData.uf || !formData.city || !formData.neighborhood || !formData.street || !formData.number) {
        alert('Por favor, preencha o endereço completo.');
        return;
    }

    setLocalSaving(true);

    try {
        let finalLogoUrl = restaurant.image;
        let finalCoverUrl = restaurant.coverImage;

        // Upload Logo
        if (logoFile) {
            const compressedLogo = await compressImage(logoFile, 0.7, 500);
            const logoRef = ref(storage, `merchants/${restaurant.id}/logo_${Date.now()}.jpg`);
            await uploadBytes(logoRef, compressedLogo);
            finalLogoUrl = await getDownloadURL(logoRef);
        }

        // Upload Capa
        if (coverFile) {
            const compressedCover = await compressImage(coverFile, 0.7, 1200);
            const coverRef = ref(storage, `merchants/${restaurant.id}/cover_${Date.now()}.jpg`);
            await uploadBytes(coverRef, compressedCover);
            finalCoverUrl = await getDownloadURL(coverRef);
        }

        const fullAddress = `${formData.street}, ${formData.number} - ${formData.neighborhood}, ${formData.city} - ${formData.uf}${formData.reference ? ` (${formData.reference})` : ''}`;

        const dataToUpdate = {
            name: formData.name,
            description: formData.description,
            category: formData.category, 
            tags: formData.tags, 
            phone: formData.phone,
            whatsappNumber: formData.phone, 
            deliveryTime: formData.deliveryTime,
            slug: formData.slug,
            schedule: formData.schedule,
            address: fullAddress,
            addressNeighborhood: formData.neighborhood,
            image: finalLogoUrl,
            coverImage: finalCoverUrl,
            paymentMethods: formData.paymentMethods 
        };

        // --- CORREÇÃO DO ERRO ---
        // Se a função onUpdate foi passada pelo pai, usa ela.
        // Se não (que é o caso do erro), salva direto no Firebase.
        if (onUpdate) {
            await onUpdate(dataToUpdate);
        } else {
            const docRef = doc(db, 'merchants', restaurant.id);
            await updateDoc(docRef, dataToUpdate);
            alert('Perfil e Horários atualizados com sucesso!');
        }

    } catch (err) {
        console.error("Erro ao salvar perfil:", err);
        alert("Erro ao salvar imagens ou dados. Tente novamente.");
    } finally {
        setLocalSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Store className="text-brand-600" /> 
          Dados da Loja
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SEÇÃO 1: IDENTIDADE VISUAL & INFO BÁSICA */}
          <ProfileIdentity 
             formData={formData}
             previews={previews}
             onChange={handleChange}
             onImageChange={handleImageChange}
             restaurantId={restaurant.id}
          />

          {/* --- LINK PERSONALIZADO --- */}
          <div className="bg-gradient-to-r from-brand-50 to-white p-5 rounded-xl border border-brand-100">
             <div className="flex items-start gap-3">
                <div className="bg-white p-2 rounded-lg text-brand-600 shadow-sm border border-gray-100">
                   <LinkIcon size={20} />
                </div>
                <div className="flex-1">
                   <h3 className="text-sm font-bold text-gray-800">Link Personalizado</h3>
                   <p className="text-xs text-gray-500 mb-3">Crie um endereço curto para sua loja (ex: pizzaria-do-joao).</p>
                   
                   <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">descoontai.app/</span>
                          <input 
                            type="text"
                            value={formData.slug}
                            onChange={handleSlugChange}
                            className={`w-full pl-[95px] pr-3 py-2 border rounded-lg text-sm outline-none transition-all ${
                                slugStatus === 'available' ? 'border-green-400 focus:ring-2 focus:ring-green-100' :
                                slugStatus === 'taken' ? 'border-red-400 focus:ring-2 focus:ring-red-100' :
                                'border-gray-300 focus:ring-2 focus:ring-brand-100'
                            }`}
                            placeholder="sua-loja"
                          />
                      </div>
                      
                      <button
                        type="button"
                        onClick={validateSlugAvailability}
                        disabled={slugStatus === 'checking' || !formData.slug}
                        className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        {slugStatus === 'checking' ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} />}
                        Validar
                      </button>

                      <button
                        type="button"
                        onClick={copyPromotionalLink}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        title="Copiar Link com Texto Promocional"
                      >
                        <Copy size={16} />
                        Copiar
                      </button>
                   </div>

                   {/* Mensagens de Feedback */}
                   {slugStatus === 'available' && (
                       <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
                          <Check size={12} /> {slugMessage}
                       </p>
                   )}
                   {slugStatus === 'taken' && (
                       <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium">
                          <AlertCircle size={12} /> {slugMessage}
                       </p>
                   )}
                </div>
             </div>
          </div>

          {/* SEÇÃO 2: ENDEREÇO */}
          <ProfileAddress 
             formData={formData}
             onChange={handleChange}
          />

          {/* SEÇÃO 3: FORMAS DE PAGAMENTO */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
             <div className="flex items-center gap-2 mb-2">
                <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                   <Wallet size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-gray-800">Formas de Pagamento</h3>
                   <p className="text-sm text-gray-500">Selecione como você aceita receber.</p>
                </div>
             </div>
             
             <MerchantPaymentSettings 
               selectedMethods={formData.paymentMethods}
               onUpdate={(methods) => handleChange('paymentMethods', methods)}
             />
          </div>

          {/* SEÇÃO 4: HORÁRIOS */}
          <ProfileSchedule 
             schedule={formData.schedule}
             onChange={handleScheduleChange}
          />

          <div className="pt-6 sticky bottom-4 z-10">
            <Button type="submit" isLoading={isSaving} fullWidth className="flex items-center justify-center gap-2 h-12 text-base shadow-xl">
              <Save size={18} />
              Salvar Alterações
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};