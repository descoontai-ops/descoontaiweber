import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2, Save, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { compressImage } from '../../../utils/imageCompression';

// Firebase Imports
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, deleteDoc, doc, query, orderBy, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../../../lib/firebase';

interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  createdAt: any;
}

export const AdBannersTab: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Slide Config
  const [slideDuration, setSlideDuration] = useState(5);

  // Form State
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Carregar Configuração e LISTENER de Banners
  useEffect(() => {
    setLoading(true);

    // A. Buscar Configuração de Tempo (Uma vez)
    const fetchConfig = async () => {
       try {
          const configRef = doc(db, 'settings', 'banners');
          const configSnap = await getDoc(configRef);
          if (configSnap.exists()) {
             setSlideDuration(configSnap.data().slideDuration || 5);
          }
       } catch (e) { console.error("Erro config:", e); }
    };
    fetchConfig();

    // B. Listener em Tempo Real (Lista de Banners)
    // Isso garante que a lista apareça assim que o upload terminar
    const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedBanners = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Banner[];
        setBanners(fetchedBanners);
        setLoading(false);
    }, (error) => {
        console.error("Erro ao ouvir banners:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Salvar Configuração de Tempo
  const handleSaveConfig = async () => {
      setSavingConfig(true);
      try {
          await setDoc(doc(db, 'settings', 'banners'), {
              slideDuration: Number(slideDuration)
          }, { merge: true });
          alert('Tempo de transição atualizado com sucesso!');
      } catch (e) {
          console.error(e);
          alert('Erro ao salvar configuração (Verifique permissões).');
      } finally {
          setSavingConfig(false);
      }
  };

  // 3. Manipular Arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewBannerFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 4. Salvar Banner
  const handleSaveBanner = async () => {
    if (!newBannerFile) {
      alert('Selecione uma imagem para o banner.');
      return;
    }

    setUploading(true);

    try {
      // Compressão
      const compressedFile = await compressImage(newBannerFile, 0.8, 1200); 
      
      // Upload Storage
      const storageRef = ref(storage, `banners/banner_${Date.now()}.jpg`);
      await uploadBytes(storageRef, compressedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      // Salvar Firestore
      await addDoc(collection(db, 'banners'), {
        imageUrl: downloadUrl,
        link: newBannerLink,
        active: true,
        createdAt: new Date().toISOString()
      });

      // Reset Form
      setNewBannerFile(null);
      setPreviewUrl(null);
      setNewBannerLink('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      alert('Banner publicado!');

    } catch (error) {
      console.error("Erro ao salvar banner:", error);
      alert('Erro ao enviar banner.');
    } finally {
      setUploading(false);
    }
  };

  // 5. Deletar Banner
  const handleDelete = async (banner: Banner) => {
    if (!confirm('Remover este banner?')) return;

    try {
      // Deleta do Banco
      await deleteDoc(doc(db, 'banners', banner.id));
      
      // Tenta deletar a imagem (se for do firebase)
      if (banner.imageUrl.includes('firebasestorage')) {
         try {
            const storageRef = ref(storage, banner.imageUrl);
            await deleteObject(storageRef);
         } catch (e) { console.warn('Imagem já não existia'); }
      }
      // Não precisa atualizar state manual, o onSnapshot fará isso
    } catch (error) {
      alert('Erro ao deletar banner.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* 1. CONFIGURAÇÃO GERAL */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="bg-brand-50 p-2 rounded-lg text-brand-600"><Clock size={20} /></div>
              <div>
                  <h3 className="font-bold text-gray-800 text-sm">Tempo por Slide</h3>
                  <p className="text-xs text-gray-500">Quanto tempo cada banner aparece</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <input 
                 type="number" 
                 min="2" 
                 max="20"
                 value={slideDuration}
                 onChange={(e) => setSlideDuration(Number(e.target.value))}
                 className="w-16 p-2 border border-gray-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-500 mr-2">segundos</span>
              <Button size="sm" onClick={handleSaveConfig} isLoading={savingConfig}>
                  <Save size={16} />
              </Button>
          </div>
      </div>

      {/* 2. UPLOAD */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-brand-600" /> Adicionar Novo Banner
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-400 transition-all relative overflow-hidden group"
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon size={32} className="mx-auto mb-2" />
                  <p className="text-sm font-medium">Clique para selecionar imagem</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link ao Clicar (Opcional)</label>
              <input 
                type="text" 
                value={newBannerLink}
                onChange={e => setNewBannerLink(e.target.value)}
                placeholder="Ex: https://google.com ou /loja/id"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <Button fullWidth onClick={handleSaveBanner} disabled={uploading || !newBannerFile} isLoading={uploading}>
              {uploading ? 'Enviando...' : 'Publicar Banner'}
            </Button>
          </div>
        </div>
      </div>

      {/* 3. LISTAGEM */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Banners Ativos ({banners.length})</h3>
        
        {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-600"/></div>}

        {!loading && banners.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum banner cadastrado.</p>
        )}

        {banners.map((banner) => (
            <div key={banner.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group">
              <div className="w-24 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                  <img src={banner.imageUrl} className="w-full h-full object-cover" alt="Banner" />
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate font-mono">{banner.id}</p>
                  {banner.link ? (
                      <div className="flex items-center gap-1 text-xs text-brand-600 truncate">
                          <ExternalLink size={10} /> {banner.link}
                      </div>
                  ) : <span className="text-xs text-gray-300">Sem link</span>}
              </div>
              <button 
                  onClick={() => handleDelete(banner)} 
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
              >
                  <Trash2 size={18} />
              </button>
            </div>
        ))}
      </div>
    </div>
  );
};