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

export interface Customer {
  id: string;
  name: string;
  contact: string;
  vehicleNumber?: string;
  timestamp: string;
}
