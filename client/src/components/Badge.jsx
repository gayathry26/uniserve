import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    primary: 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] border-transparent font-semibold',
    secondary: 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    outline: 'bg-transparent text-foreground border-neutral-400 dark:border-neutral-600 font-medium',
    success: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    warning: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    danger: 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-400 dark:border-neutral-600 font-medium',
    error: 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-400 dark:border-neutral-600 font-medium',
    info: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    cyan: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    purple: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    coding: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    'non-coding': 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    creative: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    emerging: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    management: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
    hybrid: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 font-medium',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function CategoryBadge({ category, children, size = 'md', className = '' }) {
  const norm = (category || '').toLowerCase().replace(/\s+/g, '-');
  return (
    <Badge variant={norm} size={size} className={className}>
      {children || category}
    </Badge>
  );
}

export function StatusBadge({ status, className = '' }) {
  const map = {
    ACTIVE: { variant: 'default', label: 'Active' },
    PLACED: { variant: 'primary', label: 'Placed' },
    ACCEPTED: { variant: 'primary', label: 'Accepted' },
    OFFERED: { variant: 'secondary', label: 'Offered' },
    SHORTLISTED: { variant: 'default', label: 'Shortlisted' },
    IN_PROCESS: { variant: 'default', label: 'In Process' },
    APPLIED: { variant: 'default', label: 'Applied' },
    REGISTERED: { variant: 'default', label: 'Registered' },
    REJECTED: { variant: 'outline', label: 'Rejected' },
    SUPER_DREAM: { variant: 'primary', label: 'Super Dream' },
    DREAM: { variant: 'secondary', label: 'Dream' },
    REGULAR: { variant: 'default', label: 'Regular' },
    UPCOMING: { variant: 'default', label: 'Upcoming' },
    COMPLETED: { variant: 'primary', label: 'Completed' },
    VERIFIED: { variant: 'primary', label: 'Verified' },
    PENDING: { variant: 'default', label: 'Pending' },
  };

  const item = map[status] || { variant: 'default', label: status || 'Pending' };

  return <Badge variant={item.variant} className={className}>{item.label}</Badge>;
}
