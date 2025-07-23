
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
        // This effect is responsible for fetching all necessary data from Firebase
        // after the user has been authenticated.
        const loadData = async () => {
            if (authLoading || !user) {
                // If auth is still loading or there's no user, we can't do anything yet.
                // When auth is done and there's no user, the `AppContainer` will redirect to login.
                if (!authLoading) setLoading(false);
                return;
            }

            if (!isFirebaseConfigured() || !db) {
                console.warn("Firebase not configured. Bypassing data fetch.");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch both institutions and user mappings at the same time.
                const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
                const mappingsRef = ref(db, USER_MAP_COLLECTION);
                
                const [institutionsSnapshot, mappingsSnapshot] = await Promise.all([
                    get(institutionsRef),
                    get(mappingsRef)
                ]);

                // Process institutions data
                const institutionsArray: Institution[] = [];
                if (institutionsSnapshot.exists()) {
                    const data = institutionsSnapshot.val();
                    Object.keys(data).forEach(key => institutionsArray.push({ id: key, ...data[key] }));
                }
                setAllInstitutions(institutionsArray);

                // Process user mappings data
                const mappingsArray: UserToInstitution[] = [];
                if (mappingsSnapshot.exists()) {
                    const data = mappingsSnapshot.val();
                    Object.keys(data).forEach(key => mappingsArray.push({ id: key, ...data[key] }));
                }
                setAllUserMappings(mappingsArray);
            } catch (error) {
                console.error("Failed to fetch initial institution or mapping data:", error);
            } finally {
                // Crucially, set loading to false regardless of whether data was found or not.
                // This breaks the infinite loading loop.
                setLoading(false);
            }
        };

        loadData();
    }, [user, authLoading]); // This dependency array ensures the effect runs when auth state changes.
    
    const clearCurrentInstitutionCB = useCallback(() => {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Could not remove item from localStorage:", error);
        }
        setCurrentInstitutionId(null);
    }, []);

    // This effect handles clearing the current institution when the user logs out.
    useEffect(() => {
        if (!user && !authLoading) {
            clearCurrentInstitutionCB();
            setAllInstitutions([]);
            setAllUserMappings([]);
        }
    }, [user, authLoading, clearCurrentInstitutionCB]);

    const userInstitutions = useMemo(() => {
        if (!user || loading) return [];
        // A user has access to an institution if they own it OR if there is a mapping for them.
        const userMappings = allUserMappings.filter(m => m.userId === user.uid);
        const institutionIdsFromMappings = userMappings.map(m => m.institutionId);
        
        const ownedInstitutions = allInstitutions.filter(inst => inst.ownerId === user.uid);
        const allReachableIds = new Set([...institutionIdsFromMappings, ...ownedInstitutions.map(i => i.id)]);
        
        return allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, allInstitutions, allUserMappings, loading]);

    const currentInstitution = useMemo(() => {
        if (!currentInstitutionId && userInstitutions.length === 1) {
            // If only one institution is available, select it automatically.
            setCurrentInstitutionId(userInstitutions[0].id);
            return userInstitutions[0];
        }
        return allInstitutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, allInstitutions, userInstitutions]);

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
        institutions: userInstitutions, // Now it can be undefined initially, but the component will handle it
        addInstitution,
        updateInstitution,
        deleteInstitution,
        isLoaded,
    }
}
