
'use client';

import { useMemo, useCallback, createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '@/lib/firebase-client';
import type { Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth.tsx';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution.tsx';

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
    userMappings: UserMapping[];
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
    assignRoleToUser: (userId: string, roleId: RoleId, institutionId: string) => Promise<void>;
    getRoleForUserInInstitution: (userId: string, institutionId: string) => RoleId | null;
    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const { currentInstitution, institutionDataLoaded } = useInstitution();
    
    // This hook now correctly waits for `currentInstitution.id` to be available.
    const { data: roles, addDoc: addRoleDoc, updateDoc: updateRoleDoc, deleteDoc: deleteRoleDoc, loading: rolesLoading } = useDatabaseCollection<Role>(ROLES_COLLECTION, currentInstitution?.id || null);
    
    const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
    const [userMappingsLoading, setUserMappingsLoading] = useState(true);
    const [defaultsInitialized, setDefaultsInitialized] = useState(false);

    // Fetch all user mappings once.
    useEffect(() => {
        if (authLoading || !db) {
            return;
        }
        setUserMappingsLoading(true);
        const mappingsRef = ref(db, USER_MAP_COLLECTION);
        get(mappingsRef).then(snapshot => {
            const mappingsArray: UserMapping[] = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => mappingsArray.push({ id: key, ...data[key] }));
            }
            setUserMappings(mappingsArray);
        }).catch(error => {
            console.error("Error fetching user mappings:", error);
        }).finally(() => {
            setUserMappingsLoading(false);
        });
    }, [authLoading]);

    // Effect to initialize default roles for the current institution if they don't exist.
    useEffect(() => {
        if (!currentInstitution || rolesLoading || defaultsInitialized) {
            return;
        }
        
        const adminRoleExists = roles.some(r => r.id === 'admin');
        const attendantRoleExists = roles.some(r => r.id === 'attendant');

        if (adminRoleExists && attendantRoleExists) {
            setDefaultsInitialized(true);
            return;
        }

        const setupDefaults = async () => {
            try {
                if (!adminRoleExists) {
                    await addRoleDoc({ name: 'Admin', permissions: [...PERMISSIONS] }, 'admin');
                }
                if (!attendantRoleExists) {
                    await addRoleDoc({ name: 'Attendant', permissions: ['view_dashboard', 'view_all_transactions', 'view_customers', 'view_inventory', 'view_purchases', 'view_expenses', 'view_other_incomes'] }, 'attendant');
                }
            } catch (error) {
                console.error("Failed to initialize default roles:", error);
            } finally {
                // The onValue listener in useDatabaseCollection will update roles,
                // which will cause this effect to re-run and eventually set initialized to true.
            }
        };

        if (roles.length > 0) { // If some roles exist but not all defaults
             if (!adminRoleExists || !attendantRoleExists) {
                setupDefaults();
             } else {
                 setDefaultsInitialized(true);
             }
        } else if (roles.length === 0) { // If no roles exist at all
            setupDefaults();
        }

    }, [currentInstitution, roles, rolesLoading, addRoleDoc, defaultsInitialized]);
    
    const isReady = !authLoading && institutionDataLoaded && !!currentInstitution && !rolesLoading && !userMappingsLoading && defaultsInitialized;
    
    const isSuperAdmin = useMemo(() => {
        if (!user || !currentInstitution) return false;
        // The owner of the institution is the super admin.
        return user.uid === currentInstitution.ownerId;
    }, [user, currentInstitution]);

    const currentUserRole = useMemo(() => {
        if (!user || !currentInstitution || userMappingsLoading) return null;
        if (isSuperAdmin) return 'admin'; 
        const mapping = userMappings.find(m => m.userId === user.uid && m.institutionId === currentInstitution.id);
        return mapping?.roleId ?? null;
    }, [user, currentInstitution, userMappings, userMappingsLoading, isSuperAdmin]);

    const assignRoleToUser = useCallback(async (userId: string, roleId: RoleId, institutionId: string) => {
        if (!db) return;
        const docId = `${userId}_${institutionId}`;
        const newMapping = { userId, roleId, institutionId };
        const mappingRef = ref(db, `${USER_MAP_COLLECTION}/${docId}`);
        await set(mappingRef, newMapping);
        // Refresh local state after assigning role
        setUserMappings(prev => [...prev.filter(m => m.id !== docId), { ...newMapping, id: docId }]);
    }, []);
    
    const getRoleForUserInInstitution = useCallback((userId: string, institutionId: string): RoleId | null => {
        if (!userMappings) return null;
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
        if (!isReady || !user || !currentInstitution) return false;
        if (isSuperAdmin) return true;
        if (!currentUserRole) return false;
        const role = roles?.find(r => r.id === currentUserRole);
        return !!role?.permissions.includes(permission);
    }, [isReady, user, currentInstitution, currentUserRole, roles, isSuperAdmin]);

    const value: RolesContextType = {
        roles: roles || [],
        userRole: currentUserRole,
        isSuperAdmin,
        userMappings,
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
