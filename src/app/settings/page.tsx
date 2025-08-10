

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Settings, LayoutDashboard, Package } from 'lucide-react';

import Link from 'next/link';


export default function SettingsPage() {
  
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
             <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div><Label>Theme</Label><p className="text-sm text-muted-foreground">Switch between light and dark mode.</p></div>
                  <ThemeToggle />
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
    </>
  );
}

