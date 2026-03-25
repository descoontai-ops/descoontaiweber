import React from 'react';
import { Plus, Layers, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Product, Restaurant } from '../../../types';
import { MerchantProductForm } from './MerchantProductForm';
import { MerchantGroupManager } from './MerchantGroupManager';

interface MerchantMenuTabProps {
  restaurantData: Restaurant;
  organizedMenu: { grouped: any[], orphans: any[] } | null;
  products?: Product[];
  isEditingProduct: boolean;
  setIsEditingProduct: (v: boolean) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  showGroupsManager: boolean;
  setShowGroupsManager: (v: boolean) => void;
  handleSaveProduct: (data: any) => void;
  handleDeleteProduct: (p: Product) => void;
  handleAddSection?: (name: string) => void;
  handleEditSection?: (id: string, newName: string) => void;
  handleDeleteSectionRequest: (id: string) => void;
  
  // Opcionais
  isSuspended?: boolean;
  isSaving?: boolean;
  onUpdateGroups?: (groups: any) => void;
  onNavigateToFinance?: () => void;
}

export const MerchantMenuTab: React.FC<MerchantMenuTabProps> = ({
  restaurantData, organizedMenu, isEditingProduct, setIsEditingProduct,
  selectedProduct, setSelectedProduct, showGroupsManager, setShowGroupsManager,
  handleSaveProduct, handleDeleteProduct, handleDeleteSectionRequest,
  isSuspended, isSaving, onUpdateGroups, onNavigateToFinance
}) => {

  return (
    <>
      {/* BANNER DE BLOQUEIO */}
      {isSuspended && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-start gap-3 animate-pulse">
             <AlertTriangle className="text-red-600 shrink-0 mt-1" />
             <div>
                <h3 className="font-bold text-red-800">Assinatura Suspensa</h3>
                <p className="text-sm text-red-700 mt-1">
                   Sua loja está bloqueada. Regularize na aba Financeiro.
                </p>
                {onNavigateToFinance && (
                  <button 
                     onClick={onNavigateToFinance}
                     className="mt-3 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold"
                  >
                     Regularizar Agora
                  </button>
                )}
             </div>
          </div>
      )}

      {!isEditingProduct && !showGroupsManager ? (
          <div className={`animate-in fade-in slide-in-from-bottom-2 ${isSuspended ? 'opacity-50 pointer-events-none' : ''}`}>
            
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center">
                   <h2 className="font-bold text-gray-800 text-lg">Seu Cardápio</h2>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => { setSelectedProduct(null); setIsEditingProduct(true); }}>
                        <Plus size={16} className="mr-1" /> Novo Produto
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1 bg-white border border-gray-200" onClick={() => setShowGroupsManager(true)}>
                        <Layers size={16} className="mr-1 text-purple-600" /> Adicionais
                    </Button>
                </div>
            </div>
            
            <div className="space-y-6 pb-24">
              {organizedMenu?.grouped.length === 0 && organizedMenu?.orphans.length === 0 ? (
                 <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                    <p>Você ainda não tem itens no cardápio.</p>
                 </div>
              ) : (
                organizedMenu?.grouped.map((section: any) => (
                    <div key={section.id}>
                      <div className="flex items-center justify-between mb-2 ml-1">
                          <h3 className="font-bold text-gray-600 uppercase text-xs tracking-wider">
                            {section.name}
                          </h3>
                      </div>
                      <div className="space-y-2">
                        {section.products.map((p: Product) => (
                            <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 items-center">
                              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} loading="lazy" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm text-gray-900 truncate">{p.name}</h3>
                                  <p className="text-sm font-bold text-brand-600">R$ {p.price.toFixed(2)}</p>
                              </div>
                              <div className="flex flex-col gap-2 pl-2">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); setIsEditingProduct(true); }} className="p-2 text-gray-400 hover:text-brand-600"><Edit2 size={18}/></button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p); }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : showGroupsManager ? (
          <div className="pb-20 animate-in slide-in-from-right-4">
             <div className="mb-4"><Button variant="ghost" onClick={() => setShowGroupsManager(false)} className="pl-0 text-gray-500">← Voltar</Button></div>
             <MerchantGroupManager groups={restaurantData.addonGroups || []} onUpdateGroups={onUpdateGroups!} />
          </div>
        ) : (
          <div className="pb-20 animate-in slide-in-from-right-4">
              <MerchantProductForm 
                initialData={selectedProduct}
                sections={restaurantData.menuSections || []}
                availableAddons={restaurantData.addonGroups || []}
                onSave={handleSaveProduct}
                onCancel={() => { setIsEditingProduct(false); setSelectedProduct(null); }}
                onDeleteSection={handleDeleteSectionRequest}
                isSaving={isSaving}
                defaultCategory={restaurantData.tags?.[0]} 
              />
          </div>
        )}
    </>
  );
};