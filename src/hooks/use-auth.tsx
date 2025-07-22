
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
  type UserCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';
import type { AuthFormValues } from '@/lib/types';
import { FirebaseError } from 'firebase/app';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<UserCredential>;
  signUp: (data: AuthFormValues) => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (data: AuthFormValues) => {
    if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured.");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      return userCredential;
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already in use.');
      }
      throw error;
    }
  }, []);
  
  const signIn = useCallback(async (data: AuthFormValues) => {
    if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured.");
    }
    return signInWithEmailAndPassword(auth, data.email, data.password);
  }, []);


  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    await firebaseSignOut(auth);
  }, []);

  const value: AuthContextType = {
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
