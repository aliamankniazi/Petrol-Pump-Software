
'use client';

import { useCallback } from 'react';
import { useTransactions } from './use-transactions';
import { usePurchases } from './use-purchases';
import { useExpenses } from './use-expenses';
import { useCustomers } from './use-customers';
import { useSuppliers } from './use-suppliers';
import { usePurchaseReturns } from './use-purchase-returns';
import { useOtherIncomes } from './use-other-incomes';
import { useBankAccounts } from './use-bank-accounts';
import { useEmployees } from './use-employees';
import { useCustomerPayments } from './use-customer-payments';
import { useSupplierPayments } from './use-supplier-payments';
import { useCashAdvances } from './use-cash-advances';
import { useTankReadings } from './use-tank-readings';
import { useInvestments } from './use-investments';
import { useBusinessPartners } from './use-business-partners';
import { useDatabaseCollection } from './use-database-collection';

// A simple hook to clear all data from all collections.
// It re-uses the clearCollection function from useDatabaseCollection.
export function useSettings() {
    const { clearCollection: clearTransactions } = useDatabaseCollection('transactions');
    const { clearCollection: clearPurchases } = useDatabaseCollection('purchases');
    const { clearCollection: clearExpenses } = useDatabaseCollection('expenses');
    const { clearCollection: clearCustomers } = useDatabaseCollection('customers');
    const { clearCollection: clearSuppliers } = useDatabaseCollection('suppliers');
    const { clearCollection: clearPurchaseReturns } = useDatabaseCollection('purchase-returns');
    const { clearCollection: clearOtherIncomes } = useDatabaseCollection('other-incomes');
    const { clearCollection: clearBankAccounts } = useDatabaseCollection('bank-accounts');
    const { clearCollection: clearEmployees } = useDatabaseCollection('employees');
    const { clearCollection: clearCustomerPayments } = useDatabaseCollection('customer-payments');
    const { clearCollection: clearSupplierPayments } = useDatabaseCollection('supplier-payments');
    const { clearCollection: clearCashAdvances } = useDatabaseCollection('cash-advances');
    const { clearCollection: clearTankReadings } = useDatabaseCollection('tank-readings');
    const { clearCollection: clearInvestments } = useDatabaseCollection('investments');
    const { clearCollection: clearBusinessPartners } = useDatabaseCollection('business-partners');
    const { clearCollection: clearSettings } = useDatabaseCollection('settings');

    const clearAllData = useCallback(async () => {
        const allClearPromises = [
            clearTransactions(),
            clearPurchases(),
            clearExpenses(),
            clearCustomers(),
            clearSuppliers(),
            clearPurchaseReturns(),
            clearOtherIncomes(),
            clearBankAccounts(),
            clearEmployees(),
            clearCustomerPayments(),
            clearSupplierPayments(),
            clearCashAdvances(),
            clearTankReadings(),
            clearInvestments(),
            clearBusinessPartners(),
            clearSettings(),
        ];
        
        await Promise.all(allClearPromises);

        // Force a page reload to reset all state and start fresh.
        window.location.reload();
    }, [
        clearTransactions, clearPurchases, clearExpenses, clearCustomers,
        clearSuppliers, clearPurchaseReturns, clearOtherIncomes, clearBankAccounts,
        clearEmployees, clearCustomerPayments, clearSupplierPayments, clearCashAdvances,
        clearTankReadings, clearInvestments, clearBusinessPartners, clearSettings
    ]);

    return {
        clearAllData,
    };
}
