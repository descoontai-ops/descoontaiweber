import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation as useRouterLocation } from 'react-router-dom'; 
import { HomeScreen } from './features/Home/screens/HomeScreen';
import { RestaurantScreen } from './features/Restaurant/screens/RestaurantScreen';
import { CartDrawer } from './features/Checkout/components/CartDrawer';
import { LocationSelectorModal } from './features/Location/components/LocationSelectorModal';
import { BottomNavigation, NavTab } from './components/layout/BottomNavigation';
import { SearchScreen } from './features/Search/screens/SearchScreen';
import { SettingsScreen } from './features/Settings/screens/SettingsScreen';
import { MerchantRegistrationScreen } from './features/Merchant/screens/MerchantRegistrationScreen';
import { MerchantDashboardScreen } from './features/Merchant/screens/MerchantDashboardScreen';
import { AdminDashboardScreen } from './features/Admin/screens/AdminDashboardScreen';
import { LoginScreen } from './features/Auth/screens/LoginScreen'; 
import { FilterProvider } from './features/Home/context/FilterContext';
import { LocationProvider, useLocation } from './features/Location/context/LocationContext';
import { AppMessageOverlay } from './components/layout/AppMessageOverlay'; 
import { GlobalPromoOverlay } from './components/layout/GlobalPromoOverlay'; 
import { AuthProvider, useAuth } from './features/Auth/context/AuthContext';
import { PWAProvider } from './features/PWA/context/PWAContext'; 
import { InstallPWAOverlay } from './features/PWA/components/InstallPWAOverlay'; 
import { SplashScreen } from './components/layout/SplashScreen'; 
import { ShopsScreen } from './features/Shops/screens/ShopsScreen';
import { CartProvider } from './features/Restaurant/hooks/useCart'; 
import { conditionalPromptForPush } from './features/Notifications/services/notificationService';
import { OrderPrintScreen } from './features/Orders/screens/OrderPrintScreen';

// IMPORT DA TELA DE PEDIDOS
import { MyOrdersScreen } from './features/MyOrders/screens/MyOrdersScreen';

type Screen = 'login_screen' | 'main_tabs' | 'restaurant_detail' | 'merchant_registration' | 'merchant_dashboard' | 'admin_dashboard';

