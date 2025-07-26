
'use client';

// This hook is now a stub after removing the login system.
// It provides a default state that indicates no user is logged in
// and loading is complete, allowing the app to render its content directly.

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

interface AuthContextType {
  user: null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextType = {
    user: null,
    loading: false, // Always false as there's no auth check
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
