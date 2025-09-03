

'use client';

import * as React from 'react';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, AlertTriangle, Package, Edit, PlusCircle, LayoutDashboard, ChevronsUpDown } from 'lucide-react';
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
import type { Product, SubUnit } from '@/lib/types';
import { useProducts } from '@/hooks/use-products';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTransactions } from '@/hooks/use-transactions';

const subUnitSchema = z.object({
  name: z.string().min(1, 'Sub-unit name is required'),
  conversionRate: z.coerce.number().min(0.01, 'Conversion rate must be positive'),
  purchasePrice: z.coerce.number().optional(),
  tradePrice: z.coerce.number().optional(),
  retailPrice: z.coerce.number().optional(),
}).optional();

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.enum(['Fuel', 'Lubricant', 'Other']).optional().nullable(),
  productCode: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  productGroupId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  mainUnit: z.string().min(1, 'Main unit is required'),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  tradePrice: z.coerce.number().min(0, 'Trade price cannot be negative'),
  retailPrice: z.coerce.number().min(0, 'Retail price cannot be negative'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
  subUnitStock: z.coerce.number().min(0, 'Sub-unit stock cannot be negative').optional(),
  hasSubUnit: z.boolean().default(false),
  subUnit: subUnitSchema,
}).refine(data => !data.hasSubUnit || (data.subUnit && data.subUnit.name), {
    message: "Sub-unit details are required when enabled.",
    path: ['subUnit'],
});


type ProductFormValues = z.infer<typeof productSchema>;


