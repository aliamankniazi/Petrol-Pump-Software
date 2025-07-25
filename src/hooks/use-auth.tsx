
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
  setPersistence,
  browserSessionPersistence,
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
    if (!isFirebaseConfigured() || !auth) {
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

  const signUp = useCallback(async (data: AuthFormValues): Promise<UserCredential> => {
    if (!isFirebaseConfigured() || !auth) {
        throw new Error("Firebase is not configured.");
    }
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      return userCredential;
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          throw new Error('This email is already in use by another account.');
        }
        if (error.code === 'auth/weak-password') {
          throw new Error('The password is too weak. It must be at least 6 characters long.');
        }
        // Provide a more generic message for other auth errors during signup
        throw new Error('Could not create account. Please check the details and try again.');
      }
      throw error;
    }
  }, []);
  
  const signIn = useCallback(async (data: AuthFormValues) => {
    if (!isFirebaseConfigured() || !auth) {
        throw new Error("Firebase is not configured.");
    }
    try {
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        return userCredential;
    } catch (error) {
        if (error instanceof FirebaseError) {
            // "auth/invalid-credential" is the modern error code for both user-not-found and wrong-password.
            if (error.code === 'auth/invalid-credential') {
                throw new Error('Invalid email or password. Please try again.');
            }
            // Provide a more generic message for other auth errors during sign-in
            throw new Error('Could not sign in. Please try again later.');
        }
        throw error;
    }
  }, []);


  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured() || !auth) return;
    try {
        await firebaseSignOut(auth);
        localStorage.removeItem('currentInstitutionId');
    } catch (error) {
        console.error("Error signing out: ", error);
    }
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
