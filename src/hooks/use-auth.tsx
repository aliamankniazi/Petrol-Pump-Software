
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
  sendEmailVerification,
} from 'firebase/auth';
import { auth, isFirebaseConfigValid, firebaseConfig } from '@/lib/firebase';
import type { AuthFormValues, RoleId } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { RolesProvider } from './use-roles.tsx';

const USER_ROLE_STORAGE_KEY = 'pumppal-user-role';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<any>;
  signUp: (data: AuthFormValues) => Promise<any>;
  signOut: () => Promise<void>;
  userRole: RoleId | null;
  assignRoleToUser: (userId: string, roleId: RoleId) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USER = { uid: 'offline-user', email: 'demo@example.com', emailVerified: true } as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<RoleId | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isConfigValid = isFirebaseConfigValid(firebaseConfig);
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (user) {
      const storedRole = localStorage.getItem(`${USER_ROLE_STORAGE_KEY}:${user.uid}`);
      setUserRole(storedRole as RoleId || 'admin');
    } else {
      setUserRole(null);
    }
  }, [user]);

  const assignRoleToUser = (userId: string, roleId: RoleId) => {
    try {
      localStorage.setItem(`${USER_ROLE_STORAGE_KEY}:${userId}`, roleId);
      if (user && user.uid === userId) {
        setUserRole(roleId);
      }
    } catch (error) {
      console.error("Failed to save user role to localStorage", error);
    }
  };

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
      if (currentUser && !currentUser.emailVerified) {
        setUser(null); // Treat unverified user as logged out
      } else {
        setUser(currentUser);
      }
      
      if (currentUser && !localStorage.getItem(`${USER_ROLE_STORAGE_KEY}:${currentUser.uid}`)) {
        const allUserRoles = Object.keys(localStorage).filter(key => key.startsWith(USER_ROLE_STORAGE_KEY));
        if (allUserRoles.length === 0) {
            assignRoleToUser(currentUser.uid, 'admin');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConfigValid]);
  
  useEffect(() => {
    if (loading) return;

    if (!user && !isAuthPage) {
        router.push('/login');
    }
    if (user && isAuthPage) {
        router.push('/');
    }
  }, [user, loading, pathname, router, isAuthPage]);

  const signIn = async (data: AuthFormValues) => {
    if (!isConfigValid || !auth) throw new Error("Firebase is not configured.");
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    if (!userCredential.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error("Your email is not verified. Please check your inbox.");
    }
    return userCredential;
  };

  const signUp = async (data: AuthFormValues) => {
    if (!isConfigValid || !auth) throw new Error("Firebase is not configured.");
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await sendEmailVerification(userCredential.user);
    // Sign the user out immediately after sending the verification email
    await firebaseSignOut(auth);
    return userCredential;
  };

  const signOut = async () => {
    if (isConfigValid && auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    userRole,
    assignRoleToUser,
  };
  
  if (loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }
  
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