export default function SettingsPage() {
  const { products, addProduct, updateProduct, deleteProduct, isLoaded: productsLoaded } = useProducts();
  const { transactions } = useTransactions();
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const hasSubUnit = watch('hasSubUnit');

  React.useEffect(() => {
    if (productToEdit) {
      reset({
        ...productToEdit,
        hasSubUnit: !!productToEdit.subUnit,
        subUnit: productToEdit.subUnit ?? undefined,
      });
    } else {
      reset({
        name: '', category: null, productCode: null, barcode: null, productGroupId: null,
        companyId: null, mainUnit: '', purchasePrice: 0, tradePrice: 0, retailPrice: 0, stock: 0,
        subUnitStock: 0, hasSubUnit: false, subUnit: { name: '', conversionRate: 0, purchasePrice: 0, tradePrice: 0, retailPrice: 0 }
      });
    }
  }, [productToEdit, reset]);

  const onProductSubmit: SubmitHandler<ProductFormValues> = React.useCallback(async (data) => {
    const productData: Omit<Product, 'id'|'timestamp'> = {
        ...data,
        subUnit: data.hasSubUnit ? data.subUnit : undefined,
    };

    if (productToEdit) {
      updateProduct(productToEdit.id!, productData);
      toast({ title: 'Product Updated', description: `${data.name} has been updated.` });
      setProductToEdit(null);
    } else {
      await addProduct(productData);
      toast({ title: 'Product Added', description: `${data.name} has been added.` });
    }
    reset({
        name: '', category: null, productCode: null, barcode: null, productGroupId: null,
        companyId: null, mainUnit: '', purchasePrice: 0, tradePrice: 0, retailPrice: 0, stock: 0,
        subUnitStock: 0, hasSubUnit: false, subUnit: { name: '', conversionRate: 0, purchasePrice: 0, tradePrice: 0, retailPrice: 0 }
      });
  }, [productToEdit, addProduct, updateProduct, toast, reset]);
  
  const handleDeleteProduct = React.useCallback(() => {
    if (!productToDelete) return;

    const hasSales = transactions.some(tx => tx.items.some(item => item.productId === productToDelete.id));

    if (hasSales) {
      toast({
        variant: 'destructive',
        title: 'Deletion Prevented',
        description: `${productToDelete.name} has been sold and cannot be deleted.`,
      });
      setProductToDelete(null);
      return;
    }
    
    deleteProduct(productToDelete.id!);
    toast({ title: 'Product Deleted', description: `${productToDelete.name} has been removed.` });
    setProductToDelete(null);
  }, [productToDelete, deleteProduct, toast, transactions]);

  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setProductToEdit(null);
    reset({
        name: '', category: null, productCode: null, barcode: null, productGroupId: null,
        companyId: null, mainUnit: '', purchasePrice: 0, tradePrice: 0, retailPrice: 0, stock: 0,
        subUnitStock: 0, hasSubUnit: false, subUnit: { name: '', conversionRate: 0, purchasePrice: 0, tradePrice: 0, retailPrice: 0 }
    });
  }

  return (
    <>
    <div className="p-4 md:p-8">
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                        <Settings /> {productToEdit ? 'Edit Product' : 'Product Management'}
                        </CardTitle>
                        <CardDescription>{productToEdit ? `Editing ${productToEdit.name}` : 'Add a new product or service to your inventory.'}</CardDescription>
                    </div>
                     <Button asChild variant="outline">
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onProductSubmit)}>
                        <div className="space-y-6">
                            {/* Section 1: Core Details */}
                            <div>
                                <h4 className="text-md font-medium mb-4 pb-2 border-b">1. Core Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Product Name *</Label>
                                        <Input id="name" {...register('name')} />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Product Group</Label>
                                        <Controller
                                            name="category"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <SelectTrigger><SelectValue placeholder="Select a group" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Fuel">Fuel</SelectItem>
                                                        <SelectItem value="Lubricant">Lubricant</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Collapsible className="mt-4">
                                    <CollapsibleTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto text-sm">
                                            <ChevronsUpDown className="w-4 h-4 mr-2" />
                                            Show Additional Details (Code, Barcode...)
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-0">
                                        <div className="space-y-2">
                                            <Label htmlFor="productCode">Product Code</Label>
                                            <Input id="productCode" {...register('productCode')} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="barcode">Barcode</Label>
                                            <Input id="barcode" {...register('barcode')} />
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>

                            {/* Section 2: Units & Pricing */}
                            <div>
                                <h4 className="text-md font-medium mb-4 pb-2 border-b">2. Units & Pricing</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mainUnit">Main Unit *</Label>
                                        <Input id="mainUnit" {...register('mainUnit')} placeholder="e.g., Liter, Carton"/>
                                        {errors.mainUnit && <p className="text-sm text-destructive">{errors.mainUnit.message}</p>}
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="purchasePrice">Purchase Price *</Label>
                                        <Input id="purchasePrice" type="number" step="any" {...register('purchasePrice')} />
                                        {errors.purchasePrice && <p className="text-sm text-destructive">{errors.purchasePrice.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tradePrice">Trade Price *</Label>
                                        <Input id="tradePrice" type="number" step="any" {...register('tradePrice')} />
                                        {errors.tradePrice && <p className="text-sm text-destructive">{errors.tradePrice.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="retailPrice">Retail Price *</Label>
                                        <Input id="retailPrice" type="number" step="any" {...register('retailPrice')} />
                                        {errors.retailPrice && <p className="text-sm text-destructive">{errors.retailPrice.message}</p>}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <Controller
                                        name="hasSubUnit"
                                        control={control}
                                        render={({ field }) => <Checkbox id="hasSubUnit" checked={field.value} onCheckedChange={field.onChange} />}
                                    />
                                    <Label htmlFor="hasSubUnit">Add Sub Unit Details (e.g., pieces in a carton)</Label>
                                </div>
                                {hasSubUnit && (
                                     <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/50 animate-in fade-in-0">
                                         <div className="space-y-2">
                                            <Label htmlFor="subUnit.name">Sub Unit Name *</Label>
                                            <Input id="subUnit.name" {...register('subUnit.name')} placeholder="e.g., Piece, Bottle" />
                                            {errors.subUnit?.name && <p className="text-sm text-destructive">{errors.subUnit.name.message}</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="subUnit.conversionRate">Conversion Rate *</Label>
                                            <Input id="subUnit.conversionRate" type="number" step="any" {...register('subUnit.conversionRate')} placeholder="Pieces per Carton" />
                                             {errors.subUnit?.conversionRate && <p className="text-sm text-destructive">{errors.subUnit.conversionRate.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subUnit.purchasePrice">Purchase Price</Label>
                                            <Input id="subUnit.purchasePrice" type="number" step="any" {...register('subUnit.purchasePrice')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subUnit.tradePrice">Trade Price</Label>
                                            <Input id="subUnit.tradePrice" type="number" step="any" {...register('subUnit.tradePrice')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subUnit.retailPrice">Retail Price</Label>
                                            <Input id="subUnit.retailPrice" type="number" step="any" {...register('subUnit.retailPrice')} />
                                        </div>
                                     </div>
                                )}
                            </div>

                            {/* Section 3: Initial Stock */}
                            <div>
                                <h4 className="text-md font-medium mb-4 pb-2 border-b">3. Initial Stock</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="stock">Stock (in Main Units)</Label>
                                        <Input id="stock" type="number" step="any" {...register('stock')} />
                                        {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
                                    </div>
                                    {hasSubUnit && (
                                        <div className="space-y-2">
                                            <Label htmlFor="subUnitStock">Stock (in Sub Units)</Label>
                                            <Input id="subUnitStock" type="number" step="any" {...register('subUnitStock')} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <Button type="submit">{productToEdit ? 'Update Product' : 'Save Product'}</Button>
                            <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                {productToEdit ? 'Cancel Edit' : 'Discard/Reset'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package /> Product List</CardTitle>
                    <CardDescription>View, edit, or delete existing products.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Purchase Price</TableHead>
                                    <TableHead>Trade Price</TableHead>
                                    <TableHead>Retail Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsLoaded && products.length > 0 ? (
                                    products.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell>PKR {p.purchasePrice.toFixed(2)} / {p.mainUnit}</TableCell>
                                        <TableCell>PKR {p.tradePrice.toFixed(2)} / {p.mainUnit}</TableCell>
                                        <TableCell>PKR {p.retailPrice.toFixed(2)} / {p.mainUnit}</TableCell>
                                        <TableCell>{p.stock} {p.mainUnit}(s)</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" title="Edit Product" onClick={() => handleEditClick(p)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" title="Delete Product" onClick={() => setProductToDelete(p)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            {productsLoaded ? 'No products added yet.' : 'Loading products...'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
      
      <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product: <br />
                <strong className="font-medium text-foreground">{productToDelete?.name}</strong>.
                This is only possible if the product has no sales history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
