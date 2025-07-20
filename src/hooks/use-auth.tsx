
'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  type User,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, isFirebaseConfigValid, firebaseConfig } from '@/lib/firebase';
import type { AuthFormValues } from '@/lib/types';
import { useSettings } from './use-settings';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<any>;
  signUp: (data: AuthFormValues) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USER = { uid: 'offline-user', email: 'demo@example.com', emailVerified: true } as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isConfigValid = isFirebaseConfigValid(firebaseConfig);

  useEffect(() => {
    if (!isConfigValid) {
      setUser(FAKE_USER);
      setLoading(false);
      return;
    }
    
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConfigValid]);
  
  const signIn = useCallback(async (data: AuthFormValues) => {
    if (!isConfigValid || !auth) throw new Error("Firebase is not configured.");
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    if (!userCredential.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error("Your email is not verified. Please check your inbox.");
    }
    return userCredential;
  }, [isConfigValid]);

  const signUp = useCallback(async (data: AuthFormValues) => {
    if (!isFirebaseConfigValid(firebaseConfig) || !auth) {
      throw new Error("Firebase is not configured. Please add your credentials in src/lib/firebase.ts");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await sendEmailVerification(userCredential.user);
    await firebaseSignOut(auth);
    return userCredential;
  }, [isConfigValid]);

  const signOut = useCallback(async () => {
    if (isConfigValid && auth) {
        // We get the user from auth directly here, because the state update might not be immediate.
        const currentUser = auth.currentUser;
        if(currentUser){
            const hookKeys = [
                'transactions', 'purchases', 'purchase-returns', 'expenses',
                'customers', 'suppliers', 'bank-accounts', 'employees',
                'fuel-prices', 'manual-fuel-stock', 'initial-fuel-stock',
                'customer-payments', 'cash-advances', 'other-incomes', 'tank-readings',
                'supplier-payments', 'investments', 'business-partners'
            ];
            hookKeys.forEach(key => {
                const userScopedKey = `pumppal-${currentUser.uid}-${key}`;
                localStorage.removeItem(userScopedKey);
            });
        }
        await firebaseSignOut(auth);
    }
    setUser(null);
  }, [isConfigValid]);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
  
  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
