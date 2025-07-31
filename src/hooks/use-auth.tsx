
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
  inMemoryPersistence,
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
      setLoading(false);
      return;
    }
    
    setPersistence(firebaseAuth, inMemoryPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          setUser(user);
          setLoading(false);
        });
        return unsubscribe;
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
        setLoading(false);
      });

  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured.");
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await userCredential.user.getIdToken(true);
    return userCredential;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured.");
    return await createUserWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseAuth) return;
    await firebaseSignOut(firebaseAuth);
    localStorage.removeItem('currentInstitutionId');
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
