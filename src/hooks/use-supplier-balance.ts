
'use client';

import { useMemo } from 'react';
import { usePurchases } from '@/hooks/use-purchases';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';

/**
 * A custom hook to calculate the current balance for a specific supplier.
 * It sums up all their purchases (credit) and subtracts all payments made to them (debit).
 * @param supplierId The ID of the supplier to calculate the balance for.
 * @returns An object containing the calculated balance and a loading state.
 */
export function useSupplierBalance(supplierId: string | null) {
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { supplierPayments, isLoaded: paymentsLoaded } = useSupplierPayments();

  const isLoaded = purchasesLoaded && paymentsLoaded;

  const balance = useMemo(() => {
    if (!supplierId || !isLoaded) {
      return 0;
    }

    const supplierPurchases = purchases
      .filter(p => p.supplierId === supplierId)
      .reduce((sum, p) => sum + p.totalCost, 0);

    const paymentsToSupplier = supplierPayments
      .filter(p => p.supplierId === supplierId)
      .reduce((sum, p) => sum + p.amount, 0);
      
    // Positive balance means we owe the supplier money
    return supplierPurchases - paymentsToSupplier;

  }, [supplierId, purchases, supplierPayments, isLoaded]);

  return { balance, isLoaded };
}
