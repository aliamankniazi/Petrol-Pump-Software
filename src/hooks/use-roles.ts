
'use client';

import { useMemo, useCallback, createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import type { Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution';

const ROLES_COLLECTION = 'roles';
const USER_MAP_COLLECTION = 'userMappings';

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
    'view_settings', 'manage_roles', 'manage_users', 'manage_institutions'
] as const;

export type { Permission };

const DEFAULT_ROLES: Omit<Role, 'id'>[] = [
    { name: 'Admin', permissions: [...PERMISSIONS] },
    { name: 'Attendant', permissions: ['view_dashboard', 'view_all_transactions', 'view_customers', 'view_inventory', 'view_purchases', 'view_expenses', 'view_other_incomes'] }
];

interface UserMapping {
  id: string; // Composite key like `${userId}_${institutionId}`
  userId: string;
  institutionId: string;
  roleId: RoleId;
}

interface RolesContextType {
    roles: Role[];
    userRole: RoleId | null;
    isSuperAdmin: boolean;
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
    assignRoleToUser: (userId: string, roleId: RoleId, institutionId: string) => void;
    getRoleForUserInInstitution: (userId: string, institutionId: string) => RoleId | null;
    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const { currentInstitution, isLoaded: institutionLoaded } = useInstitution();
    
    // Roles are specific to an institution
    const { data: roles, addDoc: addRoleDoc, updateDoc: updateRoleDoc, deleteDoc: deleteRoleDoc, loading: rolesLoading } = useDatabaseCollection<Role>(ROLES_COLLECTION);
    
    // User mappings are global
    const { data: userMappings, addDoc: addUserMappingDoc, loading: userMappingsLoading } = useDatabaseCollection<UserMapping>(USER_MAP_COLLECTION, { allInstitutions: true });

    const [defaultsInitialized, setDefaultsInitialized] = useState(false);

    const isReady = !authLoading && !rolesLoading && !userMappingsLoading && institutionLoaded && defaultsInitialized;
    
    const isSuperAdmin = useMemo(() => {
        if (!user || !currentInstitution) return false;
        return user.uid === currentInstitution.ownerId;
    }, [user, currentInstitution]);

    // Initialize default roles if they don't exist for the current institution
    useEffect(() => {
        if (institutionLoaded && currentInstitution && !rolesLoading && !defaultsInitialized) {
            if (roles.length === 0) {
                Promise.all(DEFAULT_ROLES.map(role => {
                    const id = role.name.toLowerCase().replace(/\s+/g, '-');
                    return addRoleDoc(role, id);
                })).then(() => {
                    setDefaultsInitialized(true);
                });
            } else {
                 setDefaultsInitialized(true);
            }
        } else if (!currentInstitution && institutionLoaded) {
            // No institution selected, so defaults are not applicable yet
            setDefaultsInitialized(true);
        }
    }, [currentInstitution, roles, rolesLoading, institutionLoaded, addRoleDoc, defaultsInitialized]);
    
    const currentUserRole = useMemo(() => {
        if (!user || !currentInstitution || !userMappings) return null;
        const mapping = userMappings.find(m => m.userId === user.uid && m.institutionId === currentInstitution.id);
        return mapping?.roleId ?? null;
    }, [user, currentInstitution, userMappings]);

    const assignRoleToUser = useCallback((userId: string, roleId: RoleId, institutionId: string) => {
        const docId = `${userId}_${institutionId}`;
        addUserMappingDoc({ userId, roleId, institutionId }, docId);
    }, [addUserMappingDoc]);
    
    const getRoleForUserInInstitution = useCallback((userId: string, institutionId: string): RoleId | null => {
        const mapping = userMappings.find(m => m.userId === userId && m.institutionId === institutionId);
        return mapping?.roleId || null;
    }, [userMappings]);

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
        if (isSuperAdmin) return true; // Super admin has all permissions
        const role = roles.find(r => r.id === currentUserRole);
        if (permission === 'manage_institutions') return false; // Only super admin can manage institutions
        return !!role?.permissions.includes(permission);
    }, [user, currentUserRole, roles, isSuperAdmin]);

    const value: RolesContextType = {
        roles,
        userRole: currentUserRole,
        isSuperAdmin,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
        assignRoleToUser,
        getRoleForUserInInstitution,
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
