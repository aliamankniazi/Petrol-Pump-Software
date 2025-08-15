

export interface LedgerEntry {
  id: string;
  timestamp: string;
  description: string;
  type: 'Sale' | 'Payment' | 'Cash Advance' | 'Purchase' | 'Supplier Payment' | 'Investment' | 'Withdrawal' | 'Salary';
  debit: number;
  credit: number;
  balance: number;
};

// A more specific type for sale items, which may have different properties than purchase items
export interface SaleItem {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    discount?: number;
    bonus?: number;
    timestamp?: string;
    gst?: number;
}

export type FuelType = 'Unleaded' | 'Premium' | 'Diesel';

export type PaymentMethod = 'Cash' | 'Bank' | 'Mobile' | 'On Credit';

export interface SubUnit {
  name: string;
  conversionRate: number; // How many sub-units make one main unit
  purchasePrice?: number;
  tradePrice?: number;
  retailPrice?: number;
}

export interface Product {
    id?: string;
    name: string;
    category?: 'Fuel' | 'Lubricant' | 'Other' | null;
    productCode?: string | null;
    barcode?: string | null;
    productGroupId?: string | null;
    companyId?: string | null;
    mainUnit: string;
    purchasePrice: number;
    tradePrice: number;
    retailPrice: number;
    stock: number; // Stock in main units
    subUnitStock?: number; // Stock in sub-units
    subUnit?: SubUnit | null;
    timestamp?: string;
}


export interface TransactionItem {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    timestamp?: string;
}

export interface Transaction {
  id?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  timestamp?: string;
  customerId?: string;
  customerName?: string;
  bankAccountId?: string;
  paidAmount?: number;
  expenseAmount?: number;
  date: Date;
}

export interface PurchaseItem {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
    discount?: number;
}

export interface Purchase {
  id?: string;
  supplierId: string;
  supplier: string;
  items: PurchaseItem[];
  totalCost: number;
  expenses?: number;
  notes?: string;
  timestamp?: string;
  paidAmount?: number;
  date: Date;
}

export interface PurchaseReturn {
  id?: string;
  supplierId: string;
  supplier: string;
  productId: string;
  productName: string;
  volume: number;
  totalRefund: number;
  reason: string;
  timestamp?: string;
  date: Date;
}

export type ExpenseCategory = 'Utilities' | 'Salaries' | 'Maintenance' | 'Other';

export interface Expense {
  id?: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  timestamp?: string;
  employeeId?: string; // Link to employee for salary payments
  date: Date;
  notes?: string;
}

export type OtherIncomeCategory = 'Service Station' | 'Tire Shop' | 'Tuck Shop' | 'Other';

export interface OtherIncome {
    id?: string;
    description: string;
    category: OtherIncomeCategory;
    amount: number;
    timestamp?: string;
    date: Date;
}

export interface Customer {
  id?: string;
  name: string;
  contact: string;
  vehicleNumber?: string;
  area?: string;
  isPartner?: boolean;
  sharePercentage?: number; // Only for partners
  isEmployee?: boolean;
  timestamp?: string;
}

export interface Supplier {
  id?: string;
  name: string;
  contact?: string;
  timestamp?: string;
}

export interface BankAccount {
  id?: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  timestamp?: string;
}

export interface Employee {
  id?: string;
  name: string;
  mobileNumber?: string;
  position: string;
  salary: number;
  hireDate: string;
  timestamp?: string;
}

export interface CustomerPayment {
  id?: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: Extract<PaymentMethod, 'Cash' | 'Bank' | 'Mobile'>;
  timestamp?: string;
  notes?: string;
  date: Date;
}

export interface SupplierPayment {
  id?: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: Extract<PaymentMethod, 'Cash' | 'Bank' | 'Mobile'>;
  timestamp?: string;
  isSalary?: boolean; // Custom flag to identify salary payments
  date: Date;
}

export interface CashAdvance {
  id?: string;
  customerId: string;
  customerName: string;
  amount: number;
  notes?: string;
  timestamp?: string;
  date: Date;
}

export interface TankReading {
    id?: string;
    productId: string; 
    fuelType: FuelType; 
    meterReading: number;
    previousMeterReading: number;
    calculatedUsage: number;
    salesSinceLastReading: number;
    variance: number;
    timestamp: string;
}

export interface Investment {
  id?: string;
  partnerId: string;
  partnerName: string;
  type: 'Investment' | 'Withdrawal';
  amount: number;
  notes?: string;
  timestamp?: string;
  date: Date;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Paid Leave';

export interface Attendance {
  id?: string;
  employeeId: string;
  employeeName: string;
  date: string; // ISO date string YYYY-MM-DD
  status: AttendanceStatus;
  timestamp?: string;
}
