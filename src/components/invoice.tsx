

'use client';

import { format } from 'date-fns';
import numWords from 'num-words';
import type { LedgerEntry } from '@/lib/types';

interface InvoiceItem {
  name: string;
  group: string;
  quantity: number;
  price: number;
  amount: number;
}

interface InvoiceData {
  type: 'Sale' | 'Purchase';
  id: string;
  date: string;
  partner: {
    name: string;
    contact: string;
    balance: number;
  };
  items: InvoiceItem[];
  totalAmount: number;
  expenses?: number;
  paymentMethod: string;
  bankDetails?: {
    name: string;
    number: string;
  }
  recentTransactions?: LedgerEntry[];
}

const companyDetails = {
    name: 'Mianwali Petroleum Service',
    branch: 'Mianwali',
    mobile1: '03335425401',
    dealsIn: 'HSD, PREMIER, EURO 5',
    saleTaxNo: '0400046568661',
    ntn: '04656866',
    bank: {
        name: 'Bank Name Here',
        accountNo: 'Account Number Here',
        code: 'Bank Code Here'
    }
}

const InvoiceLogo = () => (
    <div className="flex items-center justify-center w-16 h-16 bg-primary text-white rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 13.1a2.5 2.5 0 0 0-2-3.1h-1a2.5 2.5 0 0 0-2 3.1"/>
            <path d="M12 3a8.8 8.8 0 0 0-8.8 8.8c0 4.9 3.9 11.2 8.8 11.2s8.8-6.3 8.8-11.2A8.8 8.8 0 0 0 12 3Z"/>
        </svg>
    </div>
);


export function Invoice({ data }: { data: InvoiceData }) {
    
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountWithExpenses = data.totalAmount + (data.expenses || 0);
  const totalAmountInWords = numWords(Math.floor(totalAmountWithExpenses));

  return (
    <div className="font-sans text-xs text-gray-800 bg-white p-2">
      <header className="pb-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                 <InvoiceLogo />
                 <div>
                    <h1 className="text-2xl font-bold text-gray-900">{companyDetails.name}</h1>
                    <p className="text-gray-600">{companyDetails.branch}</p>
                 </div>
            </div>
            <div className="text-right">
                <h2 className="text-3xl font-bold uppercase text-primary">{data.type} Invoice</h2>
            </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-gray-600">
            <div>
                 <p>{companyDetails.mobile1}</p>
                 <p>Deals in: {companyDetails.dealsIn}</p>
            </div>
             <div className="text-right">
                 <p><strong>NTN:</strong> {companyDetails.ntn}</p>
                 <p><strong>Sale Tax No:</strong> {companyDetails.saleTaxNo}</p>
            </div>
        </div>
      </header>
      
      <div className="my-4 h-px bg-gray-300" />

      <section className="grid grid-cols-2 gap-4 pb-4">
        <div>
            <p className="font-semibold text-gray-500 mb-1">BILL TO</p>
            <p className="font-bold text-base text-gray-900">{data.partner.name}</p>
            <p className="text-gray-600">{data.partner.contact}</p>
             {data.bankDetails && (
                <p className="text-gray-600">Bank: {data.bankDetails.name} ({data.bankDetails.number})</p>
             )}
        </div>
        <div className="text-right">
            <div className="grid grid-cols-2 gap-x-4">
                <span className="font-semibold">Invoice No:</span>
                <span>{data.id.slice(0, 8)}</span>
                <span className="font-semibold">Invoice Date:</span>
                <span>{format(new Date(data.date), 'dd-MMM-yyyy')}</span>
                <span className="font-semibold">Print Date:</span>
                <span>{format(new Date(), 'dd-MMM-yyyy')}</span>
            </div>
        </div>
      </section>

      <section className="mb-4">
        <table className="w-full border-collapse">
            <thead>
                <tr className="bg-gray-100 font-semibold text-gray-600">
                    <th className="p-2 text-left w-8 border-b-2 border-gray-200">#</th>
                    <th className="p-2 text-left border-b-2 border-gray-200">Item Name</th>
                    <th className="p-2 text-right border-b-2 border-gray-200">Quantity</th>
                    <th className="p-2 text-right border-b-2 border-gray-200">Price/Unit</th>
                    <th className="p-2 text-right border-b-2 border-gray-200">Amount</th>
                </tr>
            </thead>
            <tbody>
                {data.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-right">{item.quantity.toFixed(2)}</td>
                        <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                        <td className="p-2 text-right font-medium">{item.amount.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </section>

      <section className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
            <div>
                <h3 className="font-semibold text-gray-500 mb-1">Amount in Words</h3>
                <p className="capitalize font-medium">{totalAmountInWords} rupees only.</p>
            </div>
             <div>
                <h3 className="font-semibold text-gray-500 mb-1">Terms & Conditions</h3>
                <p>Thanks for doing business with us!</p>
            </div>
            {data.recentTransactions && data.recentTransactions.length > 0 && (
                <div className="print-only">
                    <h3 className="font-semibold text-gray-500 mb-1">Recent History</h3>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-1 text-left font-medium">Date</th>
                                <th className="p-1 text-left font-medium">Type</th>
                                <th className="p-1 text-right font-medium">Sale</th>
                                <th className="p-1 text-right font-medium">Paid</th>
                                <th className="p-1 text-right font-medium">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentTransactions.map(tx => (
                                <tr key={tx.id} className="border-b">
                                    <td className="p-1">{format(new Date(tx.timestamp), 'dd-MM-yy')}</td>
                                    <td className="p-1">{tx.type}</td>
                                    <td className="p-1 text-right">{tx.debit > 0 ? tx.debit.toFixed(2) : '-'}</td>
                                    <td className="p-1 text-right">{tx.credit > 0 ? tx.credit.toFixed(2) : '-'}</td>
                                    <td className="p-1 text-right font-semibold">{tx.balance.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        <div className="text-right">
             <table className="w-full">
                <tbody>
                    <tr>
                        <td className="p-1 pr-4 font-semibold text-gray-600">Sub Total:</td>
                        <td className="p-1 font-medium">{data.totalAmount.toFixed(2)}</td>
                    </tr>
                    {data.expenses && data.expenses > 0 && (
                        <tr>
                            <td className="p-1 pr-4 font-semibold text-gray-600">Purchase Expenses:</td>
                            <td className="p-1 font-medium">{data.expenses.toFixed(2)}</td>
                        </tr>
                    )}
                    <tr className="font-bold text-lg text-primary">
                        <td className="p-1 pr-4 border-t-2 border-b-2 border-primary/50">Total Payable:</td>
                        <td className="p-1 border-t-2 border-b-2 border-primary/50">RS {totalAmountWithExpenses.toFixed(2)}</td>
                    </tr>
                </tbody>
             </table>
        </div>
      </section>
      
       <footer className="mt-16">
        <div className="flex justify-between items-center">
            <div className="w-1/3 pt-8">
                <div className="border-t-2 border-gray-400 pt-1 text-center">
                    <p className="font-semibold">Signature</p>
                </div>
            </div>
        </div>
        <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-300">
            <p className="text-center text-xs text-gray-500">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </footer>
    </div>
  );
}
