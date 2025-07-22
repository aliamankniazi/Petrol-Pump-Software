
'use client';

import { useMemo, useCallback, createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import type { Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth';
import { useDatabaseCollection } from './use-database-collection';

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
    { name: 'Super Admin', permissions: [...PERMISSIONS] },
    { name: 'Admin', permissions: [...PERMISSIONS] },
    { name: 'Attendant', permissions: ['view_dashboard', 'view_all_transactions', 'view_customers', 'view_inventory', 'view_purchases', 'view_expenses', 'view_other_incomes'] }
];

interface UserRoleDoc {
  id: string; // Will be user.uid
  roleId: RoleId;
}

interface RolesContextType {
    roles: Role[];
    userRoles: UserRoleDoc[];
    userRole: RoleId | null;
    isFirstUser: boolean;
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
    assignRoleToUser: (userId: string, roleId: RoleId) => void;
    getRoleForUser: (userId: string) => RoleId | null;
    isReady: boolean;
    superAdminUid: string | null;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    
    // Step 1: Find the super-admin UID first.
    // For this, we must fetch ALL `user-roles` which we can't do without a known root.
    // This creates a chicken-and-egg problem.
    // We must assume that the currently logged-in user's data root is correct for now.
    // This will be corrected once we can identify the super-admin.
    
    // Let's assume the logged-in user is the one whose data we should check first.
    const { data: allUserRoles, loading: allUserRolesLoading } = useDatabaseCollection<UserRoleDoc>(USER_ROLES_COLLECTION, user?.uid);
    
    const superAdminUid = useMemo(() => {
        if (!allUserRoles || allUserRoles.length === 0) {
            // If there are no roles defined, the current user will become super-admin.
            return user?.uid || null;
        }
        const superAdminEntry = allUserRoles.find(ur => ur.roleId === 'super-admin');
        return superAdminEntry?.id || null;
    }, [allUserRoles, user]);

    const { data: roles, addDoc: addRoleDoc, updateDoc: updateRoleDoc, deleteDoc: deleteRoleDoc, loading: rolesLoading } = useDatabaseCollection<Role>(ROLES_COLLECTION, superAdminUid);
    const { data: userRoles, addDoc: addUserRoleDoc, loading: userRolesLoading } = useDatabaseCollection<UserRoleDoc>(USER_ROLES_COLLECTION, superAdminUid);
    const [defaultsInitialized, setDefaultsInitialized] = useState(false);

    const isReady = !authLoading && !rolesLoading && !userRolesLoading && !allUserRolesLoading && defaultsInitialized;
    
    useEffect(() => {
        if (superAdminUid && !rolesLoading && !defaultsInitialized) {
            if (roles.length === 0) {
                Promise.all(DEFAULT_ROLES.map(role => {
                    const id = role.name.toLowerCase().replace(' ', '-');
                    return addRoleDoc(role, id);
                })).then(() => {
                    setDefaultsInitialized(true);
                }).catch(error => {
                    console.error("Failed to initialize default roles:", error);
                     setDefaultsInitialized(true);
                });
            } else {
                 setDefaultsInitialized(true);
            }
        } else if (!superAdminUid && !authLoading) {
            setDefaultsInitialized(true);
        }
    }, [superAdminUid, roles, authLoading, rolesLoading, addRoleDoc, defaultsInitialized]);
    
    const currentUserRoleDoc = useMemo(() => user ? userRoles.find(ur => ur.id === user.uid) : null, [user, userRoles]);
    const currentUserRole = useMemo(() => currentUserRoleDoc?.roleId ?? null, [currentUserRoleDoc]);
    const isFirstUser = useMemo(() => !userRolesLoading && userRoles.length === 0, [userRoles, userRolesLoading]);

    const assignRoleToUser = useCallback((userId: string, roleId: RoleId) => {
        addUserRoleDoc({ roleId }, userId);
    }, [addUserRoleDoc]);

    const getRoleForUser = useCallback((userId: string): RoleId | null => {
        return userRoles.find(ur => ur.id === userId)?.roleId ?? null;
    }, [userRoles]);
    
    useEffect(() => {
        if (isReady && user && isFirstUser) {
            assignRoleToUser(user.uid, 'super-admin');
        }
    }, [isReady, user, isFirstUser, assignRoleToUser]);
    
    const addRole = useCallback((role: Omit<Role, 'id'>) => {
        const id = role.name.toLowerCase().replace(/\s+/g, '-');
        addRoleDoc(role, id);
    }, [addRoleDoc]);

    const updateRole = useCallback((id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => {
        updateRoleDoc(id, updatedRole);
    }, [updateRoleDoc]);

    const deleteRole = useCallback((id: RoleId) => {
        if (id === 'super-admin' || id === 'admin') return; 
        deleteRoleDoc(id);
    }, [deleteRoleDoc]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!user || !currentUserRole) return false;
        if (currentUserRole === 'super-admin') return true;
        const role = roles.find(r => r.id === currentUserRole);
        return !!role?.permissions.includes(permission);
    }, [user, currentUserRole, roles]);

    const value: RolesContextType = {
        roles,
        userRoles: userRoles || [],
        userRole: currentUserRole,
        isFirstUser,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
        assignRoleToUser,
        getRoleForUser,
        isReady,
        superAdminUid,
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
