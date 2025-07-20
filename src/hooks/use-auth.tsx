
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
  const [auth, setAuth] = useState<Auth | null>(null);

  const isConfigured = !!firebaseConfig.apiKey;

  useEffect(() => {
    if (isConfigured) {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
      const authInstance = getAuth(app);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        if (currentUser && currentUser.emailVerified) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [isConfigured]);
  
  const signIn = useCallback(async (data: AuthFormValues) => {
    if (!auth) throw new Error("Firebase is not configured.");
    
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    
    if (!userCredential.user.emailVerified) {
      await firebaseSignOut(auth); // Sign out user until they are verified
      throw new Error("Your email has not been verified. Please check your inbox for a verification link.");
    }
    
    // The onAuthStateChanged listener will handle setting the user state.
    return userCredential;
  }, [auth]);

  const signUp = useCallback(async (data: AuthFormValues) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please add your credentials in src/lib/firebase.ts");
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await sendEmailVerification(userCredential.user);
        await firebaseSignOut(auth); // Sign out user immediately after signup to force verification on login.
        return userCredential;
    } catch (error) {
        if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please log in instead.');
        }
        throw error;
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  }, [auth]);

  const value: AuthContextType = {
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
