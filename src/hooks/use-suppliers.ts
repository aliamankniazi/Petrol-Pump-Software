
'use client';

import { useCallback } from 'react';
import type { Supplier } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { usePurchases } from './use-purchases'; // Import to check for dependencies
import { usePurchaseReturns } from './use-purchase-returns';
import { useSupplierPayments } from './use-supplier-payments';
import { useToast } from './use-toast';

const COLLECTION_NAME = 'suppliers';

export function useSuppliers() {
  const { data: suppliers, addDoc, deleteDoc, loading } = useDatabaseCollection<Supplier>(COLLECTION_NAME);
  const { purchases } = usePurchases();
  const { purchaseReturns } = usePurchaseReturns();
  const { supplierPayments } = useSupplierPayments();
  const { toast } = useToast();

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'timestamp'>): Promise<Supplier> => {
    const dataWithTimestamp = { ...supplier, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp);
    return newDoc;
  }, [addDoc]);
  
  const deleteSupplier = useCallback((id: string) => {
    // Safeguard: Check for dependencies before deleting
    const hasDependencies = purchases.some(p => p.supplierId === id) ||
                            purchaseReturns.some(pr => pr.supplierId === id) ||
                            supplierPayments.some(sp => sp.supplierId === id);

    const supplierName = suppliers.find(s => s.id === id)?.name || 'The supplier';

    if (hasDependencies) {
        toast({
            variant: 'destructive',
            title: 'Deletion Prevented',
            description: `${supplierName} has existing transactions and cannot be deleted.`,
        });
        return;
    }
    deleteDoc(id);
  }, [deleteDoc, purchases, purchaseReturns, supplierPayments, suppliers, toast]);

  return { 
    suppliers: suppliers || [], 
    addSupplier, 
    deleteSupplier, 
    isLoaded: !loading 
  };
}
