import React, { useState, useEffect } from 'react';
import { StoryCircle } from './StoryCircle';
import { PromotionsModal } from './PromotionsModal';
import { Story, Product, Restaurant } from '../../../types';
import { Flame, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// CONFIGURAÇÃO VISUAL DAS CATEGORIAS (STORIES)
// URLs atualizadas com as novas imagens personalizadas
const CATEGORY_CONFIG: Record<string, { name: string, image: string }> = {
  'hamburgueria': { 
    name: 'Burger', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/sanduiche.png?raw=true' 
  },
  'pizzaria': { 
    name: 'Pizza', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/pizza.png?raw=true' 
  },
  'pastelaria': { 
    name: 'Pastel', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/pastel.png?raw=true' 
  },
  'sushi': { 
    name: 'Sushi', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/sushi.png?raw=true' 
  },
  'salgaderia': {
    name: 'Salgado',
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/salgados.png?raw=true'
  },
  'acai': { 
    name: 'Açaí', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/acai.png?raw=true' 
  },
  'sorvete': { 
    name: 'Sorvete', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/sorvete.png?raw=true' 
  },
  'marmitaria': {
    name: 'Marmitas',
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/marmita.png?raw=true'
  },
  'doces': { 
    name: 'Doces', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/bolos.png?raw=true' 
  },
  'espetinho': { 
    name: 'Espetinho', 
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/espeto.png?raw=true' 
  },
  'farmacia': {
    name: 'Farmácia',
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/farmacia.png?raw=true'
  },
  'mercantil': {
    name: 'Mercantil',
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/mercado.png?raw=true'
  },
  'agua': {
    name: 'Água',
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/agua.png?raw=true'
  },
  'churrasco': {
    name: 'Churrasco',
    image: 'https://github.com/descoontai-ops/imagensstory/blob/main/carne.png?raw=true'
  },
  'cerveja': {
    name: 'Cervejas',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/cerveja.png?raw=true'
  },
  'bebidas': {
    name: 'Bebidas',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/bebidas.png?raw=true'
  },
  'adega': {
    name: 'Vinhos e Adega',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/adega.png?raw=true'
  },
  'sucos': {
    name: 'Sucos Naturais',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/sucos.png?raw=true'
  },
  'cafe': {
    name: 'Cafeteria',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/cafeteria.png?raw=true'
  },
  'cachorro_quente': {
    name: 'Hot Dog',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/cachorro_quente.png?raw=true'
  },
  'padaria': {
    name: 'Padaria',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/padaria.png?raw=true'
  },
  'arabe': {
    name: 'Comida Árabe',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/arabe.png?raw=true'
  },
  'italiana': {
    name: 'Massas',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/italiana.png?raw=true'
  },
  'brasileira': {
    name: 'Comida Brasileira',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/brasileira.png?raw=true'
  },
  'chinesa': {
    name: 'Chinesa',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/chinesa.png?raw=true'
      },
  'sopas': {
    name: 'Caldos e Sopas',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/sopas.png?raw=true'
          },
  'frutos_do_mar': {
    name: 'Frutos do Mar',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/frutodomar.png?raw=true'
  },
  'frango_frito': {
    name: 'Frango Frito',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/frango_frito.png?raw=true'
  },
  'peixes': {
    name: 'Peixes',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/peixes.png?raw=true'
  },
  'tapioca': {
    name: 'Tapioca',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/tapioca.png?raw=true'
  },
  'batata': {
    name: 'Batata Recheada',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/batata.png?raw=true'
    },
  'crepe': {
    name: 'Crepes',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/crepes.png?raw=true'
  },
  'saudavel': {
    name: 'Saudável',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/saudavel.png?raw=true'
  },
  'vegetariana': {
    name: 'Vegetariana',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/vegetariana.png?raw=true'
  },
  'acougue': {
    name: 'Açougue',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/acougue.png?raw=true'
  },
  'hortifruti': {
    name: 'Hortifruti',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/hortifruti.png?raw=true'
  },
  'petshop': {
    name: 'Pet Shop',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/petshop.png?raw=true'
  },
  'congelados': {
    name: 'Congelados',
    image: 'https://github.com/descoontai-ops/imagensstory2/blob/main/congelados.png?raw=true'
  }
};

// Imagem fixa para "TOP Ofertas"
const ALL_OFFERS_IMAGE = 'https://github.com/descoontai-ops/imagensstory/blob/main/topromocoes.png?raw=true';

// Função auxiliar para "limpar" o ID da categoria vindo do banco
const normalizeCategoryId = (id: string): string => {
  if (!id) return '';
  return id
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .trim();
};

interface PromotionStoriesProps {
  onSelectRestaurant?: (id: string) => void;
}

export const PromotionStories: React.FC<PromotionStoriesProps> = ({ onSelectRestaurant }) => {
  const [selectedCategory, setSelectedCategory] = useState<{id: string, name: string} | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePromotions = async () => {
      try {
        const [productsSnapshot, merchantsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'products'), where('isActive', '==', true))),
          getDocs(collection(db, 'merchants'))
        ]);
        
        const merchantsMap: Record<string, Restaurant> = {};
        merchantsSnapshot.forEach(doc => {
           merchantsMap[doc.id] = doc.data() as Restaurant;
        });

        // --- LÓGICA DE VERIFICAÇÃO DE HORÁRIO (CORRIGIDA E ROBUSTA) ---
        const isRestaurantOpen = (restaurant: Restaurant): boolean => {
            // 1. Interruptor Manual (Mestre)
            if (!restaurant.isOpen) return false;

            // 2. Sem horário cadastrado? Considera FECHADO para evitar erros (ou ABERTO se preferir 24h)
            // Minha sugestão: Se não tem horário, confia apenas no manual.
            if (!restaurant.schedule) return true; 

            const now = new Date();
            const dayIndex = now.getDay();
            const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const currentKey = keysMap[dayIndex];
            const todaySchedule = restaurant.schedule[currentKey];

            // 3. Se não tem horário para HOJE especificamente, está fechado.
            if (!todaySchedule || !todaySchedule.isOpen) return false;

            // 4. Cálculo de Horas com suporte a Madrugada
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const [openH, openM] = todaySchedule.open.split(':').map(Number);
            const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
            
            const openTime = openH * 60 + openM;
            const closeTime = closeH * 60 + closeM;

            // Caso especial: Madrugada (Ex: Abre 18:00 e Fecha 02:00)
            if (closeTime < openTime) {
               // A loja está aberta se:
               // - A hora atual é MAIOR que a abertura (ex: 20:00)
               // - OU se a hora atual é MENOR que o fechamento (ex: 01:00)
               return currentMinutes >= openTime || currentMinutes <= closeTime;
            }

            // Caso normal: Abre 08:00 e Fecha 18:00
            return currentMinutes >= openTime && currentMinutes <= closeTime;
        };

        const activeCategoryIds = new Set<string>();
        let hasAnyPromo = false;

        productsSnapshot.forEach((doc) => {
          const product = doc.data() as Product;
          const merchant = merchantsMap[product.restaurantId];

          // REGRA DE OURO: Só conta a promoção se a loja estiver ABERTA e VÁLIDA
          if (merchant && isRestaurantOpen(merchant)) {
              // Verificar se tem desconto REAL (Original > Preço Atual)
              if (product.originalPrice && product.originalPrice > product.price) {
                if (product.categoryId) {
                  const normalizedId = normalizeCategoryId(product.categoryId);
                  
                  if (CATEGORY_CONFIG[normalizedId]) {
                    activeCategoryIds.add(normalizedId);
                  }
                  
                  hasAnyPromo = true;
                }
              }
          }
        });

        const stories: Story[] = [];

        // Story fixo de TOP OFERTAS
        if (hasAnyPromo) {
          stories.push({
            id: 'all',
            name: 'TOP Ofertas',
            image: ALL_OFFERS_IMAGE
          });
        }

        // Stories das categorias dinâmicas
        activeCategoryIds.forEach((catId) => {
           const config = CATEGORY_CONFIG[catId];
           if (config) {
             stories.push({
               id: catId,
               name: config.name,
               image: config.image
             });
           }
        });

        setActiveStories(stories);

      } catch (error) {
        console.error("Erro ao carregar promoções:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePromotions();
    
    // Atualiza a cada 5 min
    const interval = setInterval(fetchActivePromotions, 5 * 60 * 1000);
    return () => clearInterval(interval);

  }, []);

  if (loading) {
    return (
      <div className="bg-white pt-4 pb-4 border-b border-gray-100 shadow-sm min-h-[120px] flex items-center justify-center">
         <Loader2 className="animate-spin text-gray-300" size={24} />
      </div>
    );
  }

  if (activeStories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white pt-4 pb-4 border-b border-gray-100 shadow-sm animate-in slide-in-from-top-2">
      
      {/* Indicador Visual */}
      <div className="px-4 mb-3 flex items-center gap-1.5">
        <Flame size={16} className="text-red-500 fill-red-500 animate-pulse" />
        <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider">
          Storys de Promoções
        </h2>
      </div>

      <div className="flex space-x-4 overflow-x-auto px-4 pb-2 no-scrollbar">
        {activeStories.map(story => (
          <StoryCircle 
            key={story.id} 
            story={story} 
            onClick={() => setSelectedCategory({ id: story.id, name: story.name })}
          />
        ))}
      </div>

      <PromotionsModal 
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        categoryName={selectedCategory?.name || ''}
        categoryId={selectedCategory?.id || 'all'}
        onNavigateToRestaurant={(id) => onSelectRestaurant && onSelectRestaurant(id)}
      />
    </div>
  );
};