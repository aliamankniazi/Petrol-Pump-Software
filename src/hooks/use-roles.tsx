

'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'pumppal-roles';

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
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Role) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user, userRole } = useAuth(); // Now this hook can be called safely.
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup';


    const loadData = useCallback(() => {
        try {
            const storedItems = localStorage.getItem(STORAGE_KEY);
            if (storedItems) {
                setRoles(JSON.parse(storedItems));
            } else {
                setRoles(DEFAULT_ROLES);
            }
        } catch (error) {
            console.error("Failed to parse roles from localStorage", error);
            setRoles(DEFAULT_ROLES);
        } finally {
            setIsLoaded(true);
        }
    }, []);
    
    useEffect(() => {
        loadData();

        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === STORAGE_KEY) {
            loadData();
          }
        };
    
        window.addEventListener('storage', handleStorageChange);
        return () => {
          window.removeEventListener('storage', handleStorageChange);
        };
    }, [loadData]);


    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
            } catch (error) {
                console.error("Failed to save roles to localStorage", error);
            }
        }
    }, [roles, isLoaded]);

    const addRole = useCallback((role: Omit<Role, 'id'>) => {
        setRoles(prev => [...prev, { ...role, id: crypto.randomUUID() }]);
    }, []);

    const updateRole = useCallback((id: RoleId, updatedRole: Role) => {
        setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updatedRole } : r));
    }, []);

    const deleteRole = useCallback((id: RoleId) => {
        if (id === 'admin') return; // Prevent deleting admin role
        setRoles(prev => prev.filter(r => r.id !== id));
    }, []);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!userRole) return false;
        const role = roles.find(r => r.id === userRole);
        if (!role) return false;
        return role.permissions.includes(permission);
    }, [userRole, roles]);

    const value = {
        roles,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
    };
    
    // The RolesProvider now decides whether to render the main app layout or the auth pages.
    return (
        <RolesContext.Provider value={value}>
            {user && !isAuthPage ? <AppLayout hasPermission={hasPermission}>{children}</AppLayout> : children}
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
