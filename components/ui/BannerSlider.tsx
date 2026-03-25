import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface BannerSliderProps {
  location?: 'home' | 'settings'; // Opcional, mantido por compatibilidade
  aspectRatio?: string; // Ex: 'h-36', 'h-32'
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ location, aspectRatio = 'h-36' }) => {
  const [banners, setBanners] = useState<{id: string, imageUrl: string, link?: string}[]>([]);
  const [slideDuration, setSlideDuration] = useState(5000); // 5s padrão
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 1. Buscar Configuração e Banners do Firestore
  useEffect(() => {
    // A. Busca tempo de slide
    const fetchConfig = async () => {
        try {
            const configRef = doc(db, 'settings', 'banners');
            const snap = await getDoc(configRef);
            if (snap.exists() && snap.data().slideDuration) {
                setSlideDuration(snap.data().slideDuration * 1000);
            }
        } catch (e) { console.error(e); }
    };
    fetchConfig();

    // B. Listener em Tempo Real para Banners
    const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(d => ({
            id: d.id,
            imageUrl: d.data().imageUrl,
            link: d.data().link
        }));
        setBanners(fetched);
        setLoading(false);
    }, (error) => {
        console.error("Erro slider:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Lógica de Rotação Automática
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, slideDuration);
    return () => clearInterval(interval);
  }, [banners.length, slideDuration]);

  // 3. Manipulador de Clique (Nova Aba)
  const handleBannerClick = (link?: string) => {
    if (!link) return;
    window.open(link, '_blank');
  };

  if (loading) return (
    <div className={`w-full ${aspectRatio} bg-gray-200 animate-pulse rounded-xl flex items-center justify-center`}>
       <Loader2 className="animate-spin text-gray-400" />
    </div>
  );

  // Fallback se não tiver banners
  if (banners.length === 0) {
     return (
       <div className={`w-full ${aspectRatio} rounded-xl overflow-hidden shadow-sm relative bg-gray-100`}>
           <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
               <span className="text-xs font-medium">Anuncie aqui</span>
           </div>
       </div>
     );
  }

  return (
    <div className={`w-full ${aspectRatio} rounded-xl overflow-hidden shadow-sm relative bg-white group`}>
       {banners.map((banner, index) => (
         <div 
           key={banner.id}
           onClick={() => handleBannerClick(banner.link)}
           className={`
             absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer
             ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
           `}
         >
            {/* A CLASSE object-cover GARANTE O TAMANHO EXATO SEM DISTORÇÃO */}
            <img 
              src={banner.imageUrl} 
              alt="Banner Publicidade" 
              className="w-full h-full object-cover"
            />
            
            {/* Gradiente sutil para leitura */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
            
            {/* Ícone de Link se houver */}
            {banner.link && (
               <div className="absolute bottom-2 right-2 bg-white/30 backdrop-blur-md p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={14} />
               </div>
            )}
         </div>
       ))}

       {/* Indicadores (Bolinhas) */}
       {banners.length > 1 && (
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`h-1.5 rounded-full transition-all shadow-sm ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/60 w-1.5'}`}
              />
            ))}
         </div>
       )}
       
       {/* ETIQUETA "PUBLICIDADE" REMOVIDA AQUI */}
    </div>
  );
};