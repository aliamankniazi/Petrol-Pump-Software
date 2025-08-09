

'use client';

import { useCallback, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'products';

export function useProducts() {
  const { data: products, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Product>(COLLECTION_NAME);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'timestamp'>): Promise<Product> => {
    const dataWithTimestamp = { ...product, timestamp: new Date().toISOString() };
    return addDoc(dataWithTimestamp);
  }, [addDoc]);
  
  const updateProduct = useCallback((id: string, updatedDetails: Partial<Omit<Product, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);
  
  const updateProductStock = useCallback((id: string, newStock: number) => {
    updateDoc(id, { stock: newStock });
  }, [updateDoc]);

  const deleteProduct = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    products: products || [], 
    addProduct, 
    updateProduct,
    updateProductStock,
    deleteProduct, 
    isLoaded: !loading
  };
}
