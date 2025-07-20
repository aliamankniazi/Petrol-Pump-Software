
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
import { FirebaseError } from 'firebase/app';
import { useSettings } from './use-settings';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<any>;
  signUp: (data: AuthFormValues) => Promise<any>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearAllDataForUser } = useSettings();

  const isConfigured = isFirebaseConfigValid(firebaseConfig);

  useEffect(() => {
    if (!isConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        // Automatically sign out users who haven't verified their email.
        firebaseSignOut(auth);
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);
  
  const signIn = useCallback(async (data: AuthFormValues) => {
    if (!isConfigured || !auth) throw new Error("Firebase is not configured.");
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    if (!userCredential.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error("Your email is not verified. Please check your inbox.");
    }
    return userCredential;
  }, [isConfigured]);

  const signUp = useCallback(async (data: AuthFormValues) => {
    if (!isConfigured || !auth) {
      throw new Error("Firebase is not configured. Please add your credentials in src/lib/firebase.ts");
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await sendEmailVerification(userCredential.user);
        await firebaseSignOut(auth); // Sign out user immediately after signup to force email verification.
        return userCredential;
    } catch (error) {
        if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please log in.');
        }
        throw error;
    }
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    const signedOutUser = auth?.currentUser;
    if (isConfigured && auth && signedOutUser) {
        await firebaseSignOut(auth);
        clearAllDataForUser(signedOutUser.uid);
    }
    setUser(null);
  }, [isConfigured, clearAllDataForUser]);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isConfigured,
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