const AppContent: React.FC = () => {
  const routerLocation = useRouterLocation();
  
  if (routerLocation.pathname.startsWith('/imprimir/')) {
     return <OrderPrintScreen />;
  }

  const { user, userRole, isLoading: isAuthLoading, savedAddresses } = useAuth();
  const { location, setLocation, isLocationModalOpen } = useLocation();
  
  const [showSplash, setShowSplash] = useState(true);

  const [currentScreen, setCurrentScreen] = useState<Screen>('login_screen');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const notificationTimer = setTimeout(() => {
       if (user && !showSplash) {
          conditionalPromptForPush();
       }
    }, 5000);

    return () => clearTimeout(notificationTimer);
  }, [user, showSplash]);

  useEffect(() => {
    if (user && savedAddresses.length > 0 && !location) {
      setLocation(savedAddresses[0]);
    }
  }, [user, savedAddresses, location, setLocation]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        const params = new URLSearchParams(window.location.search);
        const deepLinkStoreId = params.get('s');

        if (userRole === 'merchant') {
            if (currentScreen !== 'merchant_registration') {
                setCurrentScreen('merchant_dashboard');
            }
        } else if (userRole === 'admin') {
            setCurrentScreen('admin_dashboard');
        } else {
            if (deepLinkStoreId && currentScreen !== 'restaurant_detail') {
               setSelectedRestaurantId(deepLinkStoreId);
               setCurrentScreen('restaurant_detail');
            } else if (currentScreen === 'login_screen' && !deepLinkStoreId) {
               setCurrentScreen('main_tabs');
               setActiveTab('home'); 
            }
        }
      } else {
        if (currentScreen !== 'merchant_registration') {
           setCurrentScreen('login_screen');
        }
      }
    }
  }, [user, userRole, isAuthLoading, currentScreen]);

  const handleRestaurantSelect = (id: string) => {
    setSelectedRestaurantId(id);
    setCurrentScreen('restaurant_detail');
  };

  const handleLoginSuccess = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('s')) return;

    if (!selectedRestaurantId) {
       setCurrentScreen('main_tabs');
       setActiveTab('home'); 
    }
  };

  const shouldShowSplash = showSplash || (isAuthLoading && currentScreen !== 'merchant_registration');

  if (shouldShowSplash) {
    return <SplashScreen />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onSelectRestaurant={handleRestaurantSelect} />;
      case 'search':
        return <SearchScreen onSelectRestaurant={handleRestaurantSelect} />;
      case 'shops':
        return (
          <FilterProvider>
             <ShopsScreen onSelectRestaurant={handleRestaurantSelect} />
          </FilterProvider>
        );
      case 'orders': // ROTA DE PEDIDOS
        return <MyOrdersScreen />;
      case 'settings':
        return (
          <SettingsScreen 
            onNavigateToMerchantRegistration={() => setCurrentScreen('merchant_registration')}
            onNavigateToMerchantDashboard={() => setCurrentScreen('merchant_dashboard')}
            onNavigateToAdmin={() => setCurrentScreen('admin_dashboard')}
            onNavigateToLogin={() => setCurrentScreen('login_screen')}
          />
        );
      default:
        return <HomeScreen onSelectRestaurant={handleRestaurantSelect} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden pb-16">
      
      {user && !isLocationModalOpen && currentScreen !== 'login_screen' && (
        <InstallPWAOverlay />
      )}

      <AppMessageOverlay /> 

      {currentScreen === 'login_screen' && (
        <div className="animate-in fade-in duration-300 z-50 absolute inset-0 bg-white overflow-y-auto">
          <LoginScreen 
            onBack={user ? () => setCurrentScreen('main_tabs') : undefined}
            onNavigateToMerchantRegistration={() => setCurrentScreen('merchant_registration')}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      )}

      {currentScreen === 'main_tabs' && user && (
        <div className="animate-in fade-in duration-300 h-full overflow-y-auto">
          {renderTabContent()}
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
      
      {/* CORREÇÃO DO SCROLL: Adicionado overflow-y-auto aqui */}
      {currentScreen === 'restaurant_detail' && selectedRestaurantId && user && (
        <div className="animate-in slide-in-from-right duration-300 absolute inset-0 bg-white z-40 overflow-y-auto">
          <RestaurantScreen 
            restaurantId={selectedRestaurantId} 
            onBack={() => {
              setCurrentScreen('main_tabs');
              setSelectedRestaurantId(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('s');
              window.history.replaceState({}, '', url);
            }} 
          />
        </div>
      )}

      {currentScreen === 'merchant_registration' && (
        <div className="animate-in slide-in-from-bottom duration-300 z-50 bg-white absolute inset-0 overflow-y-auto">
          <MerchantRegistrationScreen 
            onBack={() => setCurrentScreen(user ? 'main_tabs' : 'login_screen')} 
            onSuccess={() => setCurrentScreen('merchant_dashboard')}
          />
        </div>
      )}

      {currentScreen === 'merchant_dashboard' && user && (
        <div className="animate-in fade-in duration-300 z-50 bg-gray-50 absolute inset-0 overflow-y-auto">
          <MerchantDashboardScreen onLogout={() => setCurrentScreen('login_screen')} />
        </div>
      )}

      {currentScreen === 'admin_dashboard' && user && (
        <div className="animate-in fade-in duration-300 z-50 bg-gray-100 absolute inset-0 overflow-y-auto">
          <AdminDashboardScreen onBack={() => setCurrentScreen('main_tabs')} />
        </div>
      )}

      {user && (
        <>
          <CartDrawer />
          <LocationSelectorModal />
          <GlobalPromoOverlay /> 
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <FilterProvider>
            <CartProvider>
              <PWAProvider>
                <AppContent />
              </PWAProvider>
            </CartProvider>
          </FilterProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;