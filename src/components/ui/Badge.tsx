// 🎨 BADGE COMPONENT

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default' | 'pro';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge',
        `badge-${variant}`,
        `badge-${size}`
      )}
    >
      {children}
    </span>
  );
}
