'use client';
// src/components/layout/Navbar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PackagePlus,
  Layers,
  Bell,
  Glasses,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders/new', label: 'New Order', icon: PackagePlus },
  { href: '/inventory', label: 'Inventory', icon: Layers },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card/85 backdrop-blur-md border-b border-border z-40">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Left: Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 text-primary">
            <Glasses className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">ELU OMS</p>
            <p className="text-[10px] text-muted-foreground -mt-0.5 uppercase tracking-wider font-semibold">
              Eyewear Fulfillment
            </p>
          </div>
        </Link>

        {/* Center: Navigation */}
        <nav className="flex h-full items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname.startsWith(href) || (href === '/dashboard' && pathname === '/');

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 h-16 text-xs font-semibold uppercase tracking-wider transition-all border-b-2',
                  isActive
                    ? 'border-primary text-primary bg-primary/[0.03]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Status */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-muted text-[11px] font-medium text-muted-foreground border border-border">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            REAL-TIME SYNC
          </div>
        </div>
      </div>
    </header>
  );
}
