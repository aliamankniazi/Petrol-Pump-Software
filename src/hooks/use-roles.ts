

'use client';

import { useMemo, useCallback, createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import { ref, push, set, serverTimestamp, update, remove, onValue, get } from 'firebase/database';
import type { Role, RoleId, Permission, Institution } from '@/lib/types';
import { useAuth } from './use-auth';
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
type UserMappings = Record<string, UserMappingValue>; // institutionId -> { roleId }

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
    addRole: (role: Omit<Role, 'id'>) => Promise<void>;
    updateRole: (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => Promise<void>;
    deleteRole: (id: RoleId) => Promise<void>;
    assignRoleToUser: (userId: string, roleId: RoleId, institutionId: string) => Promise<void>;
    getRoleForUserInInstitution: (userId: string, institutionId: string) => Promise<RoleId | null>;
    hasPermission: (permission: Permission) => boolean;

    isReady: boolean;
    error: Error | null;
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

    return { roles, loading };
}


export function RolesProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    
    const [userMappings, setUserMappings] = useState<UserMappings | null>(null);
    const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const { roles, loading: rolesLoading } = useRolesForInstitution(currentInstitutionId);
    const [defaultsInitialized, setDefaultsInitialized] = useState(false);

    useEffect(() => {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        if (storedId) {
            setCurrentInstitutionId(storedId);
        }
    }, []);
    
    useEffect(() => {
        // This effect should only run when the user's auth status is definitively known.
        if (authLoading) {
            return;
        }

        // If there is no user, we are done loading. The user should see the login page.
        if (!user) {
            setDataLoading(false);
            setAllInstitutions([]);
            setUserMappings(null);
            return;
        }

        // If there IS a user, start fetching their data.
        setDataLoading(true);
        setError(null);
        
        let unsubInstitutions: () => void;
        let unsubMappings: () => void;
        
        const fetchData = async () => {
            try {
                // Force a token refresh to ensure backend auth state is synchronized.
                // This prevents race conditions on initial login.
                await user.getIdToken(true);

                // Fetch all institutions
                const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
                unsubInstitutions = onValue(institutionsRef, 
                    (snapshot) => {
                        const insts: Institution[] = [];
                        if (snapshot.exists()) {
                            snapshot.forEach(child => insts.push({ id: child.key!, ...child.val() }));
                        }
                        setAllInstitutions(insts);
                    }, 
                    (err) => { throw err; }
                );

                // Fetch the current user's role mappings
                const userMappingsRef = ref(db, `${USER_MAP_COLLECTION}/${user.uid}`);
                unsubMappings = onValue(userMappingsRef, 
                    (snapshot) => {
                        setUserMappings(snapshot.exists() ? snapshot.val() : {});
                    }, 
                    (err) => { throw err; }
                );
            } catch (err: any) {
                console.error("Data fetching error:", err);
                setError(err);
            } finally {
                // This will now correctly be set even if fetching fails.
                setDataLoading(false);
            }
        };

        fetchData();

        return () => {
            if (unsubInstitutions) unsubInstitutions();
            if (unsubMappings) unsubMappings();
        };
    }, [user, authLoading]);

    const userInstitutions = useMemo(() => {
        if (!user || !userMappings) return [];
        const ownedIds = allInstitutions.filter(inst => inst.ownerId === user.uid).map(i => i.id);
        const mappedIds = Object.keys(userMappings);
        const allReachableIds = new Set([...ownedIds, ...mappedIds]);
        return allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, allInstitutions, userMappings]);
    
    // The application is "ready" when both authentication and data loading are complete, and there's no error.
    const isReady = useMemo(() => !authLoading && !dataLoading && !error, [authLoading, dataLoading, error]);

    const currentInstitution = useMemo(() => {
        return userInstitutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, userInstitutions]);

    const isSuperAdmin = useMemo(() => {
        if (!user || !currentInstitution) return false;
        return user.uid === currentInstitution.ownerId;
    }, [user, currentInstitution]);

    const currentUserRole = useMemo(() => {
        if (!user || !currentInstitution || !userMappings) return null;
        if (isSuperAdmin) return 'admin';
        return userMappings?.[currentInstitution.id]?.roleId ?? null;
    }, [user, currentInstitution, userMappings, isSuperAdmin]);
    
    useEffect(() => {
        if (currentInstitution && isSuperAdmin && !rolesLoading && !defaultsInitialized) {
            const adminRoleExists = (roles || []).some(r => r.id === 'admin');
            if (!adminRoleExists) {
                const adminRoleRef = ref(db, `institutions/${currentInstitution.id}/${ROLES_COLLECTION}/admin`);
                set(adminRoleRef, { name: 'Admin', permissions: [...PERMISSIONS] })
                .then(() => setDefaultsInitialized(true))
                .catch(err => console.error("Failed to create admin role:", err));
            } else {
                 setDefaultsInitialized(true);
            }
        } else if (!currentInstitution) {
            setDefaultsInitialized(false);
        }
    }, [currentInstitution, isSuperAdmin, roles, rolesLoading, defaultsInitialized]);
    
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

    const assignRoleToUser = useCallback(async (userId: string, roleId: RoleId, institutionId: string) => {
        if (!db) return;
        const roleRef = ref(db, `${USER_MAP_COLLECTION}/${userId}/${institutionId}`);
        await set(roleRef, { roleId });
    }, []);
    
    const getRoleForUserInInstitution = useCallback(async (userId: string, institutionId: string): Promise<RoleId | null> => {
        if (!db) return null;
        
        const institutionRef = ref(db, `${INSTITUTIONS_COLLECTION}/${institutionId}`);
        const instSnapshot = await get(institutionRef);
        if (instSnapshot.exists() && instSnapshot.val().ownerId === userId) {
            return 'admin';
        }
        
        const mappingRef = ref(db, `${USER_MAP_COLLECTION}/${userId}/${institutionId}`);
        const snapshot = await get(mappingRef);
        if (snapshot.exists()) {
            return snapshot.val().roleId;
        }
        return null;
    }, []);

    const addRole = useCallback(async (role: Omit<Role, 'id'>) => {
        if (!db || !currentInstitutionId) throw new Error("Institution not selected.");
        const id = role.name.toLowerCase().replace(/\s+/g, '-');
        const newRoleRef = ref(db, `institutions/${currentInstitutionId}/${ROLES_COLLECTION}/${id}`);
        await set(newRoleRef, role);
    }, [currentInstitutionId]);

    const updateRole = useCallback(async (id: RoleId, updatedRole: Partial<Omit<Role, 'id'>>) => {
        if (!db || !currentInstitutionId) return;
        const roleRef = ref(db, `institutions/${currentInstitutionId}/${ROLES_COLLECTION}/${id}`);
        await update(roleRef, updatedRole);
    }, [currentInstitutionId]);

    const deleteRole = useCallback(async (id: RoleId) => {
        if (id === 'admin' || !db || !currentInstitutionId) return; 
        const roleRef = ref(db, `institutions/${currentInstitutionId}/${ROLES_COLLECTION}/${id}`);
        await remove(roleRef);
    }, [currentInstitutionId]);

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
        addRole,
        updateRole,
        deleteRole,
        assignRoleToUser,
        getRoleForUserInInstitution,
        hasPermission,
        isReady,
        error,
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
