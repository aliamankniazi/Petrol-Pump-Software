

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
import { useSupplierPayments } from '@/hooks/use-supplier-payments';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';


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
  const { supplierPayments, isLoaded: supplierPaymentsLoaded } = useSupplierPayments();
  const { purchaseReturns, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();


  const isLoaded = transactionsLoaded && purchasesLoaded && customersLoaded && suppliersLoaded && bankAccountsLoaded && productsLoaded && paymentsLoaded && advancesLoaded && supplierPaymentsLoaded && purchaseReturnsLoaded;

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


  const invoiceData = useMemo(() => {
    if (!isLoaded) return null;

    if (type === 'sale') {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction || !transaction.customerId) return null;

        const customer = customers.find(c => c.id === transaction.customerId);
        const bankAccount = transaction.bankAccountId ? bankAccounts.find(b => b.id === transaction.bankAccountId) : null;
        
        // Gather all ledger entries for this customer
        const customerLedgerEntries: Omit<LedgerEntry, 'balance'>[] = [];
        transactions.filter(tx => tx.customerId === transaction.customerId).forEach(tx => {
            customerLedgerEntries.push({ id: `tx-${tx.id}`, timestamp: tx.timestamp!, description: `Sale (Invoice #${tx.id?.slice(0,6)})`, type: 'Sale', debit: tx.totalAmount, credit: 0 });
        });
        customerPayments.filter(p => p.customerId === transaction.customerId).forEach(p => {
            customerLedgerEntries.push({ id: `pay-${p.id}`, timestamp: p.timestamp!, description: `Payment Received`, type: 'Payment', debit: 0, credit: p.amount });
        });
        cashAdvances.filter(ca => ca.customerId === transaction.customerId).forEach(ca => {
            customerLedgerEntries.push({ id: `adv-${ca.id}`, timestamp: ca.timestamp!, description: 'Cash Advance', type: 'Cash Advance', debit: ca.amount, credit: 0 });
        });
        
        const recentHistory = customerLedgerEntries
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
            
        return {
          type: 'Sale',
          id: transaction.id!,
          date: transaction.timestamp!,
          partner: {
            name: transaction.customerName || 'Walk-in Customer',
            contact: customer?.contact || 'N/A',
            area: customer?.area,
            balance: 0, 
            vehicleNumber: transaction.vehicleNumber,
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
          notes: transaction.notes,
          history: recentHistory,
        };
      
    } else if (type === 'purchase') {
      const purchase = purchases.find(p => p.id === id);
      if (purchase) {
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        
        // Gather all ledger entries for this supplier
        const supplierLedgerEntries: Omit<LedgerEntry, 'balance'>[] = [];
        purchases.filter(p => p.supplierId === purchase.supplierId).forEach(p => {
            supplierLedgerEntries.push({ id: `pur-${p.id}`, timestamp: p.timestamp!, description: `Purchase (Invoice #${p.id?.slice(0,6)})`, type: 'Purchase', debit: 0, credit: p.totalCost });
        });
        supplierPayments.filter(sp => sp.supplierId === purchase.supplierId).forEach(sp => {
            supplierLedgerEntries.push({ id: `spay-${sp.id}`, timestamp: sp.timestamp!, description: 'Payment Made', type: 'Supplier Payment', debit: sp.amount, credit: 0 });
        });
        purchaseReturns.filter(pr => pr.supplierId === purchase.supplierId).forEach(pr => {
            supplierLedgerEntries.push({ id: `pret-${pr.id}`, timestamp: pr.timestamp!, description: 'Purchase Return', type: 'Purchase Return', debit: pr.totalRefund, credit: 0 });
        });

        const recentHistory = supplierLedgerEntries
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
            
        return {
          type: 'Purchase',
          id: purchase.id!,
          date: purchase.timestamp!,
          partner: {
            name: purchase.supplier,
            contact: supplier?.contact || 'N/A',
            area: '',
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
          history: recentHistory,
        };
      }
    }
    return null;
  }, [isLoaded, type, id, transactions, purchases, customers, suppliers, bankAccounts, products, customerPayments, cashAdvances, supplierPayments, purchaseReturns]);
  
  useEffect(() => {
    // This effect handles the auto-printing functionality.
    // It waits until the invoice data is fully loaded before attempting to print.
    if (invoiceData && searchParams.get('print') === 'true') {
        const printTimeout = setTimeout(() => {
            window.print();
        }, 500); // A small delay to ensure the page has rendered.

        return () => clearTimeout(printTimeout);
    }
  }, [invoiceData, searchParams]);

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
