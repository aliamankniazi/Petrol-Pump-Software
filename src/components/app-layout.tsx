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
import { Fuel, History, FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { href: '/', label: 'Sale', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: History },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/purchase-returns', label: 'Purchase Returns', icon: Undo2 },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/human-resources', label: 'Human Resources', icon: Briefcase },
  { href: '/bank-management', label: 'Bank Management', icon: Landmark },
  { href: '/summary', label: 'Summary', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ShellLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M50,1.2c-1.9,0-3.8,0.2-5.6,0.5C21.4,5.4,5.4,21.4,1.7,44.4C-2.5,70,12.9,93.2,37.3,98.8c4.2,1,8.5,1.5,12.7,1.5 c1.9,0,3.8-0.2,5.6-0.5C78.6,96.1,94.6,80.1,98.3,57.1C102.5,31.5,87.1,8.3,62.7,2.7C58.5,1.8,54.2,1.2,50,1.2z" fill="#D71921"/>
        <path d="M50,13.8c-15.5,0-28.5,9.5-33.3,23c-1.3,3.7-2,7.6-2,11.7c0,5,1,9.8,2.8,14.3c4.3,10.6,13.7,18.4,24.9,21.3 c2.3,0.6,4.6,0.9,7,0.9c0.2,0,0.5,0,0.7,0c15.5,0,28.5-9.5,33.3-23c1.3-3.7,2-7.6,2-11.7c0-5-1-9.8-2.8-14.3 c-4.3-10.6-13.7-18.4-24.9-21.3C54.5,14.1,52.2,13.8,50,13.8z" fill="#FFD500"/>
        <path d="M50,1.2L50,1.2L50,1.2c-26.9,0-48.8,21.8-48.8,48.8c0,16.4,8.1,30.9,20.4,39.6V30.4C21.6,21.3,34.7,14,50,14 c15.3,0,28.4,7.3,37.2,18.5V29.3C78.2,14.6,65.3,1.2,50,1.2z" fill="#D71921"/>
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
            <ShellLogo className="text-primary w-8 h-8" />
            <h1 className="text-xl font-bold">Mianwali Petroleum</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
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
