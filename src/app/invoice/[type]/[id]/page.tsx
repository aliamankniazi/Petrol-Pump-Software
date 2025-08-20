

'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { Invoice } from '@/components/invoice';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers } from '@/hooks/use-customers';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { useProducts } from '@/hooks/use-products';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import type { LedgerEntry } from '@/lib/types';


export default function InvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { type, id } = params as { type: 'sale' | 'purchase'; id: string };

  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { cashAdvances, isLoaded: advancesLoaded } = useCashAdvances();


  const isLoaded = transactionsLoaded && purchasesLoaded && customersLoaded && suppliersLoaded && bankAccountsLoaded && productsLoaded && paymentsLoaded && advancesLoaded;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.push('/transactions');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  useEffect(() => {
    if (isLoaded && searchParams.get('print') === 'true') {
      const transaction = transactions.find(t => t.id === id);
      const purchase = purchases.find(p => p.id === id);
      if (transaction || purchase) {
        window.print();
      }
    }
  }, [isLoaded, searchParams, transactions, purchases, id]);

  const invoiceData = useMemo(() => {
    if (!isLoaded) return null;

    if (type === 'sale') {
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        const customer = transaction.customerId ? customers.find(c => c.id === transaction.customerId) : null;
        const bankAccount = transaction.bankAccountId ? bankAccounts.find(b => b.id === transaction.bankAccountId) : null;
        
        let recentLedger: LedgerEntry[] = [];
        if (customer) {
            const combined: Omit<LedgerEntry, 'balance'>[] = [];
            const customerTransactions = transactions.filter(tx => tx.customerId === customer.id && tx.timestamp);
            const customerPaymentsReceived = customerPayments.filter(p => p.customerId === customer.id && p.timestamp);
            const customerCashAdvances = cashAdvances.filter(ca => ca.customerId === customer.id && ca.timestamp);

            customerTransactions.forEach(tx => combined.push({
                id: `tx-${tx.id}`,
                timestamp: tx.timestamp!,
                description: 'Sale',
                type: 'Sale',
                debit: tx.totalAmount,
                credit: 0,
            }));
            customerPaymentsReceived.forEach(p => combined.push({
                id: `pay-${p.id}`,
                timestamp: p.timestamp!,
                description: 'Payment',
                type: 'Payment',
                debit: 0,
                credit: p.amount,
            }));
            customerCashAdvances.forEach(ca => combined.push({
                id: `adv-${ca.id}`,
                timestamp: ca.timestamp!,
                description: 'Cash Advance',
                type: 'Cash Advance',
                debit: ca.amount,
                credit: 0,
            }));

            combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            let runningBalance = 0;
            const entriesWithBalance: LedgerEntry[] = combined.map(entry => {
                runningBalance += entry.debit - entry.credit;
                return { ...entry, balance: runningBalance };
            });
            recentLedger = entriesWithBalance.slice(-10);
        }

        return {
          type: 'Sale',
          id: transaction.id!,
          date: transaction.timestamp!,
          partner: {
            name: transaction.customerName || 'Walk-in Customer',
            contact: customer?.contact || 'N/A',
            balance: 0, 
          },
          items: transaction.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                name: item.productName,
                group: product?.category || 'General',
                quantity: item.quantity,
                price: item.pricePerUnit,
                amount: item.totalAmount,
            }
          }),
          totalAmount: transaction.totalAmount,
          expenses: transaction.expenseAmount,
          paymentMethod: transaction.paymentMethod,
          bankDetails: bankAccount ? { name: bankAccount.bankName, number: bankAccount.accountNumber } : undefined,
          recentTransactions: recentLedger,
          notes: transaction.notes,
        };
      }
    } else if (type === 'purchase') {
      const purchase = purchases.find(p => p.id === id);
      if (purchase) {
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        return {
          type: 'Purchase',
          id: purchase.id!,
          date: purchase.timestamp!,
          partner: {
            name: purchase.supplier,
            contact: supplier?.contact || 'N/A',
            balance: 0,
          },
          items: purchase.items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return {
                  name: item.productName,
                  group: product?.category || 'General',
                  quantity: item.quantity,
                  price: item.costPerUnit,
                  amount: item.totalCost,
              }
          }),
          totalAmount: purchase.totalCost,
          expenses: purchase.expenses,
          paymentMethod: 'Credit', // Purchases are assumed to be on credit
          notes: purchase.notes,
        };
      }
    }
    return null;
  }, [isLoaded, type, id, transactions, purchases, customers, suppliers, bankAccounts, products, customerPayments, cashAdvances]);

  const renderContent = () => {
    if (!isLoaded) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (invoiceData) {
      return <Invoice data={invoiceData} />;
    }
    
    return <div className="text-center text-red-500 font-bold p-10">Invoice not found.</div>;
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-end gap-2 print:hidden">
            <Button onClick={() => window.print()} disabled={!invoiceData}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
        </div>
        <div className="bg-white dark:bg-card shadow-lg rounded-lg p-8">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
