
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen, HandCoins, ArrowRightLeft, Fuel, DollarSign, Beaker, Handshake, PiggyBank, Archive, BarChartHorizontal } from 'lucide-react';


const navItems = [
  { href: '/dashboard/', label: 'Dashboard', icon: LayoutDashboard },
  { 
    label: 'Sales & Ledger',
    icon: HandCoins,
    subItems: [
        { href: '/', label: 'New Sale', icon: Fuel },
        { href: '/all-transactions/', label: 'All Transactions', icon: Archive },
        { href: '/partner-ledger/', label: 'Unified Ledger', icon: BookOpen },
        { href: '/credit-recovery/', label: 'Credit Recovery', icon: BarChartHorizontal },
        { href: '/cash-advances/', label: 'Cash Advances', icon: ArrowRightLeft },
    ]
  },
  {
    label: 'Purchases & Suppliers',
    icon: ShoppingCart,
    subItems: [
        { href: '/purchases/', label: 'Purchases', icon: ShoppingCart },
        { href: '/supplier-payments/', label: 'Supplier Payments', icon: Handshake },
        { href: '/purchase-returns/', label: 'Purchase Returns', icon: Undo2 },
    ]
  },
  {
    label: 'People & Partners',
    icon: Users,
    subItems: [
        { href: '/customers/', label: 'Customers & Partners', icon: Users },
        { href: '/employees/', label: 'Employees', icon: Briefcase },
        { href: '/investments/', label: 'Partner Investments', icon: PiggyBank },
    ]
  },
  { 
    label: 'Inventory',
    icon: Package,
    subItems: [
        { href: '/inventory/', label: 'Stock Levels', icon: Package },
        { href: '/tanks/', label: 'Tank Readings', icon: Beaker },
    ]
  },
  {
    label: 'Financials',
    icon: DollarSign,
    subItems: [
      { href: '/expenses/', label: 'Expenses', icon: Receipt },
      { href: '/other-incomes/', label: 'Other Incomes', icon: DollarSign },
      { href: '/bank-management/', label: 'Bank Management', icon: Landmark },
      { href: '/ledger/', label: 'General Journal', icon: BookOpen },
    ]
  },
  { href: '/reports/', label: 'Reports', icon: FileText },
  { href: '/settings/', label: 'Settings', icon: Settings },
];

const AppLogo = () => (
    <div className="flex items-center gap-2.5">
       <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V8" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M12 8C8 8 6 10 6 12" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M12 8C16 8 18 10 18 12" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M6 12C4 12 3 14 3 16" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M18 12C20 12 21 14 21 16" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M4 8S5 6 7 6" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M20 8S19 6 17 6" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M12 8C10 6 9 4 9 2" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M12 8C14 6 15 4 15 2" stroke="#5C3A21" strokeWidth="2.5"></path>
                <path d="M9 2C7 2 6 4 6 6" fill="#4CAF50" stroke="#4CAF50" strokeWidth="1"></path>
                <path d="M15 2C17 2 18 4 18 6" fill="#4CAF50" stroke="#4CAF50" strokeWidth="1"></path>
                <path d="M7 6C5 6 4 8 4 10" fill="#4CAF50" stroke="#4CAF50" strokeWidth="1"></path>
                <path d="M17 6C19 6 20 8 20 10" fill="#4CAF50" stroke="#4CAF50" strokeWidth="1"></path>
                <path d="M3 16C2 16 2 18 3 18" fill="#4CAF50" stroke="#4CAF50" strokeWidth="1"></path>
                <path d="M21 16C22 16 22 18 21 18" fill="#4CAF50" stroke="#4CAF50" strokeWidth="1"></path>
            </svg>
        </div>
      <div className="flex flex-col">
        <h2 className="text-md font-bold tracking-tight text-primary">Mianwali Petroleum</h2>
        <p className="text-xs text-muted-foreground -mt-1">Service Mianwali</p>
      </div>
    </div>
);


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const getPageTitle = () => {
    for (const item of navItems) {
      if ('href' in item && item.href === pathname) return item.label;
      if ('subItems' in item) {
        const subItem = item.subItems.find(sub => sub.href === pathname);
        if (subItem) return subItem.label;
      }
    }
    return 'Dashboard';
  }
  const pageTitle = getPageTitle();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4 border-b border-sidebar-border'>
            <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) => (
              'href' in item ? (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarGroup key={index}>
                  <SidebarGroupLabel className="flex items-center gap-2">
                    <item.icon />
                    {item.label}
                  </SidebarGroupLabel>
                  <SidebarMenuSub>
                    {item.subItems.map((sub, subIndex) => (
                      <SidebarMenuSubItem key={subIndex}>
                          <SidebarMenuSubButton asChild isActive={pathname === sub.href}>
                              <Link href={sub.href}>
                                  <sub.icon />
                                  <span>{sub.label}</span>
                              </Link>
                          </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarGroup>
              )
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 p-4 backdrop-blur-sm md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <h2 className="text-xl font-semibold md:hidden">{pageTitle}</h2>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
