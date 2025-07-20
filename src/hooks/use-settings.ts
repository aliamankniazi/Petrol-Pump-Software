
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

// This hook provides a function to clear all data FOR THE CURRENT USER.
export function useSettings() {
  const { user } = useAuth();
  const hooks = [
    useTransactions, usePurchases, usePurchaseReturns, useExpenses,
    useCustomers, useSuppliers, useBankAccounts, useEmployees,
    useFuelPrices, useFuelStock, useCustomerPayments, useCashAdvances,
    useOtherIncomes, useTankReadings, useSupplierPayments, useInvestments,
    useBusinessPartners
  ];

  const clearAllData = () => {
    if (!user) return;
    
    // This is a bit of a trick. We can't call hooks conditionally,
    // but we can iterate through them and clear their associated localStorage.
    const hookKeys = [
      'transactions', 'purchases', 'purchase-returns', 'expenses',
      'customers', 'suppliers', 'bank-accounts', 'employees',
      'fuel-prices', 'fuel-stock', 'customer-payments', 'cash-advances',
      'other-incomes', 'tank-readings', 'supplier-payments', 'investments',
      'business-partners', 'manual-fuel-stock', 'initial-fuel-stock'
    ];

    hookKeys.forEach(key => {
        const userScopedKey = `pumppal-${user.uid}-${key}`;
        localStorage.removeItem(userScopedKey);
    });

    // Reload the page to reset all states to their initial values
    window.location.reload();
  };

  return {
    clearAllData,
  };
}
