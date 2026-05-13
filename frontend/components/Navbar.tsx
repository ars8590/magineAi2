import Link from 'next/link';
import { LogoLink } from './LogoLink';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">


        <LogoLink className="text-xl font-semibold text-white">
          MagineAI
        </LogoLink>
      </nav>
    </header>
  );
}

