
'use client';

import { createContext, useContext, type ReactNode, useMemo } from 'react';
import { useAuth } from './use-auth';
import { useTransactions } from './use-transactions';
import { usePurchases } from './use-purchases';
import { useExpenses } from './use-expenses';
import { usePurchaseReturns } from './use-purchase-returns';
import { useOtherIncomes } from './use-other-incomes';
import { useCustomers } from './use-customers';
import { useSuppliers } from './use-suppliers';
import { useBankAccounts } from './use-bank-accounts';
import { useEmployees } from './use-employees';
import { useCustomerPayments } from './use-customer-payments';
import { useSupplierPayments } from './use-supplier-payments';
import { useCashAdvances } from './use-cash-advances';
import { useProducts } from './use-products';
import { useTankReadings } from './use-tank-readings';
import { useInvestments } from './use-investments';
import { useAttendance } from './use-attendance';

// The purpose of this provider is to centralize data fetching and ensure
// that no data is fetched until the user is authenticated. This prevents
// race conditions and permission errors on initial load.
const DataContext = createContext({});

function AuthenticatedDataProvider({ children }: { children: ReactNode }) {
    // This hook will trigger all the individual data hooks.
    // By placing this inside the AuthenticatedDataProvider, we ensure
    // they only run when a user is logged in.
    useTransactions();
    usePurchases();
    useExpenses();
    usePurchaseReturns();
    useOtherIncomes();
    useCustomers();
    useSuppliers();
    useBankAccounts();
    useEmployees();
    useCustomerPayments();
    useSupplierPayments();
    useCashAdvances();
    useProducts();
    useTankReadings();
    useInvestments();
    useAttendance();

    return <>{children}</>;
}


export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  // This is a critical change to prevent race conditions.
  // We explicitly wait for the loading to finish and for a user to be present
  // before we mount the AuthenticatedDataProvider, which triggers all data hooks.
  if (loading) {
    // While auth is loading, we render a placeholder. A proper loading screen would be better.
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Authenticating...</p>
      </div>
    );
  }
  
  if (!user) {
    // If there's no user, just render the children (e.g., login page)
    // The data hooks will not be called.
    return <>{children}</>;
  }
  
  // If we have a user, we render the provider that will trigger all data hooks.
  return (
    <DataContext.Provider value={{}}>
        <AuthenticatedDataProvider>
            {children}
        </AuthenticatedDataProvider>
    </DataContext.Provider>
  );
}
