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
} from '@/components/ui/sidebar';
import { Fuel, History, FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { href: '/', label: 'Sale', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: History },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/purchase-returns', label: 'Purchase Returns', icon: Undo2 },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/employees', label: 'Employees', icon: Briefcase },
  { href: '/bank-management', label: 'Bank Management', icon: Landmark },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/summary', label: 'Summary', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ShellLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M29.998 13.578c0-3.11-1.332-6.13-3.69-8.41-2.439-2.36-5.63-3.71-8.998-3.71s-6.559 1.35-8.998 3.71c-2.358 2.28-3.69 5.3-3.69 8.41 0 .28.02.55.05.83-.34.33-.56.76-.56 1.22v4.8c0 .26.04.53.11.78.07.26.17.5.3 .73.19.34.46.62.79.82.69.42 1.57.51 2.37.26l.42-.13c.24-.07.49-.11.74-.11h15.9c.25 0 .5.04.74.11l.42.13c.8.25 1.68.16 2.37-.26.33-.2.6-.48.79-.82.13-.23.23-.47.3-.73.07-.25.11-.52.11-.78v-4.8c0-.46-.22-.89-.56-1.22.03-.28.05-.55.05-.83z" fill="#F4D40C"/>
    <path d="M29.998 13.578c0-3.11-1.332-6.13-3.69-8.41-2.439-2.36-5.63-3.71-8.998-3.71s-6.559 1.35-8.998 3.71c-2.358 2.28-3.69 5.3-3.69 8.41 0 .28.02.55.05.83-.34.33-.56.76-.56 1.22v4.8c0 .26.04.53.11.78.07.26.17.5.3 .73.19.34.46.62.79.82.69.42 1.57.51 2.37.26l.42-.13c.24-.07.49-.11.74-.11h15.9c.25 0 .5.04.74.11l.42.13c.8.25 1.68.16 2.37-.26.33-.2.6-.48.79-.82.13-.23.23-.47.3-.73.07-.25.11-.52.11-.78v-4.8c0-.46-.22-.89-.56-1.22.03-.28.05-.55.05-.83zM25.888 12.878l-3.32-3.26c-.34-.34-.78-.5-1.24-.5h-10c-.46 0-.9.16-1.24.5l-3.32 3.26c-.34.34-.5.77-.5 1.22v4.46c0 .45.16.89.5 1.22l.14.14c.34.33.78.5 1.24.5h15.72c.46 0 .9-.17 1.24-.5l.14-.14c.34-.33.5-.77-.5-1.22v-4.46c0-.45-.16-.88-.5-1.22z" fill="#D61821"/>
    <path d="M26.298 12.808c-.2-.2-.46-.3-.74-.3h-1.68l-3.33-3.26c-.34-.34-.78-.5-1.24-.5h-5.9c-.46 0-.9.16-1.24.5l-3.32 3.26h-1.68c-.28 0-.54.1-.74.3-.2.2-.3.45-.3.72v4.46c0 .27.1.52.3.72.2.2.46.3.74.3h17.82c.28 0 .54-.1.74-.3.2-.2.3-.45-.3-.72v-4.46c0-.27-.1-.52-.3-.72zM21.938 10.368h1.68v7.6h-1.68v-7.6zM18.898 10.368h1.68v7.6h-1.68v-7.6zM15.848 10.368h1.68v7.6h-1.68v-7.6zM12.798 10.368h1.68v7.6h-1.68v-7.6zM9.748 10.368h1.68v7.6h-1.68v-7.6zM8.318 12.808h-2.04c-.28 0-.54.1-.74.3-.2.2-.3.45-.3.72v1.5h2.51c.28 0 .54-.1.74-.3.2-.2.3-.45-.3-.72v-1.5z" fill="#F4D40C"/>
  </svg>
);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const pageTitle = navItems.find(item => item.href === pathname)?.label ?? 'Dashboard';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4'>
            <div className="flex items-center gap-2">
                <ShellLogo className="w-8 h-8" />
                <h1 className="text-lg font-semibold">Mianwali Petroleum Service</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.href}>
                 <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                   <Link href={item.href} legacyBehavior={false}>
                      <item.icon />
                      <span>{item.label}</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 p-4 backdrop-blur-sm md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <h2 className="text-xl font-semibold md:hidden">{pageTitle}</h2>
          <ThemeToggle />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
