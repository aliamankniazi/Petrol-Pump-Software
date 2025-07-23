
'use client';

import { createContext, useState, useEffect, useContext, type ReactNode, useCallback, useMemo, useReducer } from 'react';
import { ref, push, set, serverTimestamp, update, remove, get } from 'firebase/database';
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

interface InstitutionState {
    allInstitutions: Institution[];
    allUserMappings: UserToInstitution[];
    loading: boolean;
    error: Error | null;
}

type InstitutionAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: { institutions: Institution[], mappings: UserToInstitution[] } }
    | { type: 'FETCH_ERROR'; payload: Error }
    | { type: 'RESET' };

const initialState: InstitutionState = {
    allInstitutions: [],
    allUserMappings: [],
    loading: true,
    error: null,
};

const institutionReducer = (state: InstitutionState, action: InstitutionAction): InstitutionState => {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, allInstitutions: action.payload.institutions, allUserMappings: action.payload.mappings };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
};

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
    const { user, loading: authLoading } = useAuth();
    const [state, dispatch] = useReducer(institutionReducer, initialState);
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null);
    
    // Effect to safely access localStorage only on the client side
    useEffect(() => {
        setCurrentInstitutionId(localStorage.getItem(LOCAL_STORAGE_KEY));
    }, []);

    useEffect(() => {
        // This effect runs when auth state changes.
        // It's the central point for fetching data *after* login.
        const fetchData = async () => {
            if (authLoading || !user) {
                // If auth is loading, or there's no user, do nothing.
                if (!user) {
                    dispatch({ type: 'RESET' }); // Clear data on logout
                }
                return;
            }

            if (!db) {
                dispatch({ type: 'FETCH_ERROR', payload: new Error("Database not configured.") });
                return;
            }

            dispatch({ type: 'FETCH_START' });
            try {
                // Fetch both collections at the same time
                const [institutionsSnapshot, mappingsSnapshot] = await Promise.all([
                    get(ref(db, INSTITUTIONS_COLLECTION)),
                    get(ref(db, USER_MAP_COLLECTION))
                ]);

                const institutionsArray: Institution[] = [];
                if (institutionsSnapshot.exists()) {
                    const data = institutionsSnapshot.val();
                    Object.keys(data).forEach(key => institutionsArray.push({ id: key, ...data[key] }));
                }
                
                const mappingsArray: UserToInstitution[] = [];
                if (mappingsSnapshot.exists()) {
                    const data = mappingsSnapshot.val();
                    Object.keys(data).forEach(key => mappingsArray.push({ id: key, ...data[key] }));
                }
                
                dispatch({ type: 'FETCH_SUCCESS', payload: { institutions: institutionsArray, mappings: mappingsArray } });

            } catch (error) {
                console.error("Failed to fetch institution or mapping data:", error);
                dispatch({ type: 'FETCH_ERROR', payload: error as Error });
            }
        };

        fetchData();
    }, [user, authLoading]); // Dependency array ensures this runs only when auth state settles.

    const userInstitutions = useMemo(() => {
        if (!user || state.loading) return [];
        
        const userMappings = state.allUserMappings.filter(m => m.userId === user.uid);
        const institutionIdsFromMappings = userMappings.map(m => m.institutionId);
        
        const ownedInstitutions = state.allInstitutions.filter(inst => inst.ownerId === user.uid);
        const allReachableIds = new Set([...institutionIdsFromMappings, ...ownedInstitutions.map(i => i.id)]);
        
        return state.allInstitutions.filter(inst => allReachableIds.has(inst.id));
    }, [user, state.allInstitutions, state.allUserMappings, state.loading]);

    const currentInstitution = useMemo(() => {
        return state.allInstitutions.find(inst => inst.id === currentInstitutionId) ?? null;
    }, [currentInstitutionId, state.allInstitutions]);

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
        
        // No need to dispatch here, onValue listener will pick up the change
        return newInstitution;
    }, [user]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
        // onValue listener will update state
    }, []);

    const deleteInstitution = useCallback(async (id: string) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await remove(docRef);
        if (currentInstitutionId === id) {
            clearCurrentInstitutionCB();
        }
        // onValue listener will update state
    }, [currentInstitutionId, clearCurrentInstitutionCB]);

    const value: InstitutionContextType = useMemo(() => ({
        userInstitutions,
        currentInstitution,
        institutionLoading: state.loading,
        setCurrentInstitution: setCurrentInstitutionCB,
        clearCurrentInstitution: clearCurrentInstitutionCB,
        addInstitution,
        updateInstitution,
        deleteInstitution,
    }), [
        userInstitutions, 
        currentInstitution, 
        state.loading,
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

export function useInstitutions() {
    const { 
        userInstitutions, 
        institutionLoading,
        addInstitution, 
        updateInstitution, 
        deleteInstitution 
    } = useInstitution();
    
    return {
        institutions: userInstitutions || [],
        addInstitution,
        updateInstitution,
        deleteInstitution,
        isLoaded: !institutionLoading,
    }
}
