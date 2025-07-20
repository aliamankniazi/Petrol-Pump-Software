
'use client';

import { format } from 'date-fns';
import numWords from 'num-words';

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
  paymentMethod: string;
  bankDetails?: {
    name: string;
    number: string;
  }
}

const companyDetails = {
    name: 'Mianwali Petroleum Service',
    branch: 'Mianwali',
    mobile1: '03335425401',
    mobile2: '03335425401',
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
    <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 8h.01"></path>
            <path d="M6 8h.01"></path>
            <path d="M10 4h.01"></path>
            <path d="M18 8h.01"></path>
            <path d="m3 22 1.3-1.3a1.5 1.5 0 0 0 0-2.1L3 17"></path>
            <path d="m19 17-1.3 1.3a1.5 1.5 0 0 0 0 2.1L19 22"></path>
            <path d="M10 18h4"></path>
            <path d="M12 14v4"></path>
            <path d="M10 10h.01"></path>
            <path d="M14 10h.01"></path>
        </svg>
    </div>
);


export function Invoice({ data }: { data: InvoiceData }) {
    
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountInWords = numWords(Math.floor(data.totalAmount));

  return (
    <div className="font-sans text-xs text-gray-800">
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-300">
        <div className="flex items-start gap-4">
            <InvoiceLogo />
            <div>
                <h1 className="text-xl font-bold text-gray-900">{companyDetails.name}</h1>
                <p>Branch: {companyDetails.branch}</p>
                <p>Mobile No1: {companyDetails.mobile1}</p>
                <p>Mobile No2: {companyDetails.mobile2}</p>
                <p className="font-semibold">Deals in: {companyDetails.dealsIn}</p>
                <p>Sale Tax Registration No. {companyDetails.saleTaxNo}</p>
            </div>
        </div>
        <div className="text-right flex-shrink-0">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">{data.type.toUpperCase()} INVOICE</h2>
            <p className="font-semibold">NTN NO: {companyDetails.ntn}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 py-4">
        <div>
            <h3 className="font-bold mb-1">Bill To:</h3>
            <p className="font-semibold">{data.partner.name}</p>
            <p>Contact No.: {data.partner.contact}</p>
             {data.bankDetails && (
                <p>Bank: {data.bankDetails.name} ({data.bankDetails.number})</p>
             )}
        </div>
        <div className="text-right">
            <p><span className="font-semibold">Invoice No.:</span> {data.id.slice(0, 8)}</p>
            <p><span className="font-semibold">Date:</span> {format(new Date(data.date), 'dd-MM-yyyy')}</p>
            <p><span className="font-semibold">Print Date:</span> {format(new Date(), 'dd-MM-yyyy')}</p>
        </div>
      </section>

      <section className="mb-4">
        <table className="w-full">
            <thead className="bg-blue-600 text-white">
                <tr>
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Item name</th>
                    <th className="p-2 text-left">Group</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2 text-right">Price/Unit</th>
                    <th className="p-2 text-right">Discount</th>
                    <th className="p-2 text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                {data.items.map((item, index) => (
                    <tr key={index} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.group}</td>
                        <td className="p-2 text-right">{item.quantity.toFixed(3)} LTR</td>
                        <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                        <td className="p-2 text-right">0.00%</td>
                        <td className="p-2 text-right">{item.amount.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="font-bold">
                <tr className="border-b-2 border-gray-300">
                    <td colSpan={3} className="p-2 text-left">Total</td>
                    <td className="p-2 text-right">{totalQuantity.toFixed(3)}</td>
                    <td colSpan={2}></td>
                    <td className="p-2 text-right">{data.totalAmount.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div>
            <h3 className="font-bold mb-1">Description</h3>
            <p>{data.partner.name} - {data.items[0]?.name || ''}</p>
            <h3 className="font-bold mt-4 mb-1">TERMS AND CONDITIONS</h3>
            <p>Thanks for doing business with us!</p>
            <p className="font-bold mt-4">Amount in Words:</p>
            <p className="capitalize">{totalAmountInWords} rupees only.</p>
        </div>
        <div className="text-right">
            <div className="inline-block text-left">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="font-semibold">Sub Total:</span>
                    <span>RS {data.totalAmount.toFixed(2)}</span>
                    <span className="font-semibold">Discount:</span>
                    <span>RS 0 (0%)</span>
                    <span className="font-semibold">GST@:</span>
                    <span>0</span>
                    <span className="font-bold text-lg border-t-2 border-b-2 border-gray-800 py-1">Total Payable:</span>
                    <span className="font-bold text-lg border-t-2 border-b-2 border-gray-800 py-1">RS {data.totalAmount.toFixed(2)}</span>
                    <span className="font-semibold">Paid:</span>
                    <span>RS 0.00</span>
                    <span className="font-semibold">Invoice Balance:</span>
                    <span>RS {data.totalAmount.toFixed(2)}</span>
                    <span className="font-semibold">Payment Mode:</span>
                    <span>{data.paymentMethod}</span>
                </div>
            </div>
        </div>
      </section>

      <footer className="grid grid-cols-2 gap-4 pt-8 mt-8 border-t-2 border-gray-300">
        <div>
            <h3 className="font-bold">Pay To:</h3>
            <p>Bank Name: {companyDetails.bank.name}</p>
            <p>Bank Account No.: {companyDetails.bank.accountNo}</p>
            <p>Bank code: {companyDetails.bank.code}</p>
        </div>
        <div className="text-center">
            <div className="w-48 h-16 border mx-auto mb-1"></div>
            <p className="border-t border-gray-800 pt-1">Authorized Signatory</p>
        </div>
      </footer>
    </div>
  );
}
