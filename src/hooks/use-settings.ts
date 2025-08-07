
'use client';

import { useCallback } from 'react';
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
