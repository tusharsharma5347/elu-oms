'use client';
// src/components/dashboard/StatsBar.tsx
import { Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface StatsBarProps {
  totalActive: number;
  breachingSLA: number;
  atRisk: number;
  avgTAT: number;
}

export function StatsBar({ totalActive, breachingSLA, atRisk, avgTAT }: StatsBarProps) {
  const stats: Stat[] = [
    {
      label: 'Active Orders',
      value: totalActive,
      icon: <Package className="h-5 w-5" />,
      color: 'text-indigo-600',
      description: 'Non-terminal orders',
    },
    {
      label: 'Breaching SLA',
      value: breachingSLA,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: breachingSLA > 0 ? 'text-red-600' : 'text-green-600',
      description: 'Past expected delivery',
    },
    {
      label: 'At Risk',
      value: atRisk,
      icon: <TrendingUp className="h-5 w-5" />,
      color: atRisk > 0 ? 'text-amber-600' : 'text-green-600',
      description: 'Breach probability > 50%',
    },
    {
      label: 'Avg TAT',
      value: avgTAT > 0 ? `${avgTAT}h` : '—',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-teal-600',
      description: 'Average delivery time',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border border-border bg-card p-5 flex items-start gap-4 hover:bg-muted/40 transition-colors shadow-sm"
        >
          <div
            className={cn(
              'p-2.5 bg-secondary flex-shrink-0',
              stat.color
            )}
          >
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
              {stat.label}
            </p>
            <p className={cn('text-3xl font-bold tabular-nums', stat.color)}>
              {stat.value}
            </p>
            {stat.description && (
              <p className="text-xs text-muted-foreground/85 mt-0.5 truncate">{stat.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
