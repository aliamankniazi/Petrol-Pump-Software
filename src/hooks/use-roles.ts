
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth';
import { useFirestoreCollection } from './use-firestore-collection';

const ROLES_COLLECTION = 'roles';
const USER_ROLES_COLLECTION = 'user-roles';

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

const DEFAULT_ROLES: Omit<Role, 'id'>[] = [
    { name: 'Admin', permissions: [...PERMISSIONS] },
    { name: 'Attendant', permissions: ['view_dashboard', 'view_all_transactions', 'view_customers', 'view_inventory', 'view_purchases', 'view_expenses', 'view_other_incomes'] }
];

interface UserRoleDoc {
  id: string; // Will be user.uid
  roleId: RoleId;
}

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
    
    const { data: roles, addDoc: addRoleDoc, updateDoc: updateRoleDoc, deleteDoc: deleteRoleDoc, loading: rolesLoading } = useFirestoreCollection<Role>(ROLES_COLLECTION);
    const { data: userRoles, addDoc: addUserRoleDoc, loading: userRolesLoading } = useFirestoreCollection<UserRoleDoc>(USER_ROLES_COLLECTION);

    const isReady = !authLoading && !rolesLoading && !userRolesLoading;
    
    // Initialize default roles if the collection is empty
    useEffect(() => {
        if (!rolesLoading && roles.length === 0) {
            DEFAULT_ROLES.forEach(role => {
                const id = role.name.toLowerCase();
                addRoleDoc(role, id);
            });
        }
    }, [roles, rolesLoading, addRoleDoc]);
    
    const currentUserRoleDoc = useMemo(() => user ? userRoles.find(ur => ur.id === user.uid) : null, [user, userRoles]);
    const currentUserRole = useMemo(() => currentUserRoleDoc?.roleId ?? null, [currentUserRoleDoc]);

    const assignRoleToUser = useCallback((userId: string, roleId: RoleId) => {
        addUserRoleDoc({ roleId }, userId);
    }, [addUserRoleDoc]);

    const getRoleForUser = useCallback((userId: string): RoleId | null => {
        return userRoles.find(ur => ur.id === userId)?.roleId ?? null;
    }, [userRoles]);
    
    // Auto-assign role to new users or the first user
    useEffect(() => {
        if (isReady && user) {
            const userHasRole = userRoles.some(ur => ur.id === user.uid);
            if (!userHasRole) {
                const isFirstUser = userRoles.length === 0;
                if (isFirstUser) {
                    assignRoleToUser(user.uid, 'admin');
                } else {
                    assignRoleToUser(user.uid, 'attendant');
                }
            }
        }
    }, [isReady, user, userRoles, assignRoleToUser]);
    
    const addRole = useCallback((role: Omit<Role, 'id'>) => {
        const id = role.name.toLowerCase().replace(/\s+/g, '-');
        addRoleDoc(role, id);
    }, [addRoleDoc]);

    const updateRole = useCallback((id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => {
        updateRoleDoc(id, updatedRole);
    }, [updateRoleDoc]);

    const deleteRole = useCallback((id: RoleId) => {
        if (id === 'admin') return; 
        deleteRoleDoc(id);
    }, [deleteRoleDoc]);

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
