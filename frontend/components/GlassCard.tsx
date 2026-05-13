import { PropsWithChildren } from 'react';

type GlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`glass rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass ${className}`}
    >
      {children}
    </div>
  );
}

