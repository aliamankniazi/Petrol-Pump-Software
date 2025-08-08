
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
import { Settings, Trash2, AlertTriangle, Droplets, Package, Edit, Truck, UserPlus, BookText, PlusCircle, LayoutDashboard } from 'lucide-react';
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
import type { Supplier, Product } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/hooks/use-settings';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-products';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';


const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  companyId: z.string().optional(),
  productGroupId: z.string().optional(),
  productCode: z.string().optional(),
  barcode: z.string().optional(),

  mainUnit: z.string().min(1, "Main unit is required."),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be non-negative"),
  tradePrice: z.coerce.number().min(0, "Trade price must be non-negative"),
  
  addSubUnit: z.boolean().default(false),
  subUnitName: z.string().optional(),
  subUnitConversion: z.coerce.number().optional(),

  initialStockMain: z.coerce.number().min(0).default(0),
  initialStockSub: z.coerce.number().min(0).default(0),

  // Legacy fields that need to be populated for type-safety
  category: z.enum(['Fuel', 'Lubricant', 'Other']).default('Other'),
  productType: z.enum(['Main', 'Secondary']).default('Main'),
  unit: z.enum(['Litre', 'Unit']).default('Unit'),
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
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null);
  const [showAdditionalDetails, setShowAdditionalDetails] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState('');

  React.useEffect(() => {
    setCurrentDate(format(new Date(), 'dd-MM-yyyy'));
  }, []);


  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    reset: resetProduct,
    control: controlProduct,
    watch,
    setValue: setProductValue,
    formState: { errors: productErrors }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema)
  });
  
  const addSubUnit = watch('addSubUnit');

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
    const productData: Omit<Product, 'id' | 'timestamp'> = {
        name: data.name,
        companyId: data.companyId,
        productGroupId: data.productGroupId,
        productCode: data.productCode,
        barcode: data.barcode,
        mainUnit: data.mainUnit,
        purchasePrice: data.purchasePrice,
        tradePrice: data.tradePrice,
        stock: data.initialStockMain,
        subUnitStock: data.initialStockSub,
        subUnit: data.addSubUnit && data.subUnitName && data.subUnitConversion 
            ? { name: data.subUnitName, conversionRate: data.subUnitConversion }
            : undefined,
        // Legacy fields
        category: 'Other',
        productType: 'Main',
        unit: 'Unit'
    };

    if (productToEdit) {
      updateProduct(productToEdit.id!, productData);
      toast({ title: 'Product Updated', description: `${productData.name} has been updated.` });
      setProductToEdit(null);
    } else {
      addProduct(productData);
      toast({ title: 'Product Added', description: `${productData.name} has been added.` });
    }
    resetProduct({ 
        name: '', 
        companyId: '', 
        productGroupId: '', 
        productCode: '', 
        barcode: '',
        mainUnit: '',
        purchasePrice: 0,
        tradePrice: 0,
        addSubUnit: false,
        subUnitName: '',
        subUnitConversion: 0,
        initialStockMain: 0,
        initialStockSub: 0
    });
  }, [productToEdit, addProduct, updateProduct, toast, resetProduct]);
  
  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setProductValue('name', product.name);
    setProductValue('companyId', product.companyId);
    setProductValue('productGroupId', product.productGroupId);
    setProductValue('productCode', product.productCode);
    setProductValue('barcode', product.barcode);
    setProductValue('mainUnit', product.mainUnit);
    setProductValue('purchasePrice', product.purchasePrice);
    setProductValue('tradePrice', product.tradePrice);
    setProductValue('initialStockMain', product.stock);
    setProductValue('initialStockSub', product.subUnitStock || 0);

    if (product.subUnit) {
        setProductValue('addSubUnit', true);
        setProductValue('subUnitName', product.subUnit.name);
        setProductValue('subUnitConversion', product.subUnit.conversionRate);
    } else {
        setProductValue('addSubUnit', false);
    }
  }

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id!);
    toast({ title: 'Product Deleted', description: `${productToDelete.name} has been removed.` });
    setProductToDelete(null);
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings /> Settings
            </CardTitle>
            <CardDescription>Customize application settings, products, suppliers, and more.</CardDescription>
          </div>
          <Button asChild variant="outline">
              <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
        
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Package /> Product Management</h3>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <PlusCircle /> {productToEdit ? 'Edit Product/Service' : 'New Product/Service Registration'}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">Date: {currentDate}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitProduct(onProductSubmit)} className="space-y-6">
                        {/* Section 1: Core Details */}
                        <div className="p-4 border rounded-lg">
                           <h4 className="font-semibold text-lg mb-4">1. Core Details</h4>
                           <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="productName">Product Name <span className="text-destructive">*</span></Label>
                                    <Input id="productName" {...registerProduct('name')} placeholder="e.g., Organic Whole Milk" />
                                    {productErrors.name && <p className="text-sm text-destructive">{productErrors.name.message}</p>}
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Company/Manufacturer</Label>
                                        <div className="flex items-center gap-2">
                                            <Controller name="companyId" control={controlProduct} render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                                    <SelectTrigger><SelectValue placeholder="Select a company"/></SelectTrigger>
                                                    <SelectContent>
                                                    </SelectContent>
                                                </Select>
                                            )}/>
                                            <Button type="button" variant="outline" size="icon" asChild>
                                                <a href="#supplier-management" title="Add new company">
                                                    <PlusCircle className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Product Group</Label>
                                        <Controller name="productGroupId" control={controlProduct} render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                                <SelectTrigger><SelectValue placeholder="Select a group"/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fuel">Fuel</SelectItem>
                                                    <SelectItem value="lubricant">Lubricant</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}/>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch id="showAdditional" checked={showAdditionalDetails} onCheckedChange={setShowAdditionalDetails} />
                                    <Label htmlFor="showAdditional">Show Additional Details (Code, Barcode...)</Label>
                                </div>
                                {showAdditionalDetails && (
                                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label>Product Code</Label>
                                            <Input {...registerProduct('productCode')} placeholder="e.g., SKU-123"/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Barcode</Label>
                                            <Input {...registerProduct('barcode')} placeholder="e.g., 8964000123456"/>
                                        </div>
                                    </div>
                                )}
                           </div>
                        </div>

                        {/* Section 2: Units & Pricing */}
                        <div className="p-4 border rounded-lg">
                           <h4 className="font-semibold text-lg mb-4">2. Units & Pricing</h4>
                           <div className="space-y-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Main Unit <span className="text-destructive">*</span></Label>
                                        <Input {...registerProduct('mainUnit')} placeholder="e.g., Carton" />
                                        {productErrors.mainUnit && <p className="text-sm text-destructive">{productErrors.mainUnit.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Purchase Price (Main Unit) <span className="text-destructive">*</span></Label>
                                        <Input type="number" {...registerProduct('purchasePrice')} placeholder="0.00" />
                                        {productErrors.purchasePrice && <p className="text-sm text-destructive">{productErrors.purchasePrice.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Trade Price (Main Unit) <span className="text-destructive">*</span></Label>
                                        <Input type="number" {...registerProduct('tradePrice')} placeholder="0.00" />
                                        {productErrors.tradePrice && <p className="text-sm text-destructive">{productErrors.tradePrice.message}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Controller name="addSubUnit" control={controlProduct} render={({ field }) => (
                                         <Switch id="addSubUnit" checked={field.value} onCheckedChange={field.onChange} />
                                    )} />
                                    <Label htmlFor="addSubUnit">Add Sub Unit Details (e.g., pieces in a carton)</Label>
                                </div>
                                {addSubUnit && (
                                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label>Sub Unit Name</Label>
                                            <Input {...registerProduct('subUnitName')} placeholder="e.g., Piece"/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Conversion (Sub Units per Main Unit)</Label>
                                            <Input type="number" {...registerProduct('subUnitConversion')} placeholder="e.g., 12"/>
                                        </div>
                                    </div>
                                )}
                           </div>
                        </div>

                         {/* Section 3: Initial Stock */}
                         <div className="p-4 border rounded-lg">
                           <h4 className="font-semibold text-lg mb-4">3. Initial Stock</h4>
                           <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Stock (in Main Units)</Label>
                                    <Input type="number" {...registerProduct('initialStockMain')} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Stock (in Sub Units)</Label>
                                    <Input type="number" {...registerProduct('initialStockSub')} placeholder="0" disabled={!addSubUnit} />
                                </div>
                           </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit">{productToEdit ? 'Update Product' : 'Save Product'}</Button>
                            <Button type="button" variant="outline" onClick={() => { setProductToEdit(null); resetProduct(); }}>
                                {productToEdit ? 'Cancel Edit' : 'Discard/Reset'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle>Product List</CardTitle>
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
                                <TableHead>Stock</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productsLoaded && products.length > 0 ? (
                                products.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>PKR {product.purchasePrice?.toFixed(2) || 'N/A'}</TableCell>
                                        <TableCell>PKR {product.tradePrice?.toFixed(2) || 'N/A'}</TableCell>
                                        <TableCell>{product.stock} {product.mainUnit}(s)</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setProductToDelete(product)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        {productsLoaded ? 'No products found.' : 'Loading products...'}
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
          
          <div className="space-y-4" id="supplier-management">
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
        </CardContent>
      </Card>
      
      <AlertDialog open={!!supplierToDelete} onOpenChange={(isOpen) => !isOpen && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the supplier: <br /><strong className="font-medium text-foreground">{supplierToDelete?.name}</strong></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, delete supplier</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product: <br />
              <strong className="font-medium text-foreground">{productToDelete?.name}</strong>
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
    </div>
    </>
  );
}
