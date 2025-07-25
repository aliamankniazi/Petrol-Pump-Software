
'use client';

import { useMemo, useCallback, createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import { ref, push, set, serverTimestamp, update, remove, onValue } from 'firebase/database';
import type { Role, RoleId, Permission, Institution } from '@/lib/types';
import { useAuth } from './use-auth.tsx';
import { useDatabaseCollection } from './use-database-collection';
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

interface UserMapping {
  id: string; // Composite key like `${userId}_${institutionId}`
  userId: string;
  institutionId: string;
  roleId: RoleId;
}

interface RolesContextType {
    // Institution properties
    userInstitutions: Institution[];
    currentInstitution: Institution | null;
    addInstitution: (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>) => Promise<Institution>;
    updateInstitution: (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => Promise<void>;
    deleteInstitution: (id: string) => Promise<void>;
    setCurrentInstitution: (institutionId: string) => void;
    clearCurrentInstitution: () => void;
    
    // Roles properties
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

    // Loading state
    isReady: boolean;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    
    // Institution state
    const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
    const [institutionLoading, setInstitutionLoading] = useState(true);
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);

    // Roles and Mappings state
    const { data: roles, addDoc: addRoleDoc, updateDoc: updateRoleDoc, deleteDoc: deleteRoleDoc, loading: rolesLoading } = useDatabaseCollection<Role>(ROLES_COLLECTION, currentInstitutionId || null);
    const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
    const [mappingsLoading, setMappingsLoading] = useState(true);

    const [defaultsInitialized, setDefaultsInitialized] = useState(false);

    useEffect(() => {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        if (storedId) {
            setCurrentInstitutionId(storedId);
        }
    }, []);
    
    useEffect(() => {
        if (!user || !db) {
            setInstitutionLoading(false);
            setMappingsLoading(false);
            setAllInstitutions([]);
            setUserMappings([]);
            return;
        }

        setInstitutionLoading(true);
        const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
        const unsubInstitutions = onValue(institutionsRef, (snapshot) => {
            const insts: Institution[] = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => insts.push({ id: child.key!, ...child.val() }));
            }
            setAllInstitutions(insts);
            setInstitutionLoading(false);
        }, (error) => {
            console.error("Error loading institutions:", error);
            setInstitutionLoading(false);
        });

        setMappingsLoading(true);
        const mappingsRef = ref(db, USER_MAP_COLLECTION);
        const unsubMappings = onValue(mappingsRef, (snapshot) => {
            const maps: UserMapping[] = [];
            if(snapshot.exists()){
                snapshot.forEach(child => {
                    if (child.val().userId === user.uid) {
                        maps.push({ id: child.key!, ...child.val() });
                    }
                });
            }
            setUserMappings(maps);
            setMappingsLoading(false);
        }, (error) => {
            console.error("Error loading user mappings:", error);
            setMappingsLoading(false);
        });
        
        return () => {
          unsubInstitutions();
          unsubMappings();
        }
    }, [user]);
    
    const userInstitutions = useMemo(() => {
        if (!user || institutionLoading || mappingsLoading) return [];
        
        const userMappedInstitutionIds = userMappings.map(m => m.institutionId);
        const ownedInstitutionIds = allInstitutions.filter(inst => inst.ownerId === user.uid).map(i => i.id);
        const allReachableIds = new Set([...userMappedInstitutionIds, ...ownedInstitutionIds]);
        
        return allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, allInstitutions, userMappings, institutionLoading, mappingsLoading]);

    const currentInstitution = useMemo(() => {
        return allInstitutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, allInstitutions]);

    const isReady = !institutionLoading && !mappingsLoading;

    const isSuperAdmin = useMemo(() => {
        if (!user || !currentInstitution) return false;
        return user.uid === currentInstitution.ownerId;
    }, [user, currentInstitution]);

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
    
    // Institution Callbacks
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

    // Role Callbacks
    const currentUserRole = useMemo(() => {
        if (!user || !currentInstitution || mappingsLoading) return null;
        if (isSuperAdmin) return 'admin'; 
        const mapping = userMappings.find(m => m.userId === user.uid && m.institutionId === currentInstitution.id);
        return mapping?.roleId ?? null;
    }, [user, currentInstitution, userMappings, mappingsLoading, isSuperAdmin]);
    
    const addMapping = useCallback(async (data: Omit<UserMapping, 'id'>, docId: string) => {
        if (!db) throw new Error("DB not initialized");
        const docRef = ref(db, `${USER_MAP_COLLECTION}/${docId}`);
        await set(docRef, data);
        return { id: docId, ...data } as UserMapping;
    }, []);

    const assignRoleToUser = useCallback(async (userId: string, roleId: RoleId, institutionId: string) => {
        const docId = `${userId}_${institutionId}`;
        const newMapping = { userId, roleId, institutionId };
        await addMapping(newMapping, docId);
    }, [addMapping]);
    
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
        userMappings: userMappings || [],
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
