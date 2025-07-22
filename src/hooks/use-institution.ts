
'use client';

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useMemo } from 'react';
import type { Institution } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useAuth } from './use-auth';

const INSTITUTION_COLLECTION = 'institutions';
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
    
    // These hooks now fetch from the root without needing an institutionId.
    const { data: allInstitutions, loading: institutionsLoaded } = useDatabaseCollection<Institution>(INSTITUTION_COLLECTION, null, { allInstitutions: true });
    const { data: allUserMappings, loading: mappingsLoaded } = useDatabaseCollection<UserToInstitution>(USER_MAP_COLLECTION, null, { allInstitutions: true });

    useEffect(() => {
        const storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedId) {
            setCurrentInstitutionId(storedId);
        }
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

    const isLoaded = !institutionsLoaded && !mappingsLoaded;

    const value = useMemo(() => ({
        userInstitutions,
        currentInstitution,
        setCurrentInstitution: setCurrentInstitutionCallback,
        clearCurrentInstitution,
        isLoaded,
    }), [userInstitutions, currentInstitution, setCurrentInstitutionCallback, clearCurrentInstitution, isLoaded]);

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

// A separate hook just for creating/managing institutions, usually for super admins
export function useInstitutions() {
    const { user } = useAuth();
    // This hook fetches from the root, so institutionId is null and allInstitutions is true.
    const { data, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Institution>(INSTITUTION_COLLECTION, null, { allInstitutions: true });
    
    const addInstitution = useCallback((institution: Omit<Institution, 'id' | 'ownerId' | 'timestamp'>) => {
        if (!user) throw new Error("User must be logged in to create an institution.");
        const dataWithOwner = { ...institution, ownerId: user.uid };
        // The useDatabaseCollection hook now handles the timestamp.
        return addDoc(dataWithOwner);
    }, [addDoc, user]);
    
    const { userInstitutions, isLoaded: userInstLoaded } = useInstitution();
    
    return {
        institutions: data || [],
        userInstitutions,
        addInstitution,
        updateInstitution: updateDoc,
        deleteInstitution: deleteDoc,
        isLoaded: !loading && userInstLoaded,
    }
}
