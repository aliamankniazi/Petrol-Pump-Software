
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Droplets, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/use-products';

const MAX_CAPACITY = 25000; // Generic max capacity for visualization

export default function InventoryPage() {
  const { products, isLoaded } = useProducts();

  const getProgressColor = (value: number) => {
    if (value < 15) return 'bg-red-500';
    if (value < 40) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package /> Product Inventory
            </CardTitle>
            <CardDescription>
              Current stock levels for all products.
            </CardDescription>
          </div>
           <Button asChild variant="outline">
              <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
          </Button>
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
          ) : products.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-3">
              {products.map(product => {
                const currentStock = product.stock || 0;
                const percentage = Math.min((currentStock / MAX_CAPACITY) * 100, 100);
                
                return (
                   <Card key={product.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Droplets className="w-6 h-6 text-primary" /> {product.name}
                        </CardTitle>
                        <CardDescription>{product.category}</CardDescription>
                    </CardHeader>
                     <CardContent className="flex-grow space-y-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold tracking-tighter">
                                {currentStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-muted-foreground">{product.mainUnit}(s) in Stock</p>
                        </div>
                        <div className="space-y-2">
                           <Progress value={percentage} className="h-3 [&>div]:bg-primary" />
                           <div className="flex justify-between text-xs text-muted-foreground">
                               <span>0</span>
                               <span>{percentage.toFixed(0)}%</span>
                               <span>{MAX_CAPACITY.toLocaleString()}</span>
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
                <p>Add products in settings to see their stock levels.</p>
             </div>
          )}
          <div className="mt-6 text-center text-sm text-muted-foreground">
             <p>Need to add or adjust products? <Button variant="link" asChild className="p-0 h-auto"><Link href="/settings">Manage products in settings</Link></Button>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
