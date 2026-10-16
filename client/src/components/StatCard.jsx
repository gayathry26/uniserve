import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, trend = null }) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm transition-all hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-600">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-lg border border-border bg-secondary text-foreground">
            <Icon className="w-5 h-5 text-foreground" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-secondary text-foreground border border-border">
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground font-normal">{subtitle}</p>
      )}
    </div>
  );
}
