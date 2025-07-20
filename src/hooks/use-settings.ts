
'use client';

import { useCallback } from 'react';

// This hook provides a function to clear all data FOR THE CURRENT USER.
export function useSettings() {

  const clearAllDataForUser = useCallback((userId: string) => {
    if (!userId) return;
    
    const hookKeys = [
      'transactions', 'purchases', 'purchase-returns', 'expenses',
      'customers', 'suppliers', 'bank-accounts', 'employees',
      'fuel-prices', 'manual-fuel-stock', 'initial-fuel-stock',
      'customer-payments', 'cash-advances', 'other-incomes', 'tank-readings',
      'supplier-payments', 'investments', 'business-partners'
    ];

    hookKeys.forEach(key => {
        const userScopedKey = `pumppal-${userId}-${key}`;
        localStorage.removeItem(userScopedKey);
    });
  }, []);
  
  const clearAllData = useCallback(() => {
    // This is a more drastic measure, usually for debugging.
    // Be careful using this as it affects all users' data stored in the browser.
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('pumppal-')) {
        localStorage.removeItem(key);
      }
    });
    // Reload the page to reset all states to their initial values from scratch
    window.location.reload();
  }, []);

  return {
    clearAllData,
    clearAllDataForUser
  };
}
