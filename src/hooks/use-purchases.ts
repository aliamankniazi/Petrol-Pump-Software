
'use client';

import { useCallback } from 'react';
import type { Purchase } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';
import { useExpenses } from './use-expenses';
import { useSupplierPayments } from './use-supplier-payments';

const COLLECTION_NAME = 'purchases';

export function usePurchases() {
  const { data: purchases, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Purchase>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();
  const { addExpense } = useExpenses();
  const { addSupplierPayment } = useSupplierPayments();

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id'>) => {
    const purchaseWithTimestamp = {
      ...purchase,
      timestamp: purchase.timestamp || new Date().toISOString(),
    }
    addDoc(purchaseWithTimestamp);

    purchase.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) + item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });

    if (purchase.expenses && purchase.expenses > 0) {
        addExpense({
            description: `Expenses for purchase from ${purchase.supplier}`,
            category: 'Other',
            amount: purchase.expenses,
            timestamp: purchase.timestamp || new Date().toISOString(),
        });
    }

    if (purchase.paidAmount && purchase.paidAmount > 0 && purchase.paymentMethod && purchase.paymentMethod !== 'On Credit') {
        addSupplierPayment({
            supplierId: purchase.supplierId,
            supplierName: purchase.supplier,
            amount: purchase.paidAmount,
            paymentMethod: purchase.paymentMethod,
            timestamp: purchase.timestamp || new Date().toISOString(),
        });
    }
    
  }, [addDoc, products, updateProductStock, addExpense, addSupplierPayment]);
  
  const updatePurchase = useCallback((id: string, originalPurchase: Purchase, updatedPurchase: Partial<Omit<Purchase, 'id'>>) => {
      originalPurchase.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
              const revertedStock = (product.stock || 0) - item.quantity;
              updateProductStock(item.productId, revertedStock);
          }
      });
      
      updatedPurchase.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const currentProduct = products.find(p => p.id === item.productId);
            const newStock = (currentProduct?.stock || 0) + item.quantity;
            updateProductStock(item.productId, newStock);
        }
      });

      updateDoc(id, updatedPurchase);

  }, [products, updateDoc, updateProductStock]);

  const deletePurchase = useCallback((purchaseId: string) => {
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if (!purchaseToDelete) return;

    purchaseToDelete.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) - item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });
    
    deleteDoc(purchaseToDelete.id!);
  }, [deleteDoc, purchases, products, updateProductStock]);
  
  return { 
    purchases: purchases || [], 
    addPurchase, 
    updatePurchase,
    deletePurchase, 
    isLoaded: !loading 
  };
}
