
'use client';

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useMemo } from 'react';
import { ref, push, set, serverTimestamp, update, remove, get } from 'firebase/database';
import type { Institution } from '@/lib/types';
import { useAuth } from './use-auth.tsx';
import { db, isFirebaseConfigured } from '@/lib/firebase-client';

const INSTITUTIONS_COLLECTION = 'institutions';
const USER_MAP_COLLECTION = 'userMappings';

interface UserToInstitution {
    id: string; // Composite key like `${userId}_${institutionId}`
    userId: string;
    institutionId: string;
    roleId: string;
}

interface InstitutionContextType {
    userInstitutions: Institution[];
    currentInstitution: Institution | null;
    setCurrentInstitution: (institutionId: string) => void;
    clearCurrentInstitution: () => void;
    isLoaded: boolean;
    addInstitution: (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>) => Promise<Institution>;
    updateInstitution: (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => Promise<void>;
    deleteInstitution: (id: string) => Promise<void>;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'currentInstitutionId';

export function InstitutionProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);
    const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
    const [allUserMappings, setAllUserMappings] = useState<UserToInstitution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let storedId: string | null = null;
        try {
            storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedId) {
                setCurrentInstitutionId(storedId);
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            if (authLoading || !user) {
                if (!authLoading) setLoading(false);
                return;
            }
    
            if (!isFirebaseConfigured() || !db) {
                setLoading(false);
                return;
            }
    
            setLoading(true);
            try {
                const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
                const mappingsRef = ref(db, USER_MAP_COLLECTION);
                
                const [institutionsSnapshot, mappingsSnapshot] = await Promise.all([
                    get(institutionsRef),
                    get(mappingsRef)
                ]);

                const institutionsArray: Institution[] = [];
                if (institutionsSnapshot.exists()) {
                    const data = institutionsSnapshot.val();
                    Object.keys(data).forEach(key => institutionsArray.push({ id: key, ...data[key] }));
                }
                setAllInstitutions(institutionsArray);

                const mappingsArray: UserToInstitution[] = [];
                if (mappingsSnapshot.exists()) {
                    const data = mappingsSnapshot.val();
                    Object.keys(data).forEach(key => mappingsArray.push({ id: key, ...data[key] }));
                }
                setAllUserMappings(mappingsArray);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, authLoading]);
    
    const clearCurrentInstitutionCB = useCallback(() => {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Could not remove item from localStorage:", error);
        }
        setCurrentInstitutionId(null);
    }, []);

    useEffect(() => {
        if (!user) {
            clearCurrentInstitutionCB();
        }
    }, [user, clearCurrentInstitutionCB]);

    const userInstitutions = useMemo(() => {
        if (!user) return [];
        const userMappings = allUserMappings.filter(m => m.userId === user.uid);
        const institutionIds = userMappings.map(m => m.institutionId);
        
        const ownedInstitutions = allInstitutions.filter(inst => inst.ownerId === user.uid);
        const allReachableIds = new Set([...institutionIds, ...ownedInstitutions.map(i => i.id)]);
        
        return allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, allInstitutions, allUserMappings]);

    const currentInstitution = useMemo(() => {
        return allInstitutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, allInstitutions]);

    const setCurrentInstitutionCB = useCallback((institutionId: string) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, institutionId);
        } catch (error) {
            console.error("Could not set item in localStorage:", error);
        }
        setCurrentInstitutionId(institutionId);
    }, []);
    
    const addInstitution = useCallback(async (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>): Promise<Institution> => {
        if (!user) throw new Error("User must be logged in to create an institution.");
        if (!db) throw new Error("Database not initialized");

        const newDocRef = push(ref(db, INSTITUTIONS_COLLECTION));
        const newId = newDocRef.key;
        if (!newId) throw new Error("Failed to create new institution ID.");
        
        const dataWithOwner = { ...institution, ownerId: user.uid, timestamp: serverTimestamp() };
        await set(newDocRef, dataWithOwner);
        const newInstitution = { ...dataWithOwner, id: newId, timestamp: Date.now() } as Institution
        setAllInstitutions(prev => [...prev, newInstitution]);
        return newInstitution;
    }, [user]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
        setAllInstitutions(prev => prev.map(inst => inst.id === id ? { ...inst, ...data } : inst));
    }, []);

    const deleteInstitution = useCallback(async (id: string) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await remove(docRef);
        setAllInstitutions(prev => prev.filter(inst => inst.id !== id));
        if (currentInstitutionId === id) {
            clearCurrentInstitutionCB();
        }
    }, [currentInstitutionId, clearCurrentInstitutionCB]);

    const value: InstitutionContextType = useMemo(() => ({
        userInstitutions,
        currentInstitution,
        setCurrentInstitution: setCurrentInstitutionCB,
        clearCurrentInstitution: clearCurrentInstitutionCB,
        isLoaded: !loading && !authLoading,
        addInstitution,
        updateInstitution,
        deleteInstitution,
    }), [
        userInstitutions, 
        currentInstitution, 
        setCurrentInstitutionCB, 
        clearCurrentInstitutionCB, 
        loading,
        authLoading,
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

export function useInstitutions() {
    const { 
        userInstitutions, 
        isLoaded, 
        addInstitution, 
        updateInstitution, 
        deleteInstitution 
    } = useInstitution();
    
    return {
        institutions: userInstitutions,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        isLoaded,
    }
}
