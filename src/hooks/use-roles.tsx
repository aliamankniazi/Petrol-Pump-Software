
'use client';

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useMemo } from 'react';
import { ref, push, set, update, remove, onValue } from 'firebase/database';
import type { Institution, Role, RoleId, Permission } from '@/lib/types';
import { useAuth } from './use-auth.tsx';
import { db } from '@/lib/firebase-client';
import { useDatabaseCollection } from './use-database-collection';

const INSTITUTIONS_COLLECTION = 'institutions';
const ROLES_COLLECTION = 'roles';
const USER_MAP_COLLECTION = 'userMappings';
const LOCAL_STORAGE_KEY = 'currentInstitutionId';

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
    userInstitutions: Institution[];
    currentInstitution: Institution | null;
    addInstitution: (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>) => Promise<Institution>;
    updateInstitution: (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => Promise<void>;
    deleteInstitution: (id: string) => Promise<void>;
    setCurrentInstitution: (institutionId: string) => void;
    clearCurrentInstitution: () => void;
    roles: Role[];
    userRole: RoleId | null;
    isSuperAdmin: boolean;
    userMappings: UserMapping[];
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
    assignRoleToUser: (userId: string, roleId: RoleId, institutionId: string) => Promise<void>;
    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    const { data: roles, addDoc: addRoleDoc, updateDoc: updateRoleDoc, deleteDoc: deleteRoleDoc, loading: rolesLoading } = useDatabaseCollection<Role>(ROLES_COLLECTION, currentInstitutionId || null);

    useEffect(() => {
        setCurrentInstitutionId(localStorage.getItem(LOCAL_STORAGE_KEY));
    }, []);

    useEffect(() => {
        if (!user || !db) {
            if (!authLoading) setDataLoading(false);
            return;
        }

        const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
        const mappingsRef = ref(db, USER_MAP_COLLECTION);

        const instUnsubscribe = onValue(institutionsRef, (snapshot) => {
            const insts: Institution[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    insts.push({ id: childSnapshot.key!, ...childSnapshot.val() });
                });
            }
            setInstitutions(insts);
        }, () => setDataLoading(false));

        const mapUnsubscribe = onValue(mappingsRef, (snapshot) => {
            const maps: UserMapping[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    maps.push({ id: childSnapshot.key!, ...childSnapshot.val() });
                });
            }
            setUserMappings(maps);
            setDataLoading(false); // Consider loaded after both are fetched
        }, () => setDataLoading(false));

        return () => {
            instUnsubscribe();
            mapUnsubscribe();
        };
    }, [user, authLoading]);

    useEffect(() => {
        if (rolesLoading || !currentInstitutionId || !roles) return;
        const adminRoleExists = roles.some(r => r.id === 'admin');
        if (!adminRoleExists) {
            addRoleDoc({ name: 'Admin', permissions: [...PERMISSIONS] }, 'admin');
        }
    }, [rolesLoading, roles, currentInstitutionId, addRoleDoc]);

    const isReady = !authLoading && !dataLoading;

    const userInstitutions = useMemo(() => {
        if (!user || !isReady) return [];
        const userMaps = userMappings.filter(m => m.userId === user.uid);
        const institutionIds = new Set(userMaps.map(m => m.institutionId));
        return institutions.filter(inst => inst.ownerId === user.uid || institutionIds.has(inst.id));
    }, [user, institutions, userMappings, isReady]);

    const currentInstitution = useMemo(() => {
        return institutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, institutions]);

    const isSuperAdmin = useMemo(() => {
        if (!user || !currentInstitution) return false;
        return user.uid === currentInstitution.ownerId;
    }, [user, currentInstitution]);

    const userRole = useMemo(() => {
        if (isSuperAdmin) return 'admin';
        if (!user || !currentInstitution || !isReady) return null;
        const mapping = userMappings.find(m => m.userId === user.uid && m.institutionId === currentInstitution.id);
        return mapping?.roleId ?? null;
    }, [user, currentInstitution, userMappings, isReady, isSuperAdmin]);

    const setCurrentInstitution = useCallback((institutionId: string) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, institutionId);
        setCurrentInstitutionId(institutionId);
    }, []);

    const clearCurrentInstitution = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setCurrentInstitutionId(null);
    }, []);

    const addInstitution = useCallback(async (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>): Promise<Institution> => {
        if (!user) throw new Error("User must be logged in.");
        const newDocRef = push(ref(db, INSTITUTIONS_COLLECTION));
        const newId = newDocRef.key!;
        const dataWithOwner = { ...institution, ownerId: user.uid, timestamp: Date.now() };
        await set(newDocRef, dataWithOwner);
        return { ...dataWithOwner, id: newId } as Institution;
    }, [user]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
    }, []);

    const deleteInstitution = useCallback(async (id: string) => {
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await remove(docRef);
        if (currentInstitutionId === id) clearCurrentInstitution();
    }, [currentInstitutionId, clearCurrentInstitution]);

    const assignRoleToUser = useCallback(async (userId: string, roleId: RoleId, institutionId: string) => {
        const docId = `${userId}_${institutionId}`;
        const newMapping = { userId, roleId, institutionId };
        const mappingRef = ref(db, `${USER_MAP_COLLECTION}/${docId}`);
        await set(mappingRef, newMapping);
    }, []);

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
        if (!isReady) return false;
        if (isSuperAdmin) return true;
        if (!userRole) return false;
        const role = roles?.find(r => r.id === userRole);
        return !!role?.permissions.includes(permission);
    }, [isReady, userRole, roles, isSuperAdmin]);

    const value: RolesContextType = {
        userInstitutions,
        currentInstitution,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        setCurrentInstitution,
        clearCurrentInstitution,
        roles: roles || [],
        userRole,
        isSuperAdmin,
        userMappings,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
        assignRoleToUser,
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
