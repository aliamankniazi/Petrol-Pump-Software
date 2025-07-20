
export type FuelType = 'Unleaded' | 'Premium' | 'Diesel';

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile' | 'Salary';

export interface Transaction {
  id: string;
  fuelType: FuelType;
  volume: number;
  pricePerLitre: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  timestamp: number;
  customerId?: string;
  customerName?: string;
  bankAccountId?: string;
  bankAccountName?: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier: string;
  fuelType: FuelType;
  volume: number;
  totalCost: number;
  timestamp: number;
}

export interface PurchaseReturn {
  id: string;
  supplierId: string;
  supplier: string;
  fuelType: FuelType;
  volume: number;
  totalRefund: number;
  reason: string;
  timestamp: number;
}

export type ExpenseCategory = 'Utilities' | 'Salaries' | 'Maintenance' | 'Other';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  timestamp: number;
}

export type OtherIncomeCategory = 'Service Station' | 'Tire Shop' | 'Tuck Shop' | 'Other';

export interface OtherIncome {
    id: string;
    description: string;
    category: OtherIncomeCategory;
    amount: number;
    timestamp: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  vehicleNumber?: string;
  area?: string;
  isPartner?: boolean;
  timestamp: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  timestamp: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  timestamp: number;
}

export interface Employee {
  id: string;
  name: string;
  mobileNumber?: string;
  position: string;
  salary: number;
  hireDate: string;
  timestamp: number;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  timestamp: number;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: Omit<PaymentMethod, 'Salary'>;
  timestamp: number;
}

export interface CashAdvance {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  notes?: string;
  timestamp: number;
}

export interface AuthFormValues {
  email: string;
  password: string;
}

export interface TankReading {
    id: string;
    fuelType: FuelType;
    volume: number;
    timestamp: number;
}

export interface Investment {
  id: string;
  partnerId: string;
  partnerName: string;
  type: 'Investment' | 'Withdrawal';
  amount: number;
  notes?: string;
  timestamp: number;
}

export interface BusinessPartner {
  id: string;
  name: string;
  sharePercentage: number;
  contact?: string;
  timestamp: number;
}

// RBAC Types
export const PERMISSIONS = [
    'view_dashboard', 'view_all_transactions', 'delete_transaction',
    'view_customers', 'add_customer', 'edit_customer', 'delete_customer',
    'view_partner_ledger', 'view_credit_recovery',
    'view_cash_advances', 'add_cash_advance', 'delete_cash_advance',
    'view_inventory', 'view_purchases', 'add_purchase', 'delete_purchase',
    'view_purchase_returns', 'add_purchase_return', 'delete_purchase_return',
    'view_tank_readings', 'add_tank_reading',
    'view_supplier_payments', 'add_supplier_payment', 'delete_supplier_payment',
    'view_investments', 'add_investment', 'delete_investment',
    'view_expenses', 'add_expense', 'delete_expense',
    'view_other_incomes', 'add_other_income', 'delete_other_income',
    'view_ledger', 'view_summary', 'generate_ai_summary', 'view_reports',
    'manage_employees', 'manage_banks',
    'view_settings', 'manage_roles', 'manage_users'
] as const;

export type Permission = typeof PERMISSIONS[number];
export type RoleId = string;

export interface Role {
    id: RoleId;
    name: string;
    permissions: Permission[];
}
