
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
    
    const { data: allInstitutions, loading: institutionsLoaded } = useDatabaseCollection<Institution>(INSTITUTION_COLLECTION, null, { allInstitutions: true });
    const { data: allUserMappings, loading: mappingsLoaded } = useDatabaseCollection<UserToInstitution>(USER_MAP_COLLECTION, null, { allInstitutions: true });

    useEffect(() => {
        const storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedId) {
            setCurrentInstitutionId(storedId);
        }
    }, []);

    const userInstitutions = useMemo(() => {
        if (!user || institutionsLoaded || mappingsLoaded) return [];
        const userMappings = (allUserMappings || []).filter(m => m.userId === user.uid);
        const institutionIds = userMappings.map(m => m.institutionId);
        return (allInstitutions || []).filter(inst => institutionIds.includes(inst.id));
    }, [user, allInstitutions, allUserMappings, institutionsLoaded, mappingsLoaded]);

    const currentInstitution = useMemo(() => {
        return (allInstitutions || []).find(inst => inst.id === currentInstitutionId) ?? null;
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
    const { data, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Institution>(INSTITUTION_COLLECTION, null, { allInstitutions: true });
    
    const addInstitution = useCallback((institution: Omit<Institution, 'id' | 'ownerId'>) => {
        if (!user) throw new Error("User must be logged in to create an institution.");
        return addDoc({ ...institution, ownerId: user.uid });
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
