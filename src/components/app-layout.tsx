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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { History, FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen, HandCoins, ArrowRightLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

const navItems = [
  { href: '/', label: 'Sale', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: History },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/customer-payments', label: 'Customer Payments', icon: HandCoins },
  { href: '/cash-advances', label: 'Cash Advances', icon: ArrowRightLeft },
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

const FuelFlowLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M38.4,38.2c-1.9-0.9-3-2.6-3.7-4.4l-7.2-19.1c-0.7-1.9-2.6-3.7-4.4-3.7h-1.9c-1.9,0-3,1.9-3.7,3.7l-7.2,19.1 c-0.7,1.9-1.9,3.7-3.7,4.4L5,39.1c-1.9,0-3.7-0.7-4.4-2.6c-0.7-1.9,0-4.4,1.9-5.3l7.2-4.4c1.9-0.7,3-2.6,3.7-4.4L20.6,5.3 c0.7-1.9,2.6-3.7,4.4-3.7h1.9c1.9,0,3.7,1.9,4.4,3.7l7.2,19.1c0.7,1.9,2.6,3.7,4.4,4.4l7.2,4.4c1.9,0.7,2.6,3,1.9,5.3 c-0.7,1.9-2.6,2.6-4.4,2.6L38.4,38.2z" fill="#007bff"/>
        <path d="M12.7,12.1c-2.4-0.9-4.8-1.7-7.2-2.6c-1.5-0.5-2.6-1.7-2.8-3.3C2.5,4.7,3.5,3.3,5,2.8c2.4-0.9,4.8-1.7,7.2-2.6 c1.5-0.5,3.3,0.2,4,1.7c0.7,1.5,0.2,3.3-1.3,4C13.5,11.2,13.1,11.6,12.7,12.1z" fill="#ffc107"/>
        <text x="50" y="30" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fill="#007bff">FUEL</text>
        <text x="100" y="30" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fill="#ff9900">FLOW</text>
    </svg>
);


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const pageTitle = navItems.find(item => item.href === pathname)?.label ?? 'Dashboard';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4'>
            <div className="flex items-center gap-2">
                <FuelFlowLogo className="w-auto h-8" />
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
        <SidebarFooter>
           <div className="px-4 py-2 text-center text-xs text-sidebar-foreground/70">
                <p className="font-semibold">FuelFlow Lite</p>
                <p>By Mayuri K Freelancer</p>
            </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
                <LogOut />
                Sign Out
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
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
