import Link from 'next/link';
import { ReactNode } from 'react';

interface LogoLinkProps {
    children: ReactNode;
    className?: string;
}

export function LogoLink({ children, className = '' }: LogoLinkProps) {
    return (
        <Link
            href="/"
            className={`cursor-pointer select-none transition-opacity hover:opacity-80 active:opacity-60 ${className}`}
            aria-label="MagineAI Home"
        >
            {children}
        </Link>
    );
}
