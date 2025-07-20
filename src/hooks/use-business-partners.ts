
'use client';

import { useCallback } from 'react';
import type { BusinessPartner } from '@/lib/types';
import { useCustomers } from './use-customers';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'business-partners';

export function useBusinessPartners() {
  const { data: businessPartners, setData: setBusinessPartners, isLoaded, clearDataForUser } = useLocalStorage<BusinessPartner[]>(STORAGE_KEY, []);
  const { customers, addCustomer, updateCustomer } = useCustomers();

  const addBusinessPartner = useCallback((partner: Omit<BusinessPartner, 'id' | 'timestamp'>): BusinessPartner => {
    const newCustomer = addCustomer({
        name: partner.name,
        contact: partner.contact || '',
        area: 'Business Partner',
        isPartner: true,
    });

    const newPartner: BusinessPartner = { 
        ...partner, 
        id: newCustomer.id,
        timestamp: newCustomer.timestamp 
    };

    setBusinessPartners(prev => {
        const updatedPartners = [newPartner, ...(prev || [])];
        return updatedPartners.sort((a,b) => a.name.localeCompare(b.name));
    });

    return newPartner;
  }, [addCustomer, setBusinessPartners]);

  const updateBusinessPartner = useCallback((id: string, updatedPartner: Partial<Omit<BusinessPartner, 'id' | 'timestamp'>>) => {
    setBusinessPartners(prev =>
      (prev || []).map(p => (p.id === id ? { ...p, ...updatedPartner, name: updatedPartner.name!, sharePercentage: updatedPartner.sharePercentage! } : p))
    );
    
    const customer = customers.find(c => c.id === id);
    if(customer) {
        updateCustomer(id, { name: updatedPartner.name, contact: updatedPartner.contact });
    }
  }, [customers, updateCustomer, setBusinessPartners]);

  const deleteBusinessPartner = useCallback((id: string) => {
    setBusinessPartners(prev => (prev || []).filter(p => p.id !== id));
  }, [setBusinessPartners]);

  const clearBusinessPartners = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { businessPartners: businessPartners || [], addBusinessPartner, updateBusinessPartner, deleteBusinessPartner, clearBusinessPartners, isLoaded };
}
