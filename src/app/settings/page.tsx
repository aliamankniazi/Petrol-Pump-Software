
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { Supplier, Product } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/hooks/use-settings';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-products';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.enum(['Fuel', 'Lubricant', 'Other']),
  productType: z.enum(['Main', 'Secondary']),
  unit: z.enum(['Litre', 'Unit']),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  cost: z.coerce.number().min(0, "Cost must be non-negative"),
  supplierId: z.string().optional(),
  location: z.string().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;


export default function SettingsPage() {
  const { clearAllData } = useSettings();
  const { suppliers, addSupplier, deleteSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { products, addProduct, updateProduct, deleteProduct, isLoaded: productsLoaded } = useProducts();
  const { toast } = useToast();
  const [supplierToDelete, setSupplierToDelete] = React.useState<Supplier | null>(null);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null);

  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    reset: resetProduct,
    control: controlProduct,
    setValue: setProductValue,
    formState: { errors: productErrors }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: 'Lubricant',
      productType: 'Main',
      unit: 'Unit'
    }
  });
  
  const {
    register: registerSupplier,
    handleSubmit: handleSubmitSupplier,
    reset: resetSupplier,
    formState: { errors: supplierErrors }
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema)
  });

  const handleClearData = React.useCallback(async () => {
    try {
        await clearAllData();
        toast({
          title: "Data Cleared",
          description: "All application data has been removed.",
        });
    } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to clear data.",
        });
    }
  }, [clearAllData, toast]);

  const onProductSubmit: SubmitHandler<ProductFormValues> = React.useCallback((data) => {
    const finalData = { ...data, supplierId: data.supplierId === 'none' ? undefined : data.supplierId };
    if (productToEdit) {
      updateProduct(productToEdit.id!, finalData);
      toast({ title: 'Product Updated', description: `${finalData.name} has been updated.` });
      setProductToEdit(null);
    } else {
      addProduct({ ...finalData, stock: 0 }); // Initial stock is 0
      toast({ title: 'Product Added', description: `${finalData.name} has been added.` });
    }
    resetProduct({ name: '', category: 'Lubricant', productType: 'Main', unit: 'Unit', price: 0, cost: 0, supplierId: '', location: '' });
  }, [productToEdit, addProduct, updateProduct, toast, resetProduct]);
  
  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    // Use setValue for each field to ensure form state is updated correctly
    Object.keys(product).forEach(key => {
        setProductValue(key as keyof ProductFormValues, product[key as keyof ProductFormValues]);
    });
  }

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    toast({ title: 'Product Deleted' });
  }

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
    deleteSupplier(supplierToDelete.id!);
    toast({
        title: "Supplier Deleted",
        description: `${supplierToDelete.name} has been removed from your list.`,
    });
    setSupplierToDelete(null);
  }, [supplierToDelete, deleteSupplier, toast]);

  return (
    <>
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings /> Settings
          </CardTitle>
          <CardDescription>Customize application settings, products, suppliers, and more.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
        
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Package /> Product Management</h3>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><UserPlus /> {productToEdit ? 'Edit Product' : 'Add New Product'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitProduct(onProductSubmit)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="productName">Product Name</Label>
                                <Input id="productName" {...registerProduct('name')} placeholder="e.g., Mobil Delvac 1" />
                                {productErrors.name && <p className="text-sm text-destructive">{productErrors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Controller name="category" control={controlProduct} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue="Lubricant">
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Fuel">Fuel</SelectItem>
                                            <SelectItem value="Lubricant">Lubricant</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}/>
                            </div>
                             <div className="space-y-2">
                                <Label>Product Type</Label>
                                <Controller name="productType" control={controlProduct} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue="Main">
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Main">Main</SelectItem>
                                            <SelectItem value="Secondary">Secondary</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}/>
                            </div>
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Controller name="unit" control={controlProduct} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue="Unit">
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Litre">Litre</SelectItem>
                                            <SelectItem value="Unit">Unit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="price">Selling Price</Label>
                                <Input id="price" type="number" step="0.01" {...registerProduct('price')} placeholder="e.g., 270.50" />
                                {productErrors.price && <p className="text-sm text-destructive">{productErrors.price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cost">Purchase Cost</Label>
                                <Input id="cost" type="number" step="0.01" {...registerProduct('cost')} placeholder="e.g., 250.00" />
                                {productErrors.cost && <p className="text-sm text-destructive">{productErrors.cost.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Supplier (Optional)</Label>
                                <Controller name="supplierId" control={controlProduct} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value || 'none'} defaultValue="none">
                                        <SelectTrigger><SelectValue placeholder="Select supplier"/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {suppliersLoaded ? suppliers.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                )}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location (Optional)</Label>
                                <Input id="location" {...registerProduct('location')} placeholder="e.g., Shelf B" />
                            </div>
                        </div>
                        <Button type="submit">{productToEdit ? 'Update Product' : 'Add Product'}</Button>
                        {productToEdit && <Button type="button" variant="ghost" onClick={() => { setProductToEdit(null); resetProduct({ name: '', category: 'Lubricant', productType: 'Main', unit: 'Unit', price: 0, cost: 0, supplierId: 'none', location: '' }); }}>Cancel Edit</Button>}
                    </form>
                    <Separator className="my-6" />
                    <h4 className="text-md font-medium mb-4">Existing Products</h4>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Unit</TableHead><TableHead>Price</TableHead><TableHead>Cost</TableHead><TableHead>Stock</TableHead><TableHead>Supplier</TableHead><TableHead>Location</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {productsLoaded && products.length > 0 ? products.map(p => {
                                  const supplier = suppliers.find(s => s.id === p.supplierId);
                                  return (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.name}</TableCell><TableCell>{p.category}</TableCell><TableCell>{p.productType}</TableCell><TableCell>{p.unit}</TableCell><TableCell>{p.price}</TableCell><TableCell>{p.cost}</TableCell><TableCell>{p.stock}</TableCell>
                                        <TableCell>{supplier?.name || 'N/A'}</TableCell><TableCell>{p.location || 'N/A'}</TableCell>
                                        <TableCell className="text-center space-x-0">
                                            <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEditProduct(p)}><Edit className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDeleteProduct(p.id!)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                  )
                                }) : <TableRow><TableCell colSpan={10} className="h-24 text-center">{productsLoaded ? 'No products added.' : 'Loading...'}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Truck /> Supplier Management</h3>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><UserPlus /> Add New Supplier</CardTitle>
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
                                {supplierErrors.contact && <p className="text-sm text-destructive">{supplierErrors.contact.message}</p>}
                            </div>
                        </div>
                        <Button type="submit">Add Supplier</Button>
                    </form>
                    <Separator className="my-6" />
                    <h4 className="text-md font-medium mb-4">Existing Suppliers</h4>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {suppliersLoaded && suppliers.length > 0 ? suppliers.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.name}</TableCell>
                                        <TableCell>{s.contact || 'N/A'}</TableCell>
                                        <TableCell className="text-center">
                                            <Button asChild variant="ghost" size="icon" title="View Ledger"><Link href={`/customers/${s.id}/ledger`}><BookText className="w-5 h-5" /></Link></Button>
                                            <Button variant="ghost" size="icon" title="Delete Supplier" onClick={() => setSupplierToDelete(s)}><Trash2 className="w-5 h-5 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="h-24 text-center">{suppliersLoaded ? 'No suppliers added yet.' : 'Loading suppliers...'}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div><Label>Theme</Label><p className="text-sm text-muted-foreground">Switch between light and dark mode.</p></div>
              <ThemeToggle />
            </div>
          </div>
          
          <Separator />

          <div className="space-y-4">
             <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
              <div>
                <Label htmlFor="clear-data" className="text-destructive">Clear All Data</Label>
                <p className="text-sm text-muted-foreground">This will permanently delete all application data. This action cannot be undone.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" id="clear-data"><Trash2 className="mr-2 h-4 w-4" /> Clear Data</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete all your application data from this device.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleClearData}>Yes, delete all data</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!supplierToDelete} onOpenChange={(isOpen) => !isOpen && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the supplier: <br /><strong className="font-medium text-foreground">{supplierToDelete?.name}</strong></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, delete supplier</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
