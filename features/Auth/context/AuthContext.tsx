import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserLocation } from '../../../types';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  createUserWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../../lib/firebase';

type UserRole = 'guest' | 'user' | 'merchant' | 'admin';

// LISTA DE ADMINS DO SISTEMA (Front-end Force)
const ADMIN_EMAILS = ['admin@admin.com', 'descoontai@gmail.com'];

interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>; 
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updatePassword: (currentPass: string, newPass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  savedAddresses: UserLocation[];
  addAddress: (address: UserLocation) => void;
  updateAddress: (index: number, address: UserLocation) => void;
  removeAddress: (index: number) => void;
  setDefaultAddress: (index: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<UserLocation[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      
      if (currentUser) {
        setUser(currentUser);
        const email = currentUser.email || '';
        
        console.log(`[Auth] Verificando acesso para: ${email}`);

        // 1. CHECAGEM SOBERANA DE ADMIN (Ignora Banco de Dados)
        if (ADMIN_EMAILS.includes(email)) {
             console.log('[Auth] Admin detectado por email. Forçando acesso.');
             setUserRole('admin');
             setIsLoading(false);
             
             // Atualiza DB silenciosamente para garantir consistência
             try {
               await setDoc(doc(db, 'users', currentUser.uid), { 
                 role: 'admin', 
                 email: email 
               }, { merge: true });
             } catch(e) { console.warn('Erro ao sync admin role:', e); }
             
             return; // Encerra aqui, não precisa checar mais nada
        }

        // 2. CHECAGEM DE LOJISTA E USUÁRIO
        let isMerchant = false;
        let userData: any = {};
        
        // Tenta ler Merchant
        try {
           const merchantRef = doc(db, 'merchants', currentUser.uid);
           const mSnap = await getDoc(merchantRef);
           if (mSnap.exists()) {
             isMerchant = true;
           }
        } catch (e) {
           console.warn("[Auth] Erro ao ler merchant:", e);
        }

        // Tenta ler User
        try {
           const userRef = doc(db, 'users', currentUser.uid);
           const uSnap = await getDoc(userRef);
           
           if (uSnap.exists()) {
              userData = uSnap.data();
              if (userData.addresses) setSavedAddresses(userData.addresses);
           } else {
              // Cria perfil básico se não existir
              try {
                await setDoc(userRef, {
                    email: email,
                    role: isMerchant ? 'merchant' : 'user',
                    createdAt: new Date().toISOString()
                }, { merge: true });
              } catch (createErr) { console.warn("[Auth] Erro ao criar user:", createErr); }
           }
        } catch (e) {
           console.warn("[Auth] Erro ao ler user:", e);
        }

        // 3. DECISÃO FINAL
        if (isMerchant) {
           console.log('[Auth] Conta identificada como LOJISTA.');
           setUserRole('merchant');
           // Auto-correção se o DB de usuários estiver errado
           if (userData.role !== 'merchant') {
              setDoc(doc(db, 'users', currentUser.uid), { role: 'merchant' }, { merge: true }).catch(()=>{});
           }
        } else {
           console.log('[Auth] Conta identificada como USUÁRIO.');
           setUserRole('user');
        }

      } else {
        setUser(null);
        setUserRole('guest');
        setSavedAddresses([]);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Login requer senha.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const register = async (email: string, password: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
    setSavedAddresses([]);
    setUserRole('guest');
  };

  const updateProfileName = async (name: string) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        setUser({ ...auth.currentUser, displayName: name });
    }
  };

  const updatePassword = async (currentPass: string, newPass: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Usuário não autenticado.");
    const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
    await reauthenticateWithCredential(currentUser, credential);
    await firebaseUpdatePassword(currentUser, newPass);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const saveAddressesToStorage = async (addrs: UserLocation[]) => {
      setSavedAddresses(addrs);
      localStorage.setItem('user_addresses_cache', JSON.stringify(addrs));
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), { addresses: addrs }, { merge: true });
        } catch (e) { console.error("Erro ao salvar endereço:", e); }
      }
  };

  const addAddress = (address: UserLocation) => {
      const existingIndex = savedAddresses.findIndex(a => a.street === address.street && a.number === address.number);
      let newAddrList = [...savedAddresses];
      if (existingIndex >= 0) newAddrList.splice(existingIndex, 1);
      
      if (newAddrList.length === 0 || address.isDefault) {
         newAddrList = newAddrList.map(a => ({ ...a, isDefault: false }));
         address.isDefault = true;
      }
      newAddrList = [address, ...newAddrList];
      saveAddressesToStorage(newAddrList);
  };

  const updateAddress = (index: number, address: UserLocation) => {
      const newAddrList = [...savedAddresses];
      if (index >= 0 && index < newAddrList.length) {
          if (address.isDefault) newAddrList.forEach(a => a.isDefault = false);
          newAddrList[index] = address;
          saveAddressesToStorage(newAddrList);
      }
  };

  const removeAddress = (index: number) => {
      const newAddr = [...savedAddresses];
      newAddr.splice(index, 1);
      saveAddressesToStorage(newAddr);
  };

  const setDefaultAddress = (index: number) => {
      let newAddr = [...savedAddresses];
      newAddr = newAddr.map(a => ({ ...a, isDefault: false }));
      if (newAddr[index]) {
        newAddr[index].isDefault = true;
        const item = newAddr[index];
        newAddr.splice(index, 1);
        newAddr.unshift(item);
      }
      saveAddressesToStorage(newAddr);
  };

  return (
    <AuthContext.Provider value={{ 
        user, userRole, isLoading, login, loginWithGoogle, register, logout,
        updateProfileName, updatePassword, resetPassword, savedAddresses, 
        addAddress, updateAddress, removeAddress, setDefaultAddress
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};