import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../Auth/context/AuthContext';
import { Product, Restaurant, MenuSection, AddonGroup } from '../../../types';
import { doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';

export const useMerchantDashboard = () => {
  const { user } = useAuth();
  
  // --- STATE ---
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI Control - ADICIONADO 'coupons' AQUI
  const [activeTab, setActiveTab] = useState<'menu' | 'delivery' | 'coupons' | 'analytics' | 'profile' | 'support' | 'finance'>('menu');
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [showGroupsManager, setShowGroupsManager] = useState(false); 
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Loading & Saving
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modals
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  // Status Realtime
  const [realTimeStatus, setRealTimeStatus] = useState<{isOpen: boolean, label: string}>({ isOpen: false, label: 'Carregando...' });

  // --- LISTENERS ---
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const unsubMerchant = onSnapshot(doc(db, 'merchants', user.uid), (doc) => {
       if (doc.exists()) setRestaurantData(doc.data() as Restaurant);
       else setRestaurantData(null);
       setIsLoading(false);
    });

    const q = query(collection(db, 'products'), where('restaurantId', '==', user.uid));
    const unsubProducts = onSnapshot(q, (snapshot) => {
       const prods: Product[] = [];
       snapshot.forEach((doc) => prods.push({ ...doc.data(), id: doc.id } as Product));
       setProducts(prods);
    });

    return () => { unsubMerchant(); unsubProducts(); };
  }, [user]);

  // --- REALTIME STATUS LOGIC ---
  useEffect(() => {
    if (!restaurantData) return;
    const calculateStatus = () => {
        if (restaurantData.subscriptionStatus === 'suspended') {
            setRealTimeStatus({ isOpen: false, label: 'BLOQUEADO (Pagamento)' });
            return;
        }
        if (!restaurantData.isOpen) {
            setRealTimeStatus({ isOpen: false, label: 'Modo Invisível (Oculto)' });
            return;
        }
        if (!restaurantData.schedule) {
            setRealTimeStatus({ isOpen: true, label: 'Aberto agora' });
            return;
        }
        
        const now = new Date();
        const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const todaySchedule = restaurantData.schedule[keysMap[now.getDay()]];

        if (!todaySchedule || !todaySchedule.isOpen) {
            setRealTimeStatus({ isOpen: false, label: 'Fechado hoje' });
            return;
        }

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [openH, openM] = todaySchedule.open.split(':').map(Number);
        const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
        const openTime = openH * 60 + openM;
        let closeTime = closeH * 60 + closeM;
        if (closeTime < openTime) closeTime += 24 * 60;

        if (currentMinutes >= openTime && currentMinutes <= closeTime) {
            setRealTimeStatus({ isOpen: true, label: `Aberto até ${todaySchedule.close}` });
        } else {
            setRealTimeStatus({ isOpen: false, label: currentMinutes < openTime ? `Fechado (Abre às ${todaySchedule.open})` : 'Fechado por hoje' });
        }
    };
    calculateStatus();
    const interval = setInterval(calculateStatus, 60000);
    return () => clearInterval(interval);
  }, [restaurantData]);

  // --- HELPERS ---
  const isSuspended = restaurantData?.subscriptionStatus === 'suspended';

  const checkPermission = (): boolean => {
      if (isSuspended) {
          alert("Sua conta está suspensa por falta de pagamento. Regularize na aba Financeiro.");
          setActiveTab('finance');
          return false;
      }
      return true;
  };

  const uploadImage = async (imageInput: string | File, pathPrefix: string = 'products'): Promise<string> => {
      if (typeof imageInput === 'string' && imageInput.startsWith('http')) return imageInput;
      if (typeof imageInput === 'string' && imageInput.startsWith('blob:')) {
          const response = await fetch(imageInput);
          const blob = await response.blob();
          const storageRef = ref(storage, `${pathPrefix}/${user?.uid}/${Date.now()}.jpg`);
          await uploadBytes(storageRef, blob);
          return await getDownloadURL(storageRef);
      }
      return 'https://via.placeholder.com/300';
  };

  const recalculatePromoStatus = async (userId: string) => {
    const q = query(collection(db, 'products'), where('restaurantId', '==', userId));
    const snapshot = await getDocs(q);
    let hasActivePromo = false;
    snapshot.forEach((doc) => {
        const p = doc.data() as Product;
        if (p.isActive !== false && p.originalPrice && p.originalPrice > p.price) hasActivePromo = true;
    });
    await updateDoc(doc(db, 'merchants', userId), { hasActivePromo: hasActivePromo });
  };

  // --- ACTIONS ---

  const handleUpdateGroups = async (newGroups: AddonGroup[]) => {
    if(!checkPermission() || !user) return;
    try {
      await updateDoc(doc(db, 'merchants', user.uid), { addonGroups: newGroups });
    } catch(e) { console.error(e); alert('Erro ao salvar grupos.'); }
  };

  const handleSaveProduct = async (productData: any) => {
    if (!checkPermission() || !restaurantData || !user) return;
    setIsSaving(true);
    try {
        let finalSectionId = productData.sectionId;
        if (finalSectionId && finalSectionId.startsWith('NEW:::')) {
            const newSectionName = finalSectionId.replace('NEW:::', '');
            const newSection: MenuSection = {
                id: 'sec_' + Math.random().toString(36).substr(2, 9),
                name: newSectionName,
                order: (restaurantData.menuSections?.length || 0) + 1
            };
            await updateDoc(doc(db, 'merchants', user.uid), { menuSections: [...(restaurantData.menuSections || []), newSection] });
            finalSectionId = newSection.id;
        }

        const imageUrl = await uploadImage(productData.image, 'products');
        const payload = {
            ...productData,
            image: imageUrl,
            sectionId: finalSectionId,
            restaurantId: user.uid,
            price: Number(productData.price),
            originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null
        };

        if (selectedProduct) {
            await updateDoc(doc(db, 'products', selectedProduct.id), payload);
            alert('Produto atualizado!');
        } else {
            await addDoc(collection(db, 'products'), payload);
            alert('Produto criado com sucesso!');
        }
        await recalculatePromoStatus(user.uid);
        setIsEditingProduct(false);
        setSelectedProduct(null);
    } catch (error) { console.error(error); alert('Erro ao salvar produto.'); } 
    finally { setIsSaving(false); }
  };

  const confirmDeleteProduct = async () => {
    if (!user || !productToDelete) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'products', productToDelete.id));
        await recalculatePromoStatus(user.uid);
        setProductToDelete(null); 
    } catch (e) { console.error(e); alert('Erro ao excluir.'); } 
    finally { setIsDeleting(false); }
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete || !restaurantData || !user) return;
    const sectionProducts = products.filter(p => p.sectionId === sectionToDelete);
    setIsDeleting(true);
    try {
        if (sectionProducts.length > 0) {
           await Promise.all(sectionProducts.map(p => deleteDoc(doc(db, 'products', p.id))));
        }
        const updatedSections = restaurantData.menuSections.filter(s => s.id !== sectionToDelete);
        await updateDoc(doc(db, 'merchants', user.uid), { menuSections: updatedSections });
        setSectionToDelete(null);
        if (sectionProducts.length > 0) recalculatePromoStatus(user.uid);
    } catch (error) { console.error(error); alert("Erro ao excluir seção."); } 
    finally { setIsDeleting(false); }
  };

  const handleUpdateDelivery = async (newConfig: any) => {
     if(checkPermission() && restaurantData && user) {
        try {
            await updateDoc(doc(db, 'merchants', user.uid), { deliveryConfig: newConfig });
            alert('Configurações salvas.');
        } catch (e) { console.error(e); alert('Erro ao salvar entrega.'); }
     }
  };

  const handleUpdateProfile = async (newData: Partial<Restaurant>) => {
     if(checkPermission() && restaurantData && user) {
        setIsSaving(true);
        try {
            if (newData.coverImage?.startsWith('blob:')) newData.coverImage = await uploadImage(newData.coverImage, 'covers');
            if (newData.image?.startsWith('blob:')) newData.image = await uploadImage(newData.image, 'logos');
            await updateDoc(doc(db, 'merchants', user.uid), newData);
            alert('Perfil atualizado!');
        } catch (e) { console.error(e); alert('Erro ao atualizar perfil.'); } 
        finally { setIsSaving(false); }
     }
  };

  const organizedMenu = useMemo(() => {
    if (!restaurantData) return null;
    const sections = restaurantData.menuSections || [];
    return {
      grouped: sections.map(section => ({ ...section, products: products.filter(p => p.sectionId === section.id) })),
      orphans: products.filter(p => !sections.find(s => s.id === p.sectionId))
    };
  }, [restaurantData, products]);

  return {
    // State
    user, restaurantData, products, organizedMenu, isLoading,
    activeTab, setActiveTab,
    isEditingProduct, setIsEditingProduct,
    showGroupsManager, setShowGroupsManager,
    selectedProduct, setSelectedProduct,
    realTimeStatus, isSuspended,
    // Loading State
    isSaving, isDeleting,
    // Modals
    productToDelete, setProductToDelete,
    sectionToDelete, setSectionToDelete,
    // Actions
    handleUpdateGroups,
    handleSaveProduct,
    handleUpdateDelivery,
    handleUpdateProfile,
    confirmDeleteProduct,
    confirmDeleteSection,
    checkPermission
  };
};