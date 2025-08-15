
'use client';

import { useState, useMemo, forwardRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useCustomers } from '@/hooks/use-customers';
import { cn } from '@/lib/utils';

interface CustomerSelectionProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customerId: string) => void;
}

export const CustomerSelection = forwardRef<HTMLButtonElement, CustomerSelectionProps>(
  ({ selectedCustomerId, onCustomerSelect }, ref) => {
    const { customers, isLoaded: customersLoaded } = useCustomers();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredCustomers = useMemo(() => {
      if (!customersLoaded) return [];
      if (!search) return customers;
      return customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      );
    }, [customers, search, customersLoaded]);

    const handleSelect = (customerId: string) => {
      onCustomerSelect(customerId);
      setIsOpen(false);
      setSearch("");
    };

    const selectedCustomerName = useMemo(() => {
      if (!selectedCustomerId || selectedCustomerId === 'walk-in') {
        return 'Walk-in Customer';
      }
      return customers.find(c => c.id === selectedCustomerId)?.name || 'Select Customer';
    }, [selectedCustomerId, customers]);

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between" ref={ref}>
            {selectedCustomerName}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search customer..." onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="walk-in" onSelect={() => handleSelect('walk-in')}>
                  <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === "walk-in" ? "opacity-100" : "opacity-0")} />
                  Walk-in Customer
                </CommandItem>
                {filteredCustomers.map((c) => (
                  <CommandItem key={c.id} value={c.id!} onSelect={() => handleSelect(c.id!)}>
                    <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === c.id ? "opacity-100" : "opacity-0")} />
                    {c.name}
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

CustomerSelection.displayName = 'CustomerSelection';
