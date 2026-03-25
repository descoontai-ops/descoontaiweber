import React, { useEffect } from 'react';
import { Store, LogOut, Loader2, LayoutGrid, Truck, BarChart3, UserCog, Headphones, Wallet, Trash2, AlertTriangle, Lock, Ticket, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { MerchantDeliverySettings } from '../components/MerchantDeliverySettings';
import { MerchantAnalyticsScreen } from './MerchantAnalyticsScreen';
import { MerchantProfileSettings } from '../components/MerchantProfileSettings';
import { MerchantSupportTab } from '../components/MerchantSupportTab';
import { MerchantSubscriptionScreen } from '../../Subscription/screens/MerchantSubscriptionScreen';
import { useAuth } from '../../Auth/context/AuthContext';
import { useMerchantDashboard } from '../hooks/useMerchantDashboard';
import { MerchantMenuTab } from '../components/MerchantMenuTab';
import { useSubscriptionAutoCheck } from '../../Subscription/hooks/useSubscriptionAutoCheck'; 
import { MerchantCouponManager } from '../components/MerchantCouponManager';
// NOVO IMPORT (A Configuração de Senha/Pedidos)
import { MerchantOrderSettings } from '../components/MerchantOrderSettings';

interface MerchantDashboardScreenProps {
  onLogout: () => void;
}

export const MerchantDashboardScreen: React.FC<MerchantDashboardScreenProps> = ({ onLogout }) => {
  const { logout } = useAuth();
  
  const {
    restaurantData, products, organizedMenu, isLoading,
    activeTab, setActiveTab,
    isEditingProduct, setIsEditingProduct,
    showGroupsManager, setShowGroupsManager,
    selectedProduct, setSelectedProduct,
    isDeleting, sectionToDelete, setSectionToDelete,
    handleSaveProduct, handleDeleteProduct, confirmDeleteSection,
    handleAddSection, handleEditSection, handleDeleteSectionRequest
  } = useMerchantDashboard();

  // Verifica assinatura automaticamente ao abrir
  useSubscriptionAutoCheck(restaurantData?.id);

  // Efeito para rolar para o topo ao mudar de aba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-600" size={40} />
      </div>
    );
  }

  if (!restaurantData) {
    return <div className="p-8 text-center">Erro ao carregar dados da loja.</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <MerchantMenuTab 
            restaurantData={restaurantData}
            organizedMenu={organizedMenu}
            products={products}
            isEditingProduct={isEditingProduct}
            setIsEditingProduct={setIsEditingProduct}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            showGroupsManager={showGroupsManager}
            setShowGroupsManager={setShowGroupsManager}
            handleSaveProduct={handleSaveProduct}
            handleDeleteProduct={handleDeleteProduct}
            handleAddSection={handleAddSection}
            handleEditSection={handleEditSection}
            handleDeleteSectionRequest={handleDeleteSectionRequest}
            isSuspended={restaurantData?.subscriptionStatus === 'suspended'}
            onNavigateToFinance={() => setActiveTab('subscription')}
          />
        );
      case 'delivery':
        return <MerchantDeliverySettings restaurant={restaurantData} />;
      case 'analytics':
        return <MerchantAnalyticsScreen restaurant={restaurantData} />;
      case 'coupons':
        return <MerchantCouponManager restaurant={restaurantData} />;
      case 'orders_settings': // NOVA ABA
        return <MerchantOrderSettings restaurant={restaurantData} />;
      case 'profile':
        return <MerchantProfileSettings restaurant={restaurantData} />;
      case 'subscription':
         return <MerchantSubscriptionScreen restaurant={restaurantData} />;
      case 'support':
        return <MerchantSupportTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 md:pl-64">
      {/* HEADER MOBILE */}
      <div className="md:hidden bg-white px-4 py-3 shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold">
             {restaurantData.name.charAt(0)}
           </div>
           <span className="font-bold text-gray-800 truncate max-w-[150px]">{restaurantData.name}</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <LogOut size={20} />
        </button>
      </div>

      {/* SIDEBAR DESKTOP (Futuro) - Por enquanto focado no Mobile */}
      
      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      {/* BOTTOM NAVIGATION (MENU INFERIOR) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-30 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center overflow-x-auto no-scrollbar">
          
          <NavButton 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')} 
            icon={LayoutGrid} 
            label="Cardápio" 
          />
          
          <NavButton 
            active={activeTab === 'delivery'} 
            onClick={() => setActiveTab('delivery')} 
            icon={Truck} 
            label="Entrega" 
          />
          
          {/* BOTÃO NOVO: PEDIDOS/IMPRESSÃO */}
          <NavButton 
            active={activeTab === 'orders_settings'} 
            onClick={() => setActiveTab('orders_settings')} 
            icon={Printer} 
            label="Pedidos" 
          />

          <NavButton 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            icon={BarChart3} 
            label="Dados" 
          />
          
          <NavButton 
            active={activeTab === 'coupons'} 
            onClick={() => setActiveTab('coupons')} 
            icon={Ticket} 
            label="Cupons" 
          />

          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={Store} 
            label="Loja" 
          />

           <NavButton 
            active={activeTab === 'subscription'} 
            onClick={() => setActiveTab('subscription')} 
            icon={Wallet} 
            label="Assinatura" 
          />
        </div>
      </nav>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE SEÇÃO */}
      <Modal isOpen={!!sectionToDelete} onClose={() => setSectionToDelete(null)} title="Excluir Categoria">
        <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
                <div className="bg-red-50 p-4 rounded-full mb-3"><AlertTriangle size={32} className="text-red-500" /></div>
                <p className="text-gray-800 font-bold text-lg mb-2">Excluir Seção?</p>
                <p className="text-gray-600 text-sm">Todos os produtos desta seção serão apagados permanentemente.</p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => setSectionToDelete(null)} disabled={isDeleting}>Cancelar</Button>
                <Button onClick={confirmDeleteSection} isLoading={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">Sim, Excluir Tudo</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

// Componente NavButton Auxiliar
const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; disabled?: boolean }> = ({ active, onClick, icon: Icon, label, disabled }) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 transition-colors ${
        active 
          ? 'text-brand-600' 
          : disabled 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-brand-50 transform scale-110' : ''}`}>
         <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
);