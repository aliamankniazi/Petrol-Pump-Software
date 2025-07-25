
'use client';

import { useMemo, useCallback, createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import { ref, push, set, serverTimestamp, update, remove, onValue } from 'firebase/database';
import type { Role, RoleId, Permission, Institution } from '@/lib/types';
import { useAuth } from './use-auth.tsx';
import { db } from '@/lib/firebase-client';

const ROLES_COLLECTION = 'roles';
const USER_MAP_COLLECTION = 'userMappings';
const INSTITUTIONS_COLLECTION = 'institutions';
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

interface UserMappingValue {
  roleId: RoleId;
}
type UserMappings = Record<string, UserMappingValue>; // Record<institutionId, { roleId }>

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
    assignRoleToUser: (userId: string, roleId: RoleId, institutionId: string) => Promise<void>;
    getRoleForUserInInstitution: (userId: string, institutionId: string) => RoleId | null;
    hasPermission: (permission: Permission) => boolean;

    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

function useRolesForInstitution(institutionId: string | null) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !institutionId) {
            setRoles([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const rolesRef = ref(db, `institutions/${institutionId}/${ROLES_COLLECTION}`);
        const unsubscribe = onValue(rolesRef, (snapshot) => {
            const rolesArray: Role[] = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    rolesArray.push({ id: childSnapshot.key!, ...childSnapshot.val() });
                });
            }
            setRoles(rolesArray);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching roles:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [institutionId]);

    const addRoleDoc = useCallback(async (role: Omit<Role, 'id'>, id?: RoleId) => {
        if (!db || !institutionId) throw new Error("Institution not selected.");
        const newRef = id ? ref(db, `institutions/${institutionId}/${ROLES_COLLECTION}/${id}`) : push(ref(db, `institutions/${institutionId}/${ROLES_COLLECTION}`));
        await set(newRef, role);
    }, [institutionId]);

    const updateRoleDoc = useCallback(async (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => {
        if (!db || !institutionId) return;
        const roleRef = ref(db, `institutions/${institutionId}/${ROLES_COLLECTION}/${id}`);
        await update(roleRef, updatedRole);
    }, [institutionId]);

    const deleteRoleDoc = useCallback(async (id: RoleId) => {
        if (!db || !institutionId) return;
        const roleRef = ref(db, `institutions/${institutionId}/${ROLES_COLLECTION}/${id}`);
        await remove(roleRef);
    }, [institutionId]);

    return { roles, addRoleDoc, updateRoleDoc, deleteRoleDoc, loading };
}


export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    
    const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
    const [userMappings, setUserMappings] = useState<UserMappings | null>(null);
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);

    const [institutionsLoading, setInstitutionsLoading] = useState(true);
    const [mappingsLoading, setMappingsLoading] = useState(true);
    
    const { roles, addRoleDoc, updateRoleDoc, deleteRoleDoc, loading: rolesLoading } = useRolesForInstitution(currentInstitutionId);
    const [defaultsInitialized, setDefaultsInitialized] = useState(false);

    useEffect(() => {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        if (storedId) {
            setCurrentInstitutionId(storedId);
        }
    }, []);
    
    useEffect(() => {
        if (authLoading || !db) return;

        const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
        const unsub = onValue(institutionsRef, (snapshot) => {
            const insts: Institution[] = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => insts.push({ id: child.key!, ...child.val() }));
            }
            setAllInstitutions(insts);
            setInstitutionsLoading(false);
        }, (error) => {
            console.error("Error loading institutions:", error);
            setInstitutionsLoading(false);
        });
        return () => unsub();
    }, [authLoading]);

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            setUserMappings(null);
            setMappingsLoading(false);
            return;
        }

        const userMappingsRef = ref(db, `${USER_MAP_COLLECTION}/${user.uid}`);
        const unsub = onValue(userMappingsRef, (snapshot) => {
            setUserMappings(snapshot.exists() ? snapshot.val() : {});
            setMappingsLoading(false);
        }, (error) => {
            console.error("Error loading user mappings:", error);
            setUserMappings({});
            setMappingsLoading(false);
        });

        return () => unsub();
    }, [user, authLoading]);

    const isReady = !institutionsLoading && !mappingsLoading;

    const userInstitutions = useMemo(() => {
        if (!user || !isReady) return [];
        const ownedIds = allInstitutions.filter(inst => inst.ownerId === user.uid).map(i => i.id);
        const mappedIds = userMappings ? Object.keys(userMappings) : [];
        const allReachableIds = new Set([...ownedIds, ...mappedIds]);
        return allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, isReady, allInstitutions, userMappings]);

    const currentInstitution = useMemo(() => {
        return allInstitutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, allInstitutions]);

    const isSuperAdmin = useMemo(() => {
        if (!user || !currentInstitution) return false;
        return user.uid === currentInstitution.ownerId;
    }, [user, currentInstitution]);

    const currentUserRole = useMemo(() => {
        if (!user || !currentInstitution || mappingsLoading) return null;
        if (isSuperAdmin) return 'admin';
        return userMappings?.[currentInstitution.id]?.roleId ?? null;
    }, [user, currentInstitution, userMappings, mappingsLoading, isSuperAdmin]);

    const assignRoleToUser = useCallback(async (userId: string, roleId: RoleId, institutionId: string) => {
        if (!db) return;
        const roleRef = ref(db, `${USER_MAP_COLLECTION}/${userId}/${institutionId}`);
        await set(roleRef, { roleId });
    }, []);

    const getRoleForUserInInstitution = useCallback((userId: string, institutionId: string): RoleId | null => {
        const institution = allInstitutions.find(i => i.id === institutionId);
        if (institution?.ownerId === userId) return 'admin';
        
        // This is a placeholder as we don't fetch all mappings. For the current user, it's correct.
        if (userId === user?.uid && userMappings && userMappings[institutionId]) {
            return userMappings[institutionId].roleId;
        }
        
        return null;
    }, [user?.uid, userMappings, allInstitutions]);
    
    useEffect(() => {
        if (currentInstitution && !rolesLoading && !defaultsInitialized) {
            const adminRoleExists = (roles || []).some(r => r.id === 'admin');
            if (!adminRoleExists) {
                addRoleDoc({ name: 'Admin', permissions: [...PERMISSIONS] }, 'admin').finally(() => {
                    setDefaultsInitialized(true);
                });
            } else {
                 setDefaultsInitialized(true);
            }
        } else if (!currentInstitution) {
            setDefaultsInitialized(false);
        }
    }, [currentInstitution, roles, rolesLoading, addRoleDoc, defaultsInitialized]);
    
    const setCurrentInstitutionCB = useCallback((institutionId: string) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, institutionId);
        setCurrentInstitutionId(institutionId);
    }, []);

    const clearCurrentInstitutionCB = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setCurrentInstitutionId(null);
    }, []);
    
    const addInstitution = useCallback(async (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>): Promise<Institution> => {
        if (!user) throw new Error("User must be logged in to create an institution.");
        if (!db) throw new Error("Database not initialized");

        const newDocRef = push(ref(db, INSTITUTIONS_COLLECTION));
        const newId = newDocRef.key;
        if (!newId) throw new Error("Failed to create new institution ID.");
        
        const dataWithOwner = { ...institution, ownerId: user.uid, timestamp: serverTimestamp() };
        await set(newDocRef, dataWithOwner);
        const newInstitution = { ...dataWithOwner, id: newId, timestamp: Date.now() } as Institution;
        
        setCurrentInstitutionCB(newId);
        return newInstitution;
    }, [user, setCurrentInstitutionCB]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
    }, []);

    const deleteInstitution = useCallback(async (id: string) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await remove(docRef);
        if (currentInstitutionId === id) {
            clearCurrentInstitutionCB();
        }
    }, [currentInstitutionId, clearCurrentInstitutionCB]);

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
        if (!user || !currentInstitution) return false;
        if (isSuperAdmin) return true;
        if (!currentUserRole) return false;
        const role = (roles || [])?.find(r => r.id === currentUserRole);
        return !!role?.permissions.includes(permission);
    }, [user, currentInstitution, currentUserRole, roles, isSuperAdmin]);

    const value: RolesContextType = {
        userInstitutions,
        currentInstitution,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        setCurrentInstitution: setCurrentInstitutionCB,
        clearCurrentInstitution: clearCurrentInstitutionCB,
        roles: roles || [],
        userRole: currentUserRole,
        isSuperAdmin,
        assignRoleToUser,
        getRoleForUserInInstitution,
        hasPermission,
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
