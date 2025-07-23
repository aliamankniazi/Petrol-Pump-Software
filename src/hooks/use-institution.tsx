
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
    institutionDataLoaded: boolean;
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
    const [institutionDataLoaded, setInstitutionDataLoaded] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedId) {
            setCurrentInstitutionId(storedId);
        }
    }, []);
    
    useEffect(() => {
        if (authLoading) {
            setInstitutionDataLoaded(false);
            return;
        }

        if (!user) {
            setAllInstitutions([]);
            setAllUserMappings([]);
            setCurrentInstitutionId(null);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setInstitutionDataLoaded(true);
            return;
        }

        const fetchData = async () => {
            if (!db) {
                setInstitutionDataLoaded(true);
                return;
            }

            setInstitutionDataLoaded(false);
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
                console.error("Failed to fetch initial institution or mapping data:", error);
                setAllInstitutions([]);
                setAllUserMappings([]);
            } finally {
                setInstitutionDataLoaded(true);
            }
        };

        fetchData();
    }, [user, authLoading]);

    const userInstitutions = useMemo(() => {
        if (!user || !institutionDataLoaded) return [];
        
        const userMappings = allUserMappings.filter(m => m.userId === user.uid);
        const institutionIdsFromMappings = userMappings.map(m => m.institutionId);
        
        const ownedInstitutions = allInstitutions.filter(inst => inst.ownerId === user.uid);
        const allReachableIds = new Set([...institutionIdsFromMappings, ...ownedInstitutions.map(i => i.id)]);
        
        return allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, allInstitutions, allUserMappings, institutionDataLoaded]);

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
        setAllInstitutions(prev => [...prev, newInstitution]);
        return newInstitution;
    }, [user]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
        setAllInstitutions(prev => prev.map(inst => inst.id === id ? { ...inst, ...data } as Institution : inst));
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
        institutionDataLoaded,
        addInstitution,
        updateInstitution,
        deleteInstitution,
    }), [
        userInstitutions, 
        currentInstitution, 
        setCurrentInstitutionCB, 
        clearCurrentInstitutionCB, 
        institutionDataLoaded,
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

// This is a convenience hook for components that only need the list of institutions
export function useInstitutions() {
    const { 
        userInstitutions, 
        institutionDataLoaded,
        addInstitution, 
        updateInstitution, 
        deleteInstitution 
    } = useInstitution();
    
    return {
        institutions: userInstitutions,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        isLoaded: institutionDataLoaded,
    }
}
