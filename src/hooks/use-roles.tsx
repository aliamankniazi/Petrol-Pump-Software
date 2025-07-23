
'use client';

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useMemo, useReducer } from 'react';
import { ref, push, set, serverTimestamp, update, remove, get, onValue } from 'firebase/database';
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
    // Institution related state
    userInstitutions: Institution[];
    currentInstitution: Institution | null;
    addInstitution: (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>) => Promise<Institution>;
    updateInstitution: (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => Promise<void>;
    deleteInstitution: (id: string) => Promise<void>;
    setCurrentInstitution: (institutionId: string) => void;
    clearCurrentInstitution: () => void;

    // Roles related state
    roles: Role[];
    userRole: RoleId | null;
    isSuperAdmin: boolean;
    userMappings: UserMapping[];
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => void;
    deleteRole: (id: RoleId) => void;
    hasPermission: (permission: Permission) => boolean;
    assignRoleToUser: (userId: string, roleId: RoleId, institutionId: string) => Promise<void>;
    
    // Loading states
    loading: boolean;
    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);

    const { data: roles, addDoc: addRoleDoc, updateDoc: updateRoleDoc, deleteDoc: deleteRoleDoc, loading: rolesLoading } = useDatabaseCollection<Role>(ROLES_COLLECTION, currentInstitutionId || null);

    // Get current institution from local storage
    useEffect(() => {
        setCurrentInstitutionId(localStorage.getItem(LOCAL_STORAGE_KEY));
    }, []);

    // Main data fetching effect
    useEffect(() => {
        if (!user) {
            setLoading(false);
            if(isReady) setIsReady(false);
            return;
        }

        setLoading(true);
        const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
        const mappingsRef = ref(db, USER_MAP_COLLECTION);

        const fetchAllData = async () => {
            try {
                const [instSnap, mapSnap] = await Promise.all([
                    get(institutionsRef),
                    get(mappingsRef)
                ]);

                const insts: Institution[] = [];
                if (instSnap.exists()) {
                    const data = instSnap.val();
                    Object.keys(data).forEach(key => insts.push({ id: key, ...data[key] }));
                }
                setInstitutions(insts);

                const maps: UserMapping[] = [];
                if (mapSnap.exists()) {
                    const data = mapSnap.val();
                    Object.keys(data).forEach(key => maps.push({ id: key, ...data[key] }));
                }
                setUserMappings(maps);

            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();

    }, [user, isReady]);
    
    // Effect to initialize default roles
    useEffect(() => {
        if (rolesLoading || !currentInstitutionId || !roles) return;

        const adminRoleExists = roles.some(r => r.id === 'admin');
        const attendantRoleExists = roles.some(r => r.id === 'attendant');

        if (!adminRoleExists) {
            addRoleDoc({ name: 'Admin', permissions: [...PERMISSIONS] }, 'admin');
        }
        if (!attendantRoleExists) {
            addRoleDoc({ name: 'Attendant', permissions: ['view_dashboard', 'view_all_transactions', 'view_customers', 'view_inventory', 'view_purchases', 'view_expenses', 'view_other_incomes'] }, 'attendant');
        }
    }, [rolesLoading, roles, currentInstitutionId, addRoleDoc]);

    // Derived state
    const userInstitutions = useMemo(() => {
        if (!user || loading) return [];
        const userMaps = userMappings.filter(m => m.userId === user.uid);
        const institutionIds = new Set(userMaps.map(m => m.institutionId));
        return institutions.filter(inst => inst.ownerId === user.uid || institutionIds.has(inst.id));
    }, [user, institutions, userMappings, loading]);

    const currentInstitution = useMemo(() => {
        return institutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, institutions]);

    const isSuperAdmin = useMemo(() => {
        if (!user || !currentInstitution) return false;
        return user.uid === currentInstitution.ownerId;
    }, [user, currentInstitution]);

    const userRole = useMemo(() => {
        if (isSuperAdmin) return 'admin';
        if (!user || !currentInstitution || loading) return null;
        const mapping = userMappings.find(m => m.userId === user.uid && m.institutionId === currentInstitution.id);
        return mapping?.roleId ?? null;
    }, [user, currentInstitution, userMappings, loading, isSuperAdmin]);
    
    useEffect(() => {
        const isAppReady = !authLoading && !loading;
        if(isAppReady) {
            setIsReady(true);
        }
    }, [authLoading, loading]);


    // Callbacks
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
        const dataWithOwner = { ...institution, ownerId: user.uid, timestamp: serverTimestamp() };
        await set(newDocRef, dataWithOwner);
        const newInst = { ...dataWithOwner, id: newId, timestamp: Date.now() } as Institution;
        setInstitutions(prev => [...prev, newInst]);
        return newInst;
    }, [user]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
        setInstitutions(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    }, []);

    const deleteInstitution = useCallback(async (id: string) => {
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await remove(docRef);
        setInstitutions(prev => prev.filter(i => i.id !== id));
        if (currentInstitutionId === id) clearCurrentInstitution();
    }, [currentInstitutionId, clearCurrentInstitution]);

    const assignRoleToUser = useCallback(async (userId: string, roleId: RoleId, institutionId: string) => {
        const docId = `${userId}_${institutionId}`;
        const newMapping = { userId, roleId, institutionId };
        const mappingRef = ref(db, `${USER_MAP_COLLECTION}/${docId}`);
        await set(mappingRef, newMapping);
        setUserMappings(prev => [...prev.filter(m => m.id !== docId), { ...newMapping, id: docId }]);
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
        loading,
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
