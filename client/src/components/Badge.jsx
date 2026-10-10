import React from 'react';

export function Badge({ children, variant = 'default', size = 'md' }) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    ACTIVE: { variant: 'success', label: 'Active' },
    PLACED: { variant: 'success', label: 'Placed' },
    ACCEPTED: { variant: 'success', label: 'Accepted' },
    OFFERED: { variant: 'purple', label: 'Offered' },
    SHORTLISTED: { variant: 'primary', label: 'Shortlisted' },
    IN_PROCESS: { variant: 'warning', label: 'In Process' },
    APPLIED: { variant: 'cyan', label: 'Applied' },
    REGISTERED: { variant: 'primary', label: 'Registered' },
    REJECTED: { variant: 'danger', label: 'Rejected' },
    SUPER_DREAM: { variant: 'purple', label: 'Super Dream' },
    DREAM: { variant: 'primary', label: 'Dream' },
    REGULAR: { variant: 'default', label: 'Regular' },
    UPCOMING: { variant: 'warning', label: 'Upcoming' },
    COMPLETED: { variant: 'success', label: 'Completed' },
  };

  const item = map[status] || { variant: 'default', label: status || 'Pending' };

  return <Badge variant={item.variant}>{item.label}</Badge>;
}
