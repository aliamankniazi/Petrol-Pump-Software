
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BusinessPartner } from '@/lib/types';
import { useCustomers } from './use-customers';

const STORAGE_KEY = 'pumppal-business-partners';

export function useBusinessPartners() {
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addCustomer, updateCustomer, customers } = useCustomers();

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setBusinessPartners(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse business partners from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(businessPartners));
      } catch (error) {
        console.error("Failed to save business partners to localStorage", error);
      }
    }
  }, [businessPartners, isLoaded]);

  const addBusinessPartner = useCallback((partner: Omit<BusinessPartner, 'id' | 'timestamp'>) => {
    const newPartnerId = crypto.randomUUID();
    const newPartner = { ...partner, id: newPartnerId, timestamp: new Date().toISOString() };
    setBusinessPartners(prev => [
      newPartner,
      ...prev,
    ]);

    // Also add as a customer
    addCustomer({
        id: newPartnerId, // Use the same ID
        name: partner.name,
        contact: partner.contact || '',
        area: 'Business Partner',
        isPartner: true,
    });
  }, [addCustomer]);

  const updateBusinessPartner = useCallback((id: string, updatedPartner: Partial<Omit<BusinessPartner, 'id' | 'timestamp'>>) => {
    setBusinessPartners(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updatedPartner, name: updatedPartner.name!, sharePercentage: updatedPartner.sharePercentage! } : p))
    );
    
    // Also update the corresponding customer record
    const customer = customers.find(c => c.id === id);
    if(customer) {
        updateCustomer(id, { name: updatedPartner.name, contact: updatedPartner.contact });
    }
  }, [customers, updateCustomer]);

  const deleteBusinessPartner = useCallback((id: string) => {
    // Note: We don't delete the customer record to preserve their ledger history.
    // We can filter them out in the UI if needed.
    setBusinessPartners(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearBusinessPartners = useCallback(() => {
    setBusinessPartners([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error)
      {
      console.error("Failed to remove business partners from localStorage", error);
    }
  }, []);

  return { businessPartners, addBusinessPartner, updateBusinessPartner, deleteBusinessPartner, clearBusinessPartners, isLoaded };
}
