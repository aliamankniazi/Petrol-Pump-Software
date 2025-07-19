
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

export function useSettings() {
  const { clearTransactions } = useTransactions();
  const { clearPurchases } = usePurchases();
  const { clearPurchaseReturns } = usePurchaseReturns();
  const { clearExpenses } = useExpenses();
  const { clearCustomers } = useCustomers();
  const { clearSuppliers } = useSuppliers();
  const { clearBankAccounts } = useBankAccounts();
  const { clearEmployees } = useEmployees();
  const { clearFuelPrices } = useFuelPrices();
  const { clearFuelStock } = useFuelStock();
  const { clearCustomerPayments } = useCustomerPayments();
  const { clearCashAdvances } = useCashAdvances();
  const { clearOtherIncomes } = useOtherIncomes();
  const { clearTankReadings } = useTankReadings();
  const { clearSupplierPayments } = useSupplierPayments();
  const { clearInvestments } = useInvestments();

  const clearAllData = () => {
    clearTransactions();
    clearPurchases();
    clearPurchaseReturns();
    clearExpenses();
    clearCustomers();
    clearSuppliers();
    clearBankAccounts();
    clearEmployees();
    clearFuelPrices();
    clearFuelStock();
    clearCustomerPayments();
    clearCashAdvances();
    clearOtherIncomes();
    clearTankReadings();
    clearSupplierPayments();
    clearInvestments();
  };

  return {
    clearAllData,
  };
}
