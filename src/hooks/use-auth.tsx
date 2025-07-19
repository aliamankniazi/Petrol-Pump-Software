'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  type User,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, isFirebaseConfigValid, firebaseConfig } from '@/lib/firebase';
import type { AuthFormValues } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<any>;
  signUp: (data: AuthFormValues) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USER = { uid: 'offline-user', email: 'demo@example.com' } as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConfigValid]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isAuthPage) {
        router.push('/login');
    } else if (user && isAuthPage) {
        router.push('/');
    }
  }, [user, loading, pathname, router]);

  const signIn = (data: AuthFormValues) => {
    if (!auth) return Promise.reject(new Error("Firebase is not configured."));
    return signInWithEmailAndPassword(auth, data.email, data.password);
  };

  const signUp = (data: AuthFormValues) => {
    if (!auth) return Promise.reject(new Error("Firebase is not configured."));
    return createUserWithEmailAndPassword(auth, data.email, data.password);
  };

  const signOut = async () => {
    if (isConfigValid && auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
  
  if (loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (user && isAuthPage) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <p>Redirecting...</p>
          </div>
      );
  }

  if (!user && !isAuthPage) {
      return (
           <div className="flex h-screen w-full items-center justify-center">
              <p>Redirecting...</p>
          </div>
      );
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
