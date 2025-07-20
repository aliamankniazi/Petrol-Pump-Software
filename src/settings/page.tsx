
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Settings, Trash2, AlertTriangle, Droplets, Package, Edit, Truck, UserPlus, BookText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import type { FuelType, Supplier } from '@/lib/types';
import { useFuelStock } from '@/hooks/use-fuel-stock';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/hooks/use-settings';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';


const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const adjustmentSchema = z.object({
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a fuel type.' }),
  adjustment: z.coerce.number(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;


export default function SettingsPage() {
  const { clearAllData } = useSettings();
  const { fuelPrices, updateFuelPrice, isLoaded: pricesLoaded } = useFuelPrices();
  const { fuelStock, setFuelStock, isLoaded: stockLoaded } = useFuelStock();
  const { suppliers, addSupplier, deleteSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { toast } = useToast();
  const [supplierToDelete, setSupplierToDelete] = React.useState<Supplier | null>(null);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustment: 0,
    }
  });

  const { 
    register: registerSupplier, 
    handleSubmit: handleSubmitSupplier, 
    reset: resetSupplier, 
    formState: { errors: supplierErrors } 
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
  });

  const selectedFuelType = watch('fuelType');
  const adjustmentValue = watch('adjustment');
  const currentStock = selectedFuelType ? (fuelStock[selectedFuelType] || 0) : 0;
  
  const newStock = React.useMemo(() => {
    const adj = Number(adjustmentValue) || 0;
    return Number(currentStock) + adj;
  }, [currentStock, adjustmentValue]);

  const handleClearData = React.useCallback(async () => {
    await clearAllData();
    toast({
      title: "Data Cleared",
      description: "All application data has been removed.",
    });
  }, [clearAllData, toast]);

  const handlePriceChange = React.useCallback((fuelType: FuelType, value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price)) {
      updateFuelPrice(fuelType, price);
    }
  }, [updateFuelPrice]);

  const onAdjustmentSubmit: SubmitHandler<AdjustmentFormValues> = React.useCallback((data) => {
    const currentStockValue = fuelStock[data.fuelType] || 0;
    const finalNewStock = currentStockValue + data.adjustment;

    if (finalNewStock < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Adjustment',
        description: 'Stock level cannot be negative.',
      });
      return;
    }
    setFuelStock(data.fuelType, finalNewStock);
    toast({
      title: 'Stock Adjusted',
      description: `${data.fuelType} stock has been set to ${finalNewStock.toLocaleString()} L.`,
    });
    reset({ fuelType: data.fuelType, adjustment: 0 });
  }, [fuelStock, setFuelStock, toast, reset]);
  
  const onSupplierSubmit: SubmitHandler<SupplierFormValues> = React.useCallback((data) => {
    addSupplier(data);
    toast({
      title: 'Supplier Added',
      description: `${data.name} has been added to your supplier list.`,
    });
    resetSupplier();
  }, [addSupplier, toast, resetSupplier]);
  
  const handleDeleteSupplier = React.useCallback(() => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete.id);
    toast({
        title: "Supplier Deleted",
        description: `${supplierToDelete.name} has been removed from your list.`,
    });
    setSupplierToDelete(null);
  }, [supplierToDelete, deleteSupplier, toast]);

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings /> Settings
          </CardTitle>
          <CardDescription>Customize application settings, fuel prices, and inventory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
        
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Truck /> Supplier Management</h3>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><UserPlus /> Add New Supplier</CardTitle>
                    <CardDescription>Add a new supplier to your permanent list.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitSupplier(onSupplierSubmit)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="supplierName">Supplier Name</Label>
                                <Input id="supplierName" {...registerSupplier('name')} placeholder="e.g., PSO" />
                                {supplierErrors.name && <p className="text-sm text-destructive">{supplierErrors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supplierContact">Contact (Optional)</Label>
                                <Input id="supplierContact" {...registerSupplier('contact')} placeholder="e.g., 0300-1234567" />
                            </div>
                        </div>
                        <Button type="submit">Add Supplier</Button>
                    </form>
                    <Separator className="my-6" />
                    <h4 className="text-md font-medium mb-4">Existing Suppliers</h4>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliersLoaded ? (
                                    suppliers.length > 0 ? suppliers.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.contact || 'N/A'}</TableCell>
                                            <TableCell className="text-center">
                                                <Button asChild variant="ghost" size="icon" title="View Ledger">
                                                   <Link href={`/customers/${s.id}/ledger`}>
                                                     <BookText className="w-5 h-5" />
                                                   </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Delete Supplier" onClick={() => setSupplierToDelete(s)}>
                                                    <Trash2 className="w-5 h-5 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No suppliers added yet.
                                            </TableCell>
                                        </TableRow>
                                    )
                                ) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="h-24 text-center">
                                        <Skeleton className="h-5 w-full" />
                                      </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </div>
        
          <Separator />
        
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fuel Prices</h3>
            <div className="space-y-4">
              {pricesLoaded ? FUEL_TYPES.map(fuel => (
                <div key={fuel} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor={`${fuel}-price`} className="flex items-center gap-2"><Droplets className="w-4 h-4" /> {fuel} Price (PKR/L)</Label>
                    <p className="text-sm text-muted-foreground">
                      Set the price per litre for {fuel}.
                    </p>
                  </div>
                  <Input 
                    id={`${fuel}-price`} 
                    type="number" 
                    defaultValue={fuelPrices[fuel] || ''} 
                    onBlur={(e) => handlePriceChange(fuel, e.target.value)}
                    className="w-28" 
                    step="0.01"
                  />
                </div>
              )) : Array.from({length: 3}).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Package /> Product Adjustment</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Edit /> Manual Stock Adjustment</CardTitle>
                <CardDescription>
                  Manually adjust the current stock level for a fuel type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onAdjustmentSubmit)} className="space-y-4">
                   <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                      <Label>Fuel Type</Label>
                       <Controller
                        name="fuelType"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                            <SelectTrigger>
                              <SelectValue placeholder="Select a fuel type" />
                            </SelectTrigger>
                            <SelectContent>
                              {FUEL_TYPES.map(fuel => (
                                <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                       {errors.fuelType && <p className="text-sm text-destructive">{errors.fuelType.message}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="currentStock">Current Stock (L)</Label>
                      <Input id="currentStock" type="number" value={stockLoaded ? currentStock.toFixed(2) : "Loading..."} readOnly disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="adjustment">Adjustment (L)</Label>
                      <Input id="adjustment" type="number" {...register('adjustment')} placeholder="e.g., -50 or 100" step="0.01" />
                       {errors.adjustment && <p className="text-sm text-destructive">{errors.adjustment.message}</p>}
                    </div>
                     <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="newStock">New Stock (L)</Label>
                      <Input id="newStock" type="number" value={selectedFuelType ? newStock.toFixed(2) : "..."} readOnly disabled className="bg-muted/50 font-bold" />
                    </div>
                  </div>
                  <Button type="submit" disabled={!selectedFuelType || !stockLoaded}>Adjust Stock</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          <Separator />

          <div className="space-y-4">
             <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
              <div>
                <Label htmlFor="clear-data" className="text-destructive">Clear All Data</Label>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all application data. This action cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" id="clear-data">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your application data from this device.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Yes, delete all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!supplierToDelete} onOpenChange={(isOpen) => !isOpen && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier: <br />
              <strong className="font-medium text-foreground">{supplierToDelete?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
