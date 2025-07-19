export type FuelType = 'Unleaded' | 'Premium' | 'Diesel';

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile';

export interface Transaction {
  id: string;
  fuelType: FuelType;
  volume: number;
  pricePerLitre: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  customerId?: string;
  customerName?: string;
}

export interface Purchase {
  id: string;
  supplier: string;
  fuelType: FuelType;
  volume: number;
  totalCost: number;
  timestamp: string;
}

export interface PurchaseReturn {
  id: string;
  supplier: string;
  fuelType: FuelType;
  volume: number;
  totalRefund: number;
  reason: string;
  timestamp: string;
}

export type ExpenseCategory = 'Utilities' | 'Salaries' | 'Maintenance' | 'Other';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  timestamp: string;
}

export type OtherIncomeCategory = 'Service Station' | 'Tire Shop' | 'Tuck Shop' | 'Other';

export interface OtherIncome {
    id: string;
    description: string;
    category: OtherIncomeCategory;
    amount: number;
    timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  vehicleNumber?: string;
  timestamp: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  timestamp: string;
}

export interface Employee {
  id: string;
  name: string;
  mobileNumber?: string;
  position: string;
  salary: number;
  hireDate: string;
  timestamp: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
}

export interface CashAdvance {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  notes?: string;
  timestamp: string;
}

export interface AuthFormValues {
  email: string;
  password: string;
}
