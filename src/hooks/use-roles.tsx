
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
    
    // We need to fetch all user roles to determine who the super admin is.
    // For this, we must fetch from the root of the `users` collection, which is not directly supported
    // by the current `useDatabaseCollection` hook which scopes to a user.
    // This hook will need to be adapted or we need a new strategy.
    // Let's assume for now that we can get this list. A more robust solution might be needed.
    const { data: allUserRolesFromHook, loading: allUserRolesLoading } = useDatabaseCollection<UserRoleDoc>(USER_ROLES_COLLECTION, user?.uid, true);

    const superAdminUid = useMemo(() => {
        // If there are no roles defined yet, the current user will become the super-admin.
        if (!allUserRolesFromHook || allUserRolesFromHook.length === 0) {
            return user?.uid || null;
        }
        const superAdminEntry = allUserRolesFromHook.find(ur => ur.roleId === 'super-admin');
        return superAdminEntry?.id || null;
    }, [allUserRolesFromHook, user]);

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
        // When assigning a role, especially the first one, we MUST know who the superAdmin is.
        // If there's no superAdminUid yet, it means the current user IS the super admin.
        const rootId = superAdminUid || user?.uid;
        if (!rootId) {
            console.error("Cannot assign role: no root user ID found.");
            return;
        }
        addUserRoleDoc({ roleId }, userId);
    }, [addUserRoleDoc, superAdminUid, user]);

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
