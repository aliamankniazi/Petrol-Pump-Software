
'use client';

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useMemo } from 'react';
import { ref, onValue, push, set, serverTimestamp, update, remove } from 'firebase/database';
import type { Institution } from '@/lib/types';
import { useAuth } from './use-auth';
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
    const { user } = useAuth();
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

        if (!isFirebaseConfigured() || !db) {
            setLoading(false);
            return;
        }

        const institutionsRef = ref(db, INSTITUTIONS_COLLECTION);
        const mappingsRef = ref(db, USER_MAP_COLLECTION);

        const onInstitutionsValue = onValue(institutionsRef, (snapshot) => {
            const institutionsArray: Institution[] = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => institutionsArray.push({ id: key, ...data[key] }));
            }
            setAllInstitutions(institutionsArray);
        }, (error) => console.error("Error fetching institutions:", error));

        const onMappingsValue = onValue(mappingsRef, (snapshot) => {
            const mappingsArray: UserToInstitution[] = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => mappingsArray.push({ id: key, ...data[key] }));
            }
            setAllUserMappings(mappingsArray);
        }, (error) => console.error("Error fetching user mappings:", error));

        const institutionsPromise = new Promise<void>(resolve => onValue(institutionsRef, () => resolve(), { onlyOnce: true }));
        const mappingsPromise = new Promise<void>(resolve => onValue(mappingsRef, () => resolve(), { onlyOnce: true }));

        Promise.all([institutionsPromise, mappingsPromise]).finally(() => setLoading(false));

        return () => {
           // Detach listeners by passing null as the callback
           onValue(institutionsRef, null as any);
           onValue(mappingsRef, null as any);
        };
    }, []);

    const userInstitutions = useMemo(() => {
        if (!user) return [];
        const userMappings = allUserMappings.filter(m => m.userId === user.uid);
        const institutionIds = userMappings.map(m => m.institutionId);
        return allInstitutions.filter(inst => institutionIds.includes(inst.id));
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

    const clearCurrentInstitutionCB = useCallback(() => {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Could not remove item in localStorage:", error);
        }
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
        return { ...dataWithOwner, id: newId, timestamp: Date.now() } as Institution;
    }, [user]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
    }, []);

    const deleteInstitution = useCallback(async (id: string) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await remove(docRef);
    }, []);

    const value = useMemo(() => ({
        userInstitutions,
        currentInstitution,
        setCurrentInstitution: setCurrentInstitutionCB,
        clearCurrentInstitution: clearCurrentInstitutionCB,
        isLoaded: !loading,
        addInstitution,
        updateInstitution,
        deleteInstitution
    }), [
        userInstitutions,
        currentInstitution,
        setCurrentInstitutionCB,
        clearCurrentInstitutionCB,
        loading,
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
