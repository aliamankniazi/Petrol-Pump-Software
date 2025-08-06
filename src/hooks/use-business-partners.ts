
'use client';

import { useCallback } from 'react';
import type { BusinessPartner } from '@/lib/types';
import { useCustomers } from './use-customers';
import { useDatabaseCollection } from './use-database-collection';

export function useBusinessPartners() {
  const { data: businessPartners, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<BusinessPartner>('business-partners');
  const { customers, addCustomer, updateCustomer, isLoaded: customersLoaded } = useCustomers();

  const addBusinessPartner = useCallback(async (partner: Omit<BusinessPartner, 'id' | 'timestamp'>): Promise<BusinessPartner> => {
    // A business partner is also a customer, so we create a customer record first.
    // This allows them to appear in ledgers and other customer-related reports.
    const newCustomer = await addCustomer({
        name: partner.name,
        contact: partner.contact || '',
        area: 'Business Partner',
        isPartner: true,
    });

    if (!newCustomer || !newCustomer.id) {
        throw new Error("Failed to create associated customer for business partner.");
    }
    
    // Use the newly created customer's ID for the business partner record to keep them linked.
    const newPartnerData = { ...partner, timestamp: new Date().toISOString() };
    const newPartner = await addDoc(newPartnerData, newCustomer.id);
    
    return newPartner;
  }, [addCustomer, addDoc]);

  const updateBusinessPartner = useCallback((id: string, updatedPartner: Partial<Omit<BusinessPartner, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedPartner);
    
    // Also update the corresponding customer record.
    const customer = customers.find(c => c.id === id);
    if(customer) {
        updateCustomer(id, { name: updatedPartner.name, contact: updatedPartner.contact });
    }
  }, [customers, updateCustomer, updateDoc]);

  const deleteBusinessPartner = useCallback((id: string) => {
    // Note: Deleting a partner does not currently delete the associated customer record
    // to preserve historical transaction data. This could be changed if needed.
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    businessPartners: businessPartners || [], 
    addBusinessPartner, 
    updateBusinessPartner, 
    deleteBusinessPartner, 
    isLoaded: !loading && customersLoaded
  };
}
