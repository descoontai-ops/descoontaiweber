import React, { useState, useRef } from 'react';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle } from 'lucide-react'; 
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../Auth/context/AuthContext';
import { WeeklySchedule, Restaurant } from '../../../types';
import { compressImage } from '../../../utils/imageCompression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../../../lib/firebase';

// Sub-components
import { MerchantAccountForm } from '../components/Registration/MerchantAccountForm';
import { MerchantAddressForm } from '../components/Registration/MerchantAddressForm';

interface MerchantRegistrationScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const INITIAL_SCHEDULE: WeeklySchedule = {
  'Seg': { isOpen: true, open: '18:00', close: '23:00' },
  'Ter': { isOpen: true, open: '18:00', close: '23:00' },
  'Qua': { isOpen: true, open: '18:00', close: '23:00' },
  'Qui': { isOpen: true, open: '18:00', close: '23:00' },
  'Sex': { isOpen: true, open: '18:00', close: '23:59' },
  'Sáb': { isOpen: true, open: '18:00', close: '23:59' },
  'Dom': { isOpen: true, open: '17:00', close: '23:00' },
};

export const MerchantRegistrationScreen: React.FC<MerchantRegistrationScreenProps> = ({ onBack, onSuccess }) => {
  const { register, updateProfileName } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    description: '',
    whatsapp: '',
    instagram: '',
    category: '', 
    uf: '',
    city: '',
    neighborhood: '',
    street: '',
    number: '',
    reference: '',
    schedule: INITIAL_SCHEDULE
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Estado para controlar a tela de sucesso total (remove o formulário da vista)
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Formato inválido. Apenas JPG ou PNG.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { 
        alert('Imagem muito grande (Max 10MB).');
        return;
      }
      setLogoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Validations
    if (!formData.email || !formData.password) return setErrorMsg('Email e senha obrigatórios.');
    if (formData.password !== formData.confirmPassword) return setErrorMsg('Senhas não coincidem.');
    if (!formData.name) return setErrorMsg('Nome da loja obrigatório.');
    if (!formData.category) return setErrorMsg('Categoria obrigatória.');
    if (!formData.whatsapp) return setErrorMsg('WhatsApp obrigatório.');
    if (!logoFile) return setErrorMsg('Logo obrigatória.');
    
    if (!formData.uf || !formData.city || !formData.neighborhood || !formData.street || !formData.number) {
      return setErrorMsg('Endereço incompleto.');
    }

    setIsSubmitting(true);

    try {
        const userCredential = await register(formData.email, formData.password);
        const uid = userCredential.uid;
        await updateProfileName(formData.name);

        let logoUrl = '';
        try {
            const compressedLogo = await compressImage(logoFile, 0.7, 500); 
            const storageRef = ref(storage, `merchants/${uid}/logo_${Date.now()}.jpg`);
            await uploadBytes(storageRef, compressedLogo);
            logoUrl = await getDownloadURL(storageRef);
        } catch (imgError) {
            console.error("Erro imagem:", imgError);
            throw new Error("Erro ao salvar logo.");
        }

        const fullAddress = `${formData.street}, ${formData.number} - ${formData.neighborhood}, ${formData.city} - ${formData.uf}`;
        
        // --- CORREÇÃO AQUI: Adicionado ownerId ao objeto ---
        // Se o TypeScript reclamar do 'ownerId', adicione "ownerId?: string" no arquivo types.ts
        const newMerchant: any = { // Usei 'any' temporariamente para garantir que o TS não bloqueie se a tipagem estiver desatualizada
            id: uid, 
            slug: uid, 
            ownerId: uid, // 🔥 AQUI ESTÁ A CORREÇÃO MÁGICA 🔥
            name: formData.name,
            whatsappNumber: formData.whatsapp,
            instagram: formData.instagram,
            rating: 5.0, 
            deliveryTime: '30-45 min',
            deliveryFee: 0,
            address: fullAddress,
            addressNeighborhood: formData.neighborhood,
            lat: 0, 
            lng: 0,
            image: logoUrl,
            coverImage: 'https://via.placeholder.com/800x400?text=Capa+da+Loja', 
            isOpen: true,
            isApproved: false, 
            menuSections: [],
            schedule: formData.schedule,
            tags: [formData.category], 
            deliveryConfig: {
                type: 'fixed',
                fixedPrice: 0,
                neighborhoodPrices: {}
            },
            analytics: { totalVisits: 0 },
            subscriptionStatus: 'trial_pending', 
        };

        // 1. Salva o Merchant
        await setDoc(doc(db, 'merchants', uid), newMerchant);

        // 2. Salva o Usuário com Role
        await setDoc(doc(db, 'users', uid), {
            email: formData.email,
            role: 'merchant',
            createdAt: new Date() // Alterado para Date object para compatibilidade Firestore
        });

        // 3. SUCESSO TOTAL - Troca a tela IMEDIATAMENTE
        setIsSuccess(true);

        // Pequeno delay para garantir que o usuário veja o feedback positivo antes de navegar
        setTimeout(() => {
             if (onSuccess) onSuccess();
        }, 1500);

    } catch (error: any) {
        console.error("Erro cadastro:", error);
        setIsSubmitting(false);
        if (error.code === 'auth/email-already-in-use') {
            setErrorMsg('E-mail já cadastrado.');
        } else {
            setErrorMsg(error.message || 'Erro ao criar conta.');
        }
    }
  };

  // RENDERIZAÇÃO CONDICIONAL: Se for sucesso, o formulário NEM É RENDERIZADO.
  if (isSuccess) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="text-green-600 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loja Criada com Sucesso!</h2>
            <p className="text-gray-500 mb-8">Estamos preparando seu painel administrativo...</p>
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 sticky top-0 z-20 border-b border-gray-200 flex items-center">
        <button onClick={onBack} disabled={isSubmitting} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ml-2 text-lg font-bold text-gray-900">Cadastro de Parceiro</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-lg mx-auto">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2 border border-red-100">
             <AlertCircle size={20} className="shrink-0 mt-0.5" />
             <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <MerchantAccountForm 
          formData={formData}
          handleInputChange={handleInputChange}
          fileInputRef={fileInputRef}
          handleLogoUpload={handleLogoUpload}
          logoPreview={logoPreview}
        />

        <MerchantAddressForm 
          formData={formData}
          handleInputChange={handleInputChange}
        />

        <div className="pt-4 pb-10">
          <Button fullWidth size="lg" type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando dados...' : 'Finalizar Cadastro'}
          </Button>
        </div>
      </form>
    </div>
  );
};