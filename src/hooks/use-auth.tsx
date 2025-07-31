
'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence, // Use browserLocalPersistence for standard session behavior
  type UserCredential,
  type User,
} from 'firebase/auth';
import { auth as firebaseAuth, isFirebaseConfigured } from '@/lib/firebase-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !firebaseAuth) {
      console.warn("Firebase not configured, auth will not work.");
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured.");
    await setPersistence(firebaseAuth, browserLocalPersistence);
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured.");
    await setPersistence(firebaseAuth, browserLocalPersistence);
    return createUserWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseAuth) return;
    await firebaseSignOut(firebaseAuth);
    // Clear institution on sign out to ensure a clean state for the next user.
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentInstitutionId');
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
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
