
'use client';

import { useParams } from 'next/navigation';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { Invoice } from '@/components/invoice';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers } from '@/hooks/use-customers';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useBankAccounts } from '@/hooks/use-bank-accounts';

export default function InvoicePage() {
  const params = useParams();
  const { type, id } = params as { type: 'sale' | 'purchase'; id: string };

  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();

  const isLoaded = transactionsLoaded && purchasesLoaded && customersLoaded && suppliersLoaded && bankAccountsLoaded;

  let invoiceData = null;

  if (isLoaded) {
    if (type === 'sale') {
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        const customer = transaction.customerId ? customers.find(c => c.id === transaction.customerId) : null;
        const bankAccount = transaction.bankAccountId ? bankAccounts.find(b => b.id === transaction.bankAccountId) : null;
        invoiceData = {
          type: 'Sale',
          id: transaction.id!,
          date: transaction.timestamp!,
          partner: {
            name: transaction.customerName || 'Walk-in Customer',
            contact: customer?.contact || 'N/A',
            balance: 0, // Note: Balance calculation would be complex here, so keeping it simple.
          },
          items: transaction.items.map(item => ({
            name: `Fuel - ${item.fuelType}`,
            group: 'Fuel',
            quantity: item.volume,
            price: item.pricePerLitre,
            amount: item.totalAmount,
          })),
          totalAmount: transaction.totalAmount,
          paymentMethod: transaction.paymentMethod,
          bankDetails: bankAccount ? { name: bankAccount.bankName, number: bankAccount.accountNumber } : undefined,
        };
      }
    } else if (type === 'purchase') {
      const purchase = purchases.find(p => p.id === id);
      if (purchase) {
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        invoiceData = {
          type: 'Purchase',
          id: purchase.id!,
          date: purchase.timestamp!,
          partner: {
            name: purchase.supplier,
            contact: supplier?.contact || 'N/A',
            balance: 0,
          },
          items: [
            {
              name: `Fuel - ${purchase.fuelType}`,
              group: 'Fuel',
              quantity: purchase.volume,
              price: purchase.totalCost / purchase.volume,
              amount: purchase.totalCost,
            },
          ],
          totalAmount: purchase.totalCost,
          paymentMethod: 'Credit', // Purchases are assumed to be on credit
        };
      }
    }
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-end gap-2 print:hidden">
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
        </div>
        <div className="bg-white dark:bg-card shadow-lg rounded-lg p-8">
            {isLoaded && invoiceData ? (
                <Invoice data={invoiceData} />
            ) : isLoaded && !invoiceData ? (
                <div className="text-center text-red-500">Invoice not found.</div>
            ) : (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
