
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BusinessPartner } from '@/lib/types';

const STORAGE_KEY = 'pumppal-business-partners';

export function useBusinessPartners() {
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
    setBusinessPartners(prev => [
      { ...partner, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const updateBusinessPartner = useCallback((id: string, updatedPartner: Omit<BusinessPartner, 'id' | 'timestamp'>) => {
    setBusinessPartners(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updatedPartner } : p))
    );
  }, []);

  const deleteBusinessPartner = useCallback((id: string) => {
    setBusinessPartners(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearBusinessPartners = useCallback(() => {
    setBusinessPartners([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove business partners from localStorage", error);
    }
  }, []);

  return { businessPartners, addBusinessPartner, updateBusinessPartner, deleteBusinessPartner, clearBusinessPartners, isLoaded };
}
