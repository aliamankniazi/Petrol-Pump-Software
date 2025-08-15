
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
}

export const ProductSelection = forwardRef<HTMLButtonElement, ProductSelectionProps>(
  ({ onProductSelect }, ref) => {
    const { products, isLoaded: productsLoaded } = useProducts();
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (product: Product) => {
      onProductSelect(product);
      setIsOpen(false);
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between" ref={ref}>
            Select Product
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search product..." />
            <CommandList>
              <CommandEmpty>No product found.</CommandEmpty>
              <CommandGroup>
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.name}
                    onSelect={() => handleSelect(p)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
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
