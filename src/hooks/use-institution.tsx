
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
    | { type: 'ADD_INSTITUTION'; payload: Institution }
    | { type: 'UPDATE_INSTITUTION'; payload: Partial<Institution> & { id: string } }
    | { type: 'DELETE_INSTITUTION'; payload: string }
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
        case 'ADD_INSTITUTION':
            return { ...state, allInstitutions: [...state.allInstitutions, action.payload] };
        case 'UPDATE_INSTITUTION':
            return { ...state, allInstitutions: state.allInstitutions.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
        case 'DELETE_INSTITUTION':
            return { ...state, allInstitutions: state.allInstitutions.filter(i => i.id !== action.payload) };
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
    const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(LOCAL_STORAGE_KEY);
    });

    useEffect(() => {
        const fetchData = async () => {
            if (authLoading) return; // Wait for auth to settle
            if (!user) {
                dispatch({ type: 'RESET' });
                return;
            }
            if (!db) {
                dispatch({ type: 'FETCH_ERROR', payload: new Error("Database not configured.") });
                return;
            }

            dispatch({ type: 'FETCH_START' });
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
    }, [user, authLoading]);

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
        dispatch({ type: 'ADD_INSTITUTION', payload: newInstitution });
        return newInstitution;
    }, [user]);

    const updateInstitution = useCallback(async (id: string, data: Partial<Omit<Institution, 'id' | 'ownerId'>>) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await update(docRef, data);
        dispatch({ type: 'UPDATE_INSTITUTION', payload: { id, ...data } });
    }, []);

    const deleteInstitution = useCallback(async (id: string) => {
        if (!db) return;
        const docRef = ref(db, `${INSTITUTIONS_COLLECTION}/${id}`);
        await remove(docRef);
        dispatch({ type: 'DELETE_INSTITUTION', payload: id });
        if (currentInstitutionId === id) {
            clearCurrentInstitutionCB();
        }
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
