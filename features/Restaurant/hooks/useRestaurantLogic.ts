import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product, Restaurant } from '../../../types';

interface VisibleCoupon {
  id: string;
  code: string;
  value: number;
  type: 'percent' | 'fixed';
  minOrderValue: number;
}

export const useRestaurantLogic = (restaurantId: string) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopCoupons, setShopCoupons] = useState<VisibleCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeSection, setActiveSection] = useState<string>('cardapio');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let realId = restaurantId;
        let restData: Restaurant | null = null;

        // Tenta achar por ID direto (MUITO mais rápido)
        const docRef = doc(db, 'merchants', restaurantId.trim());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          restData = { id: docSnap.id, ...docSnap.data() } as Restaurant;
        } else {
          // Fallback: Tentar por SLUG (Somente se ID falhar)
          const slugQuery = query(
            collection(db, 'merchants'), 
            where('slug', '==', restaurantId.trim()),
            limit(1)
          );
          const slugSnapshot = await getDocs(slugQuery);
          if (!slugSnapshot.empty) {
            const docData = slugSnapshot.docs[0];
            realId = docData.id;
            restData = { id: docData.id, ...docData.data() } as Restaurant;
          }
        }

        if (restData) {
           setRestaurant(restData);

           const [prodSnap, couponSnap] = await Promise.all([
             getDocs(query(collection(db, 'products'), where('restaurantId', '==', realId))),
             getDocs(query(collection(db, 'merchants', realId, 'coupons'), where('isActive', '==', true)))
           ]);

           const prods: Product[] = [];
           prodSnap.forEach((doc) => {
              const data = doc.data();
              if (data.isActive !== false) {
                prods.push({ ...data, id: doc.id, restaurantId: realId } as Product);
              }
           });
           setProducts(prods);

           const couponsList: VisibleCoupon[] = [];
           couponSnap.forEach(doc => {
              couponsList.push({ id: doc.id, ...doc.data() } as VisibleCoupon);
           });
           setShopCoupons(couponsList);

        } else {
           setError("Loja não encontrada.");
        }
      } catch (err) {
        console.error("Erro useRestaurantLogic:", err);
        setError("Erro de conexão.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  // CATEGORIAS (O que estava faltando e causava o erro de length)
  const categories = useMemo(() => {
    const cats = ['cardapio'];
    if (restaurant?.menuSections) {
      restaurant.menuSections.forEach(s => cats.push(s.name));
    }
    return cats;
  }, [restaurant]);

  const groupedProducts = useMemo(() => {
    if (!restaurant || !products.length) return [];
    const groups: any[] = [];
    const processedIds = new Set<string>();

    if (restaurant.menuSections) {
        restaurant.menuSections.forEach(section => {
            const items = products.filter(p => p.sectionId === section.id);
            if (items.length > 0) {
                groups.push({ categoryId: section.id, categoryName: section.name, products: items });
                items.forEach(p => processedIds.add(p.id));
            }
        });
    }

    const orphans = products.filter(p => !processedIds.has(p.id));
    if (orphans.length > 0) {
        const orphanGroups: Record<string, Product[]> = {};
        orphans.forEach(p => {
            const cat = p.category || 'Outros';
            if (!orphanGroups[cat]) orphanGroups[cat] = [];
            orphanGroups[cat].push(p);
        });
        Object.entries(orphanGroups).forEach(([name, items]) => {
            groups.push({ categoryId: `cat-${name}`, categoryName: name, products: items });
        });
    }
    return groups;
  }, [restaurant, products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const lower = searchQuery.toLowerCase();
    return products.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        (p.description && p.description.toLowerCase().includes(lower))
    );
  }, [products, searchQuery]);

  return {
    restaurant, products, shopCoupons, isLoading, error,
    groupedProducts, filteredProducts,
    categories, // AGORA ENVIANDO CATEGORIAS
    activeSection, setActiveSection,
    searchQuery, setSearchQuery
  };
};