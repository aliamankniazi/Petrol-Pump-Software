

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
    area?: string;
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
  notes?: string;
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
    <div className="flex items-center justify-center w-20 h-20 bg-primary text-white rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 13.1a2.5 2.5 0 0 0-2-3.1h-1a2.5 2.5 0 0 0-2 3.1"/>
            <path d="M12 3a8.8 8.8 0 0 0-8.8 8.8c0 4.9 3.9 11.2 8.8 11.2s8.8-6.3 8.8-11.2A8.8 8.8 0 0 0 12 3Z"/>
        </svg>
    </div>
);


export function Invoice({ data }: { data: InvoiceData }) {
    
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountWithExpenses = (data.totalAmount || 0) + (data.expenses || 0);
  const totalAmountInWords = numWords(Math.floor(totalAmountWithExpenses));

  return (
    <div className="font-sans text-sm text-gray-900 bg-white p-4 print:p-0">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b-4 border-gray-800">
            <div className="flex items-center gap-4">
                 <InvoiceLogo />
                 <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{companyDetails.name}</h1>
                    <p className="text-gray-600 font-medium">{companyDetails.branch}</p>
                    <p className="text-gray-500 text-xs mt-1">Deals in: {companyDetails.dealsIn}</p>
                 </div>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold uppercase text-gray-800">{data.type}</h2>
                <p className="text-gray-500">Invoice No: <span className="font-semibold">{data.id.slice(0, 8).toUpperCase()}</span></p>
            </div>
        </header>

        {/* Details Section */}
        <section className="grid grid-cols-2 gap-4 py-4">
            <div>
                <p className="font-semibold text-gray-500 mb-1">Bill To:</p>
                <p className="font-bold text-base text-gray-900">{data.partner.name}</p>
                {data.partner.contact && <p className="text-gray-600">{data.partner.contact}</p>}
                {data.partner.area && <p className="text-gray-600">{data.partner.area}</p>}
                {data.bankDetails && (
                    <p className="text-gray-600 text-xs">Bank: {data.bankDetails.name} ({data.bankDetails.number})</p>
                )}
            </div>
            <div className="text-right">
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <span className="font-semibold text-gray-600">Invoice Date:</span>
                    <span className="font-medium">{format(new Date(data.date), 'dd MMM, yyyy')}</span>
                    <span className="font-semibold text-gray-600">Print Date:</span>
                    <span className="font-medium">{format(new Date(), 'dd MMM, yyyy')}</span>
                    <span className="font-semibold text-gray-600">Payment Method:</span>
                    <span className="font-medium">{data.paymentMethod}</span>
                 </div>
            </div>
        </section>

        {/* Items Table */}
        <section className="mb-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-800 text-white">
                    <tr>
                        <th className="p-2 text-left w-10">#</th>
                        <th className="p-2 text-left">Item Description</th>
                        <th className="p-2 text-right w-28">Quantity</th>
                        <th className="p-2 text-right w-28">Unit Price</th>
                        <th className="p-2 text-right w-32">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 last:border-b-0">
                            <td className="p-2 text-center">{index + 1}</td>
                            <td className="p-2 font-medium">{item.name}</td>
                            <td className="p-2 text-right font-mono">{(item.quantity || 0).toFixed(2)}</td>
                            <td className="p-2 text-right font-mono">{(item.price || 0).toFixed(2)}</td>
                            <td className="p-2 text-right font-semibold font-mono">{(item.amount || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </section>

        {/* Totals Section */}
        <section className="grid grid-cols-3 gap-8 items-start">
            <div className="col-span-2 space-y-4">
                 <div>
                    <h3 className="font-semibold text-gray-500 mb-1">Amount in Words:</h3>
                    <p className="capitalize font-medium text-gray-800">{totalAmountInWords} rupees only.</p>
                </div>
                 {data.notes && (
                    <div>
                        <h3 className="font-semibold text-gray-500 mb-1">Notes:</h3>
                        <p className="text-gray-800 text-xs italic border-l-2 border-gray-300 pl-2">{data.notes}</p>
                    </div>
                )}
            </div>
            <div className="col-span-1">
                <table className="w-full">
                    <tbody>
                        <tr>
                            <td className="p-1 pr-4 font-semibold text-gray-600">Sub Total:</td>
                            <td className="p-1 font-medium text-right font-mono">{(data.totalAmount || 0).toFixed(2)}</td>
                        </tr>
                        {data.expenses && data.expenses > 0 && (
                            <tr>
                                <td className="p-1 pr-4 font-semibold text-gray-600">Expenses:</td>
                                <td className="p-1 font-medium text-right font-mono">{(data.expenses || 0).toFixed(2)}</td>
                            </tr>
                        )}
                        <tr className="font-bold text-lg text-gray-900">
                            <td className="p-2 pr-4 border-t-2 border-b-2 border-gray-800">Grand Total:</td>
                            <td className="p-2 border-t-2 border-b-2 border-gray-800 text-right font-mono">PKR {totalAmountWithExpenses.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8">
            <div className="flex justify-between items-center">
                <div className="w-1/3">
                    <p><strong>NTN:</strong> {companyDetails.ntn}</p>
                    <p><strong>GST:</strong> {companyDetails.saleTaxNo}</p>
                </div>
                <div className="w-1/3 text-center">
                    <p className="text-gray-500">Thank you for your business!</p>
                </div>
                <div className="w-1/3 text-right">
                    <div className="inline-block pt-8 text-center">
                        <div className="border-t-2 border-gray-400 pt-1 w-48">
                            <p className="font-semibold">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>
             <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-300">
                <p className="text-center text-xs text-gray-500">
                    This is a computer-generated invoice and does not require a signature. If you have any questions, please contact us at {companyDetails.mobile1}.
                </p>
            </div>
        </footer>
    </div>
  );
}
