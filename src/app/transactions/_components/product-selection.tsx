
'use client';

import { useState, useMemo } from 'react';
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

export function ProductSelection({ onProductSelect }: ProductSelectionProps) {
  const { products, isLoaded: productsLoaded } = useProducts();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!productsLoaded) return [];
    if (!search) return products;
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search, productsLoaded]);

  const handleSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      onProductSelect(product);
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          Select Product
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
                  value={p.id!}
                  onSelect={(currentValue) => handleSelect(currentValue)}
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
