
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
        const storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedId) {
            setCurrentInstitutionId(storedId);
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
        }, (error) => {
            console.error(error);
        });

        const onMappingsValue = onValue(mappingsRef, (snapshot) => {
            const mappingsArray: UserToInstitution[] = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => mappingsArray.push({ id: key, ...data[key] }));
            }
            setAllUserMappings(mappingsArray);
        }, (error) => {
            console.error(error);
        });

        // Determine loading state
        Promise.all([
          new Promise(resolve => onValue(institutionsRef, () => resolve(true), { onlyOnce: true })),
          new Promise(resolve => onValue(mappingsRef, () => resolve(true), { onlyOnce: true }))
        ]).finally(() => setLoading(false));
        

        return () => {
            // Detach listeners
            onValue(institutionsRef, () => {}, { onlyOnce: true });
            onValue(mappingsRef, () => {}, { onlyOnce: true });
        };
    }, []);

    const userInstitutions = useMemo(() => {
        if (!user || !allUserMappings || !allInstitutions) return [];
        const userMappings = allUserMappings.filter(m => m.userId === user.uid);
        const institutionIds = userMappings.map(m => m.institutionId);
        return allInstitutions.filter(inst => institutionIds.includes(inst.id));
    }, [user, allInstitutions, allUserMappings]);

    const currentInstitution = useMemo(() => {
        return allInstitutions?.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, allInstitutions]);

    const setCurrentInstitutionCallback = useCallback((institutionId: string) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, institutionId);
        setCurrentInstitutionId(institutionId);
    }, []);

    const clearCurrentInstitution = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setCurrentInstitutionId(null);
    }, []);

    const value = useMemo(() => ({
        userInstitutions,
        currentInstitution,
        setCurrentInstitution: setCurrentInstitutionCallback,
        clearCurrentInstitution,
        isLoaded: !loading,
    }), [userInstitutions, currentInstitution, setCurrentInstitutionCallback, clearCurrentInstitution, loading]);

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

// Simplified useInstitutions hook for creating a new institution
export function useInstitutions() {
    const { user } = useAuth();
    
    const addInstitution = useCallback(async (institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>) => {
        if (!user) throw new Error("User must be logged in to create an institution.");
        if (!db) throw new Error("Database not initialized");

        const newDocRef = push(ref(db, INSTITUTIONS_COLLECTION));
        const dataWithOwner = { ...institution, ownerId: user.uid, timestamp: serverTimestamp() };
        await set(newDocRef, dataWithOwner);
        return { ...dataWithOwner, id: newDocRef.key!, timestamp: Date.now() };
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
    
    const { userInstitutions, isLoaded } = useInstitution();
    
    return {
        institutions: userInstitutions,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        isLoaded,
    }
}
