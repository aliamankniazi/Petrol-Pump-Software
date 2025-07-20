
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth';
import { AppLayout } from '@/components/app-layout';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const STORAGE_KEY = 'pumppal-roles';
const USER_ROLE_STORAGE_KEY = 'pumppal-user-role';

export const PERMISSIONS = [
    'view_dashboard', 'view_all_transactions', 'delete_transaction',
    'view_customers', 'add_customer', 'edit_customer', 'delete_customer',
    'view_partner_ledger', 'view_credit_recovery',
    'view_cash_advances', 'add_cash_advance', 'delete_cash_advance',
    'view_inventory', 'view_purchases', 'add_purchase', 'delete_purchase',
    'view_purchase_returns', 'add_purchase_return', 'delete_purchase_return',
    'view_tank_readings', 'add_tank_reading',
    'view_supplier_payments', 'add_supplier_payment', 'delete_supplier_payment',
    'view_investments', 'add_investment', 'delete_investment',
    'view_expenses', 'add_expense', 'delete_expense',
    'view_other_incomes', 'add_other_income', 'delete_other_income',
    'view_ledger', 'view_summary', 'generate_ai_summary',
    'manage_employees', 'manage_banks',
    'view_settings', 'manage_roles', 'manage_users'
] as const;

export type { Permission };

const DEFAULT_ROLES: Role[] = [
    {
        id: 'admin',
        name: 'Admin',
        permissions: [...PERMISSIONS],
    },
    {
        id: 'attendant',
        name: 'Attendant',
        permissions: ['view_dashboard'],
    }
];

interface RolesContextType {
    roles: Role[];
    userRole: RoleId | null;
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
    assignRoleToUser: (userId: string, roleId: RoleId) => void;
    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

const FullscreenLoader = () => (
    <div className="flex h-screen w-full items-center justify-center">
       <div className="space-y-4 w-1/2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
       </div>
   </div>
);


export function RolesProvider({ children }: { children: ReactNode }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [userRoles, setUserRoles] = useState<Record<string, RoleId>>({});
    const [isRolesLoaded, setIsRolesLoaded] = useState(false);
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    const currentUserRole = user ? userRoles[user.uid] : null;

    const loadData = useCallback(() => {
        try {
            const storedRoles = localStorage.getItem(STORAGE_KEY);
            setRoles(storedRoles ? JSON.parse(storedRoles) : DEFAULT_ROLES);

            const allUserRoles: Record<string, RoleId> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(USER_ROLE_STORAGE_KEY)) {
                    const userId = key.substring(key.indexOf(':') + 1);
                    allUserRoles[userId] = localStorage.getItem(key) as RoleId;
                }
            }
            setUserRoles(allUserRoles);
        } catch (error) {
            console.error("Failed to parse roles from localStorage", error);
            setRoles(DEFAULT_ROLES);
        } finally {
            setIsRolesLoaded(true);
        }
    }, []);
    
    useEffect(() => {
        loadData();
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === STORAGE_KEY || e.key?.startsWith(USER_ROLE_STORAGE_KEY)) {
            loadData();
          }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadData]);


    useEffect(() => {
        if (isRolesLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
            } catch (error) {
                console.error("Failed to save roles to localStorage", error);
            }
        }
    }, [roles, isRolesLoaded]);

    const assignRoleToUser = useCallback((userId: string, roleId: RoleId) => {
        setUserRoles(prev => ({...prev, [userId]: roleId}));
        localStorage.setItem(`${USER_ROLE_STORAGE_KEY}:${userId}`, roleId);
    }, []);
    
    // Auto-assign 'admin' role to the very first user
    useEffect(() => {
        if (!authLoading && user && isRolesLoaded && Object.keys(userRoles).length === 0) {
            assignRoleToUser(user.uid, 'admin');
        }
    }, [authLoading, user, isRolesLoaded, userRoles, assignRoleToUser]);
    
    useEffect(() => {
        if (authLoading || !isRolesLoaded) return;

        if (user) {
            if (isAuthPage) {
                router.replace('/');
            }
        } else {
            if (!isAuthPage) {
                router.replace('/login');
            }
        }
    }, [user, authLoading, isRolesLoaded, pathname, router, isAuthPage]);


    const addRole = useCallback((role: Omit<Role, 'id'>) => {
        setRoles(prev => [...prev, { ...role, id: crypto.randomUUID() }]);
    }, []);

    const updateRole = useCallback((id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => {
        setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updatedRole, id: r.id } as Role : r));
    }, []);

    const deleteRole = useCallback((id: RoleId) => {
        if (id === 'admin') return; 
        setRoles(prev => prev.filter(r => r.id !== id));
    }, []);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!currentUserRole) return false;
        const role = roles.find(r => r.id === currentUserRole);
        return !!role?.permissions.includes(permission);
    }, [currentUserRole, roles]);

    const value: RolesContextType = {
        roles,
        userRole: currentUserRole,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
        assignRoleToUser,
        isReady: !authLoading && isRolesLoaded
    };
    
    if (!value.isReady) {
       return <FullscreenLoader />;
    }

    if (!user) {
        return isAuthPage ? (
            <RolesContext.Provider value={value}>
                {children}
            </RolesContext.Provider>
        ) : <FullscreenLoader />;
    }

    return (
        <RolesContext.Provider value={value}>
            <AppLayout hasPermission={hasPermission}>{children}</AppLayout>
        </RolesContext.Provider>
    );
}

export const useRoles = () => {
    const context = useContext(RolesContext);
    if (context === undefined) {
        throw new Error('useRoles must be used within a RolesProvider');
    }
    return context;
};
