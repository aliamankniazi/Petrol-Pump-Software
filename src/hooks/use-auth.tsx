
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
      setLoading(false);
      return;
    }
    
    // Set persistence once when the app loads
    setPersistence(firebaseAuth, browserLocalPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          setUser(user);
          setLoading(false);
        });
        // Return the unsubscribe function to be called on cleanup
        return unsubscribe;
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
        setLoading(false);
      });

  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured.");
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured.");
    return createUserWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseAuth) return;
    await firebaseSignOut(firebaseAuth);
    // Ensure local storage for institution is cleared on sign out
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
