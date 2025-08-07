

'use client';

import { useCallback, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'products';

// Default fuel products to ensure they exist
const DEFAULT_PRODUCTS: Omit<Product, 'id' | 'timestamp' | 'stock'>[] = [
    { name: 'Unleaded', category: 'Fuel', productType: 'Main', unit: 'Litre', purchasePrice: 0, tradePrice: 0, mainUnit: 'Litre' },
    { name: 'Premium', category: 'Fuel', productType: 'Main', unit: 'Litre', purchasePrice: 0, tradePrice: 0, mainUnit: 'Litre' },
    { name: 'Diesel', category: 'Fuel', productType: 'Main', unit: 'Litre', purchasePrice: 0, tradePrice: 0, mainUnit: 'Litre' },
];

export function useProducts() {
  const { data: products, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Product>(COLLECTION_NAME);

  // Function to initialize default products if they don't exist
  useEffect(() => {
    if (!loading && products.length === 0) {
      DEFAULT_PRODUCTS.forEach(p => {
        addDoc({ ...p, stock: 0, timestamp: new Date().toISOString() });
      });
    }
  }, [loading, products, addDoc]);

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
