
'use client';

import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { useExpenses } from '@/hooks/use-expenses';
import { useCustomers } from '@/hooks/use-customers';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { useEmployees } from '@/hooks/use-employees';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import { useFuelStock } from '@/hooks/use-fuel-stock';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { useOtherIncomes } from './use-other-incomes';
import { useTankReadings } from './use-tank-readings';
import { useSupplierPayments } from './use-supplier-payments';
import { useSuppliers } from './use-suppliers';
import { useInvestments } from './use-investments';
import { useBusinessPartners } from './use-business-partners';
import { useAuth } from './use-auth';
import { useCallback } from 'react';

// This hook provides a function to clear all data FOR THE CURRENT USER.
export function useSettings() {
  const { user } = useAuth();

  const clearAllData = useCallback(() => {
    if (!user) return;
    
    const hookKeys = [
      'transactions', 'purchases', 'purchase-returns', 'expenses',
      'customers', 'suppliers', 'bank-accounts', 'employees',
      'fuel-prices', 'manual-fuel-stock', 'initial-fuel-stock',
      'customer-payments', 'cash-advances', 'other-incomes', 'tank-readings',
      'supplier-payments', 'investments', 'business-partners'
    ];

    hookKeys.forEach(key => {
        const userScopedKey = `pumppal-${user.uid}-${key}`;
        localStorage.removeItem(userScopedKey);
    });

    // Reload the page to reset all states to their initial values from scratch
    window.location.reload();
  }, [user]);

  return {
    clearAllData,
  };
}
