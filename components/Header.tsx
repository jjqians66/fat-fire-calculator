"use client";

import Link from "next/link";
import { LocaleToggle, useLocale } from "@/lib/i18n/LocaleProvider";

export function Header() {
  const { t } = useLocale();
  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t.brand}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-neutral-600">
          <Link href="/" className="transition hover:text-neutral-950">
            {t.nav.cities}
          </Link>
          <Link href="/compare" className="transition hover:text-neutral-950">
            {t.nav.compare}
          </Link>
          <LocaleToggle />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="mx-auto max-w-7xl px-6 py-10 text-sm text-neutral-600">
      {t.footer}
    </footer>
  );
}
