'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package } from 'lucide-react';

export default function PurchasesPage() {
  // This is a placeholder for the purchase functionality.
  // We can build this out further in the next steps.
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart /> Product Purchases
          </CardTitle>
          <CardDescription>
            Record incoming stock and fuel deliveries here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <Package className="w-16 h-16" />
            <h3 className="text-xl font-semibold">Purchase Recording Coming Soon</h3>
            <p>This section will allow you to record new purchases of fuel and other products.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
