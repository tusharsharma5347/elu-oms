'use client';
// src/components/orders/AIRiskPanel.tsx
import { RISK_COLORS } from '@/lib/order-utils';
import type { Order } from '@/types';
import { cn } from '@/lib/utils';
import { BrainCircuit, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface AIRiskPanelProps {
  order: Order;
}

function parseRiskLevel(reasoning: string | null): string {
  if (!reasoning) return 'MEDIUM';
  const match = reasoning.match(/^\[(LOW|MEDIUM|HIGH|CRITICAL)\]/);
  return match?.[1] ?? 'MEDIUM';
}

function parseReasoning(reasoning: string | null): { text: string; action: string } {
  if (!reasoning) return { text: 'No AI analysis available.', action: 'Monitor order.' };
  const actionIdx = reasoning.indexOf('Action: ');
  if (actionIdx > -1) {
    return {
      text: reasoning.slice(0, actionIdx).replace(/^\[(LOW|MEDIUM|HIGH|CRITICAL)\]\s*/, '').trim(),
      action: reasoning.slice(actionIdx + 8).trim(),
    };
  }
  return {
    text: reasoning.replace(/^\[(LOW|MEDIUM|HIGH|CRITICAL)\]\s*/, '').trim(),
    action: 'No specific action recommended.',
  };
}

export function AIRiskPanel({ order }: AIRiskPanelProps) {
  const riskLevel = parseRiskLevel(order.ai_reasoning) as keyof typeof RISK_COLORS;
  const { text, action } = parseReasoning(order.ai_reasoning);
  const colors = RISK_COLORS[riskLevel] ?? RISK_COLORS.MEDIUM;
  const probability = order.breach_probability ?? 0;
  const probabilityPct = Math.round(probability * 100);

  const RiskIcon = riskLevel === 'LOW' ? CheckCircle :
                   riskLevel === 'MEDIUM' ? BrainCircuit :
                   riskLevel === 'HIGH' ? AlertTriangle : Zap;

  return (
    <div className="border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-border', colors.bg)}>
        <div className={cn('p-2 bg-card border border-border shadow-sm flex-shrink-0', colors.text)}>
          <RiskIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">AI Risk Assessment</p>
          <p className={cn('text-base font-bold', colors.text)}>
            {riskLevel} RISK
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground font-semibold">Breach Probability</p>
          <p className={cn('text-2xl font-extrabold tabular-nums', colors.text)}>
            {probabilityPct}%
          </p>
        </div>
      </div>

      {/* Probability Gauge */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
          <div className="h-3 w-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-700',
                probability < 0.5 ? 'bg-green-500' :
                probability < 0.75 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${probabilityPct}%` }}
            />
          </div>
          {/* Threshold markers */}
          <div className="relative h-2 mt-1">
            <div className="absolute left-[50%] top-0 w-px h-2 bg-border" />
            <div className="absolute left-[75%] top-0 w-px h-2 bg-border" />
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-muted/50 border border-border p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            🤖 Analysis
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
        </div>

        {/* Recommended Action */}
        <div className="bg-primary/10 border border-primary/20 p-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
            ⚡ Recommended Action
          </p>
          <p className="text-sm text-foreground/90">{action}</p>
        </div>

        {/* Powered by badge */}
        <p className="text-xs text-muted-foreground/60 text-right">
          Powered by Google Gemini AI
        </p>
      </div>
    </div>
  );
}
