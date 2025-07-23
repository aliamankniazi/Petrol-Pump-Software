
'use client';

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useMemo } from 'react';
import { ref, push, set, serverTimestamp, update, remove, onValue } from 'firebase/database';
import type { Institution } from '@/lib/types';
import { useAuth } from './use-auth.tsx';
import { db } from '@/lib/firebase-client';

const INSTITUTIONS_COLLECTION = 'institutions';
const USER_MAP_COLLECTION = 'userMappings';
const LOCAL_STORAGE_KEY = 'currentInstitutionId';

interface UserToInstitution {
    id: string; // Composite key like `${userId}_${institutionId}`
    userId: string;
    institutionId: string;
    roleId: string;
}

interface InstitutionContextType {
    userInstitutions: Institution[];
    currentInstitution: Institution | null;
    institutionLoading: boolean;
    setCurrentInstitution: (institutionId: string) => void;
    clearCurrentInstitution: () => void;
    addInstitution: (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>) => Promise<Institution>;
    updateInstitution: (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => Promise<void>;
    deleteInstitution: (id: string) => Promise<void>;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export function InstitutionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
    const [allUserMappings, setAllUserMappings] = useState<UserToInstitution[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);
    
    useEffect(() => {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        if (storedId) {
            setCurrentInstitutionId(storedId);
        }
    }, []);

    useEffect(() => {
        if (!user || !db) {
            setLoading(false);
            setAllInstitutions([]);
            setAllUserMappings([]);
            return;
        }

        setLoading(true);

        const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
        const mappingsRef = ref(db, USER_MAP_COLLECTION);

        const unsubInstitutions = onValue(institutionsRef, (snapshot) => {
            const insts: Institution[] = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => insts.push({ id: child.key!, ...child.val() }));
            }
            setAllInstitutions(insts);
        }, (error) => {
            console.error("Error loading institutions:", error);
            setLoading(false);
        });

        const unsubMappings = onValue(mappingsRef, (snapshot) => {
            const maps: UserToInstitution[] = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => maps.push({ id: child.key!, ...child.val() }));
            }
            setAllUserMappings(maps);
            setLoading(false);
        }, (error) => {
            console.error("Error loading user mappings:", error);
            setLoading(false);
        });
        
        return () => {
            unsubInstitutions();
            unsubMappings();
        };
    }, [user]);

    const userInstitutions = useMemo(() => {
        if (!user || loading) return [];
        
        const userMappings = allUserMappings.filter(m => m.userId === user.uid);
        const institutionIdsFromMappings = userMappings.map(m => m.institutionId);
        
        const ownedInstitutions = allInstitutions.filter(inst => inst.ownerId === user.uid);
        const allReachableIds = new Set([...institutionIdsFromMappings, ...ownedInstitutions.map(i => i.id)]);
        
        return allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, allInstitutions, allUserMappings, loading]);

    const currentInstitution = useMemo(() => {
        return allInstitutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, allInstitutions]);

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
        
        // When a new institution is created, automatically select it.
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

    const value: InstitutionContextType = useMemo(() => ({
        userInstitutions,
        currentInstitution,
        institutionLoading: loading,
        setCurrentInstitution: setCurrentInstitutionCB,
        clearCurrentInstitution: clearCurrentInstitutionCB,
        addInstitution,
        updateInstitution,
        deleteInstitution,
    }), [
        userInstitutions, 
        currentInstitution, 
        loading,
        setCurrentInstitutionCB, 
        clearCurrentInstitutionCB, 
        addInstitution,
        updateInstitution,
        deleteInstitution
    ]);

    return (
        <InstitutionContext.Provider value={value}>
            {children}
        </InstitutionContext.Provider>
    );
}

export const useInstitution = () => {
    const context = useContext(InstitutionContext);
    if (context === undefined) {
        throw new Error('useInstitution must be used within an InstitutionProvider');
    }
    return context;
};
