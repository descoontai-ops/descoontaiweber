import React, { useState } from 'react';
import { ChevronLeft, Search, Share2, Info, Loader2 } from 'lucide-react';
import { Product } from '../../../types';

// Componentes
import { ProductItem } from '../components/ProductItem';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { RestaurantInfoCard } from '../components/RestaurantInfoCard';
import { CartDrawer } from '../../Checkout/components/CartDrawer';
import { RestaurantInfoModal } from '../components/RestaurantInfoModal';

// Hooks
import { useCart } from '../hooks/useCart';
import { useRestaurantLogic } from '../hooks/useRestaurantLogic';

interface RestaurantScreenProps {
  restaurantId: string;
  onBack: () => void;
}

export const RestaurantScreen: React.FC<RestaurantScreenProps> = ({
  restaurantId,
  onBack
}) => {
  // 1. DETECÇÃO DE MODO QUIOSQUE INTELIGENTE
  // Regra: É Quiosque (trava o usuário) SE tiver '?s=' E NÃO tiver '&mode=app'
  const params = new URLSearchParams(window.location.search);
  const hasStoreParam = params.has('s');
  const isAppMode = params.get('mode') === 'app';
  
  // Se veio pelo link da loja (s) e NÃO é um link de compartilhamento social (mode=app), esconde o voltar.
  const isKioskMode = hasStoreParam && !isAppMode;

  // 2. LÓGICA DE DADOS
  const { 
    restaurant, 
    shopCoupons, 
    isLoading, 
    activeSection, 
    setActiveSection, 
    groupedProducts, 
    searchQuery, 
    setSearchQuery,
    filteredProducts 
  } = useRestaurantLogic(restaurantId);

  const { isCartOpen, setIsCartOpen, itemCount, cartTotal } = useCart();
  
  // States Locais
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // --- FUNÇÃO DE BLINDAGEM DO PRODUTO ---
  // Garante que o produto tenha o restaurantId antes de abrir o modal
  const handleProductClick = (product: Product) => {
    if (restaurant) {
      setSelectedProduct({
        ...product,
        restaurantId: restaurant.id // <--- AQUI ESTÁ A CORREÇÃO MÁGICA
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
        <p className="text-gray-500 text-sm animate-pulse">Carregando cardápio...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loja não encontrada</h2>
          <p className="text-gray-500 mb-4">O estabelecimento que você procura não está disponível.</p>
          {!isKioskMode && (
            <button onClick={onBack} className="text-brand-600 font-bold hover:underline">
              Voltar ao início
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* HEADER DE NAVEGAÇÃO */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm h-14 flex items-center justify-between px-4 transition-all duration-200">
        <div className="flex items-center gap-2">
          {!isKioskMode && (
             <button 
               onClick={onBack}
               className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600"
             >
               <ChevronLeft size={24} />
             </button>
          )}
          <h1 className="font-bold text-gray-800 truncate max-w-[200px] text-sm">
            {restaurant.name}
          </h1>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
             <Search size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
             <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* CONTEÚDO SCROLLÁVEL */}
      <div className="pt-14">
        
        {/* Card Principal da Loja */}
        <div className="bg-white pb-4 mb-2">
           <RestaurantInfoCard 
             restaurant={restaurant} 
             onMoreInfo={() => setIsInfoModalOpen(true)}
           />
           
           {/* Barra de Busca Local */}
           <div className="px-4 mt-4">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   type="text"
                   placeholder={`Buscar em ${restaurant.name}...`}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                 />
              </div>
           </div>
        </div>

        {/* NAVEGAÇÃO POR CATEGORIAS (Sticky) */}
        {!searchQuery && groupedProducts.length > 0 && (
          <div className="sticky top-14 z-20 bg-white border-b border-gray-100 shadow-sm mb-4">
             <div className="flex overflow-x-auto hide-scrollbar py-3 px-4 gap-2">
                <button
                  onClick={() => setActiveSection('cardapio')}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeSection === 'cardapio' 
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Cardápio
                </button>
                {groupedProducts.map(group => (
                   <button
                     key={group.categoryId}
                     onClick={() => {
                        const el = document.getElementById(`cat-${group.categoryId}`);
                        if (el) {
                           const offset = 120; // Ajuste para o header + nav sticky
                           const bodyRect = document.body.getBoundingClientRect().top;
                           const elementRect = el.getBoundingClientRect().top;
                           const elementPosition = elementRect - bodyRect;
                           const offsetPosition = elementPosition - offset;
                           
                           window.scrollTo({
                             top: offsetPosition,
                             behavior: "smooth"
                           });
                        }
                     }}
                     className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                   >
                     {group.categoryName}
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* LISTA DE PRODUTOS */}
        <div className="min-h-[50vh]">
            {searchQuery ? (
               <div className="px-4 pb-24">
                 <h3 className="font-bold text-lg mb-4 text-gray-800">Resultados da busca</h3>
                 {filteredProducts.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                       {filteredProducts.map(product => (
                          <ProductItem 
                            key={product.id} 
                            product={product} 
                            onClick={() => handleProductClick(product)} 
                          />
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-10 text-gray-400">
                       <p>Nenhum item encontrado.</p>
                    </div>
                 )}
               </div>
            ) : (
              <div className="pb-24 px-4 space-y-6">
                {groupedProducts.map((group) => (
                  <div key={group.categoryId} id={`cat-${group.categoryId}`} className="scroll-mt-32">
                    <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
                       {group.categoryName}
                       <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                         {group.products.length}
                       </span>
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                       {group.products.map(product => (
                          <ProductItem 
                            key={product.id} 
                            product={product} 
                            onClick={() => handleProductClick(product)} 
                          />
                       ))}
                    </div>
                  </div>
                ))}
                
                {/* Espaço extra no final */}
                <div className="h-10"></div>
              </div>
            )}
        </div>
      </div>

      {/* FLOATING CART BUTTON */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center active:scale-[0.98] transition-transform ring-4 ring-gray-900/10"
          >
             <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm backdrop-blur-sm">{itemCount}</div>
                <div className="text-left leading-none">
                   <p className="text-sm font-medium opacity-90">Ver Sacola</p>
                   <p className="text-xs opacity-75">R$ {cartTotal.toFixed(2)}</p>
                </div>
             </div>
             <span className="font-bold text-sm bg-white text-gray-900 px-3 py-1.5 rounded-lg">Finalizar</span>
          </button>
        </div>
      )}

      {/* MODAIS */}
      {selectedProduct && restaurant && (
        <ProductDetailsModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          isStoreOpen={restaurant.isOpen}
        />
      )}
      
      {/* Modal de Informações da Loja */}
      <RestaurantInfoModal 
         restaurant={restaurant}
         isOpen={isInfoModalOpen}
         onClose={() => setIsInfoModalOpen(false)}
      />

    </div>
  );
};