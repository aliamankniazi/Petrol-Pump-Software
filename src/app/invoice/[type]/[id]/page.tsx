

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
import { format } from 'date-fns';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 448 512"
      {...props}
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 .9c34.9 0 67.7 13.5 92.8 38.6 25.1 25.1 38.6 57.9 38.6 92.8 0 97.8-79.7 177.6-177.6 177.6-34.9 0-67.7-13.5-92.8-38.6s-38.6-57.9-38.6-92.8c0-97.8 79.7-177.6 177.6-177.6zm93.8 148.6c-3.3-1.5-19.8-9.8-23-11.5s-5.5-2.5-7.8 2.5c-2.3 5-8.7 11.5-10.7 13.8s-3.9 2.5-7.3 1c-3.3-1.5-14-5.2-26.6-16.5c-9.9-8.9-16.5-19.8-18.5-23s-2-5.5-.6-7.5c1.4-2 3-3.3 4.5-5.2s3-4.2 4.5-7.1c1.5-2.8.8-5.2-.4-6.8s-7.8-18.5-10.7-25.4c-2.8-6.8-5.6-5.8-7.8-5.8s-4.5-.4-6.8-.4-7.8 1.1-11.8 5.5c-4 4.4-15.2 14.8-15.2 36.1s15.5 41.9 17.5 44.8c2 2.8 30.4 46.4 73.8 65.4 10.8 4.8 19.3 7.6 25.9 9.8s11.1 1.5 15.2 1c4.8-.7 19.8-8.2 22.5-16.1s2.8-14.8 2-16.1c-.8-1.5-3.3-2.5-6.8-4z"></path>
    </svg>
);


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
      if (!transaction) return null;

        const customer = transaction.customerId ? customers.find(c => c.id === transaction.customerId) : null;
        const bankAccount = transaction.bankAccountId ? bankAccounts.find(b => b.id === transaction.bankAccountId) : null;
        
        let recentHistory: Omit<LedgerEntry, 'balance'>[] = [];
        // Only fetch history if it's not a walk-in customer
        if(customer) {
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
            
            recentHistory = customerLedgerEntries
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10);
        }
            
        return {
          type: 'Sale' as 'Sale' | 'Purchase',
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
          type: 'Purchase' as 'Sale' | 'Purchase',
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
  
  const generateWhatsAppMessage = () => {
    if (!invoiceData) return '';
    const itemsSummary = invoiceData.items.map(item => 
        `- ${item.name}: ${item.quantity.toFixed(2)} x ${item.price.toFixed(2)} = ${item.amount.toFixed(2)}`
    ).join('\n');

    const message = `*Invoice from Mianwali Petroleum Service*

*Invoice No:* ${invoiceData.id.slice(0, 8).toUpperCase()}
*Date:* ${format(new Date(invoiceData.date), 'PP')}

*To:* ${invoiceData.partner.name}

*Items:*
${itemsSummary}

*Total Amount: PKR ${invoiceData.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}*

Thank You!`;
    return encodeURIComponent(message);
  };
  
  const formatPhoneNumberForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  }

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
            {invoiceData?.partner.contact && (
                <Button asChild variant="secondary" disabled={!invoiceData}>
                    <a
                        href={`https://wa.me/${formatPhoneNumberForWhatsApp(invoiceData.partner.contact)}?text=${generateWhatsAppMessage()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white"
                    >
                        <WhatsAppIcon className="mr-2 h-4 w-4" />
                        Send to WhatsApp
                    </a>
                </Button>
            )}
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
