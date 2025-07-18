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
