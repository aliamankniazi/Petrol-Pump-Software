
'use client';

import { useCallback } from 'react';
import type { BusinessPartner } from '@/lib/types';
import { useCustomers } from './use-customers';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'business-partners';

export function useBusinessPartners() {
  const { data: businessPartners, addDoc, updateDoc, deleteDoc, loading } = useFirestoreCollection<BusinessPartner>(COLLECTION_NAME);
  const { customers, addCustomer, updateCustomer } = useCustomers();

  const addBusinessPartner = useCallback(async (partner: Omit<BusinessPartner, 'id' | 'timestamp'>): Promise<BusinessPartner> => {
    const newCustomer = await addCustomer({
        name: partner.name,
        contact: partner.contact || '',
        area: 'Business Partner',
        isPartner: true,
    });

    const newPartnerData = { ...partner, id: newCustomer.id };
    await addDoc(newPartnerData, newCustomer.id);
    
    return { ...newPartnerData, timestamp: new Date().toISOString() };
  }, [addCustomer, addDoc]);

  const updateBusinessPartner = useCallback((id: string, updatedPartner: Partial<Omit<BusinessPartner, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedPartner);
    
    const customer = customers.find(c => c.id === id);
    if(customer) {
        updateCustomer(id, { name: updatedPartner.name, contact: updatedPartner.contact });
    }
  }, [customers, updateCustomer, updateDoc]);

  const deleteBusinessPartner = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    businessPartners: businessPartners || [], 
    addBusinessPartner, 
    updateBusinessPartner, 
    deleteBusinessPartner, 
    isLoaded: !loading 
  };
}
