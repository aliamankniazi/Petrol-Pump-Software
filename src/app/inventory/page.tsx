'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Droplets } from 'lucide-react';
import { useFuelStock } from '@/hooks/use-fuel-stock';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { FuelType } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

// Assume a max capacity for progress bar visualization
const MAX_CAPACITY: Record<FuelType, number> = {
  'Unleaded': 20000,
  'Premium': 10000,
  'Diesel': 25000,
};

export default function InventoryPage() {
  const { fuelStock, isLoaded } = useFuelStock();

  const getProgressColor = (value: number) => {
    if (value < 15) return 'bg-red-500';
    if (value < 40) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package /> Fuel Inventory
          </CardTitle>
          <CardDescription>
            Current stock levels for all fuel types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isLoaded ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : FUEL_TYPES.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-3">
              {FUEL_TYPES.map(fuel => {
                const currentStock = fuelStock[fuel] || 0;
                const maxStock = MAX_CAPACITY[fuel];
                const percentage = Math.min((currentStock / maxStock) * 100, 100);
                
                return (
                   <Card key={fuel} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Droplets className="w-6 h-6 text-primary" /> {fuel}
                        </CardTitle>
                    </CardHeader>
                     <CardContent className="flex-grow space-y-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold tracking-tighter">
                                {currentStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-muted-foreground">Litres in Stock</p>
                        </div>
                        <div className="space-y-2">
                           <Progress value={percentage} className="h-3 [&>div]:bg-primary" />
                           <div className="flex justify-between text-xs text-muted-foreground">
                               <span>0 L</span>
                               <span>{percentage.toFixed(0)}%</span>
                               <span>{maxStock.toLocaleString()} L</span>
                           </div>
                        </div>
                     </CardContent>
                   </Card>
                );
              })}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Package className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Inventory Data</h3>
                <p>Fuel stock levels are not available.</p>
             </div>
          )}
          <div className="mt-6 text-center text-sm text-muted-foreground">
             <p>Need to correct the stock levels? <Button variant="link" asChild className="p-0 h-auto"><Link href="/settings">Adjust inventory in settings</Link></Button>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
