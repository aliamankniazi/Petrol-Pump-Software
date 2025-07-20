
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth';

const ROLES_STORAGE_KEY = 'roles';
const USER_ROLE_STORAGE_KEY_PREFIX = 'user-role';

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
    'view_ledger', 'view_summary', 'generate_ai_summary', 'view_reports',
    'manage_employees', 'manage_banks',
    'view_settings', 'manage_roles', 'manage_users'
] as const;

export type { Permission };

const DEFAULT_ROLES: Role[] = [
    { id: 'admin', name: 'Admin', permissions: [...PERMISSIONS] },
    { id: 'attendant', name: 'Attendant', permissions: ['view_dashboard', 'view_all_transactions', 'view_customers', 'view_inventory', 'view_purchases', 'view_expenses', 'view_other_incomes'] }
];

interface RolesContextType {
    roles: Role[];
    userRole: RoleId | null;
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
    assignRoleToUser: (userId: string, roleId: RoleId) => void;
    getRoleForUser: (userId: string) => RoleId | null;
    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    
    const [roles, setRoles] = useState<Role[]>([]);
    const [isRolesLoaded, setIsRolesLoaded] = useState(false);

    const [userRoles, setUserRoles] = useState<Record<string, RoleId>>({});
    const [isUserRolesLoaded, setIsUserRolesLoaded] = useState(false);
    
    const currentUserRole = user ? userRoles[user.uid] : null;

    useEffect(() => {
        try {
            const stored = localStorage.getItem(ROLES_STORAGE_KEY);
            setRoles(stored ? JSON.parse(stored) : DEFAULT_ROLES);
        } catch (e) {
            setRoles(DEFAULT_ROLES);
        } finally {
            setIsRolesLoaded(true);
        }
    }, []);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(USER_ROLE_STORAGE_KEY_PREFIX);
            setUserRoles(stored ? JSON.parse(stored) : {});
        } catch (e) {
            setUserRoles({});
        } finally {
            setIsUserRolesLoaded(true);
        }
    }, []);

    useEffect(() => {
      if (isRolesLoaded) {
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
      }
    }, [roles, isRolesLoaded]);

    useEffect(() => {
      if (isUserRolesLoaded) {
        localStorage.setItem(USER_ROLE_STORAGE_KEY_PREFIX, JSON.stringify(userRoles));
      }
    }, [userRoles, isUserRolesLoaded]);

    const assignRoleToUser = useCallback((userId: string, roleId: RoleId) => {
        setUserRoles(prev => ({...prev, [userId]: roleId}));
    }, []);

    const getRoleForUser = useCallback((userId: string) => {
        return userRoles[userId] || null;
    }, [userRoles]);
    
    useEffect(() => {
        if (!authLoading && user && isUserRolesLoaded && roles.length > 0) {
            const userHasRole = user.uid in userRoles;
            if (!userHasRole) {
                const isFirstUser = Object.keys(userRoles).length === 0;
                if (isFirstUser) {
                    assignRoleToUser(user.uid, 'admin');
                } else {
                    const defaultRole = roles.find(r => r.name.toLowerCase() === 'attendant') || roles[0];
                    assignRoleToUser(user.uid, defaultRole.id);
                }
            }
        }
    }, [authLoading, user, isUserRolesLoaded, userRoles, roles, assignRoleToUser]);
    
    const isReady = !authLoading && isRolesLoaded && isUserRolesLoaded;

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
        if (!user || !currentUserRole) return false;
        const role = roles.find(r => r.id === currentUserRole);
        return !!role?.permissions.includes(permission);
    }, [user, currentUserRole, roles]);

    const value: RolesContextType = {
        roles,
        userRole: currentUserRole,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
        assignRoleToUser,
        getRoleForUser,
        isReady,
    };
    
    return (
        <RolesContext.Provider value={value}>
            {children}
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
