
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
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';
import type { AuthFormValues } from '@/lib/types';
import { FirebaseError } from 'firebase/app';
import { useToast } from './use-toast';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<any>;
  signUp: (data: AuthFormValues) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (data: AuthFormValues) => {
    if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured. Please add your credentials to src/lib/firebase.ts");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      try {
        await sendEmailVerification(userCredential.user);
      } catch(emailError: any) {
        console.error("Failed to send verification email:", emailError);
        toast({
          variant: "destructive",
          title: "Could Not Send Verification Email",
          description: "Your account was created, but the verification email failed to send. Please try the 'Resend' button on the verification page.",
        });
      }
      return userCredential;
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try to log in instead.');
      }
      throw error;
    }
  }, [toast]);
  
  const signIn = useCallback(async (data: AuthFormValues) => {
    if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured. Please add your credentials to src/lib/firebase.ts");
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
