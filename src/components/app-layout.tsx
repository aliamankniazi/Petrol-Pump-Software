
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
       <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 8h.01"></path>
                <path d="M6 8h.01"></path>
                <path d="M10 4h.01"></path>
                <path d="M18 8h.01"></path>
                <path d="m3 22 1.3-1.3a1.5 1.5 0 0 0 0-2.1L3 17"></path>
                <path d="m19 17-1.3 1.3a1.5 1.5 0 0 0 0 2.1L19 22"></path>
                <path d="M10 18h4"></path>
                <path d="M12 14v4"></path>
                <path d="M10 10h.01"></path>
                <path d="M14 10h.01"></path>
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
