
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
  getAuth,
  type Auth,
} from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';
import type { AuthFormValues } from '@/lib/types';
import { FirebaseError } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';

interface AuthContextType {
  user: User | null;
  auth: Auth | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<any>;
  signUp: (data: AuthFormValues) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to initialize Firebase and set up the auth listener.
    if (firebaseConfig.apiKey) {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const authInstance = getAuth(app);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      // Cleanup function for the effect.
      return () => unsubscribe();
    } else {
      console.warn("Firebase config is missing. Authentication is disabled.");
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (data: AuthFormValues) => {
    if (!auth) throw new Error("Firebase is not configured.");
    return signInWithEmailAndPassword(auth, data.email, data.password);
  }, [auth]);

  const signUp = useCallback(async (data: AuthFormValues) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please add your credentials in src/lib/firebase.ts");
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await sendEmailVerification(userCredential.user);
        return userCredential;
    } catch (error) {
        if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please try to log in instead.');
        }
        throw error;
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  }, [auth]);

  const value: AuthContextType = {
    user,
    auth,
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
