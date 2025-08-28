
'use client';

import { useState, useMemo, forwardRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useProducts } from '@/hooks/use-products';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface ProductSelectionProps {
  onProductSelect: (product: Product) => void;
  selectedProduct: Product | null;
}

export const ProductSelection = forwardRef<HTMLButtonElement, ProductSelectionProps>(
  ({ onProductSelect, selectedProduct }, ref) => {
    const { products, isLoaded: productsLoaded } = useProducts();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredProducts = useMemo(() => {
        if (!productsLoaded) return [];
        if (!search) return products;
        return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }, [products, search, productsLoaded]);

    const handleSelect = (product: Product) => {
      onProductSelect(product);
      setIsOpen(false);
      setSearch(''); // Reset search
    };

    const displayName = selectedProduct ? selectedProduct.name : 'Select Product';

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between" ref={ref}>
            <span className="truncate">{displayName}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search product..." onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>No product found.</CommandEmpty>
              <CommandGroup>
                {filteredProducts.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.name}
                    onSelect={() => handleSelect(p)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedProduct?.id === p.id ? "opacity-100" : "opacity-0")} />
                    {p.name}
                     {p.mainUnit && <span className="text-xs text-muted-foreground ml-2">({p.mainUnit}{p.subUnit?.name ? ` / ${p.subUnit.name}` : ''})</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

ProductSelection.displayName = 'ProductSelection';
