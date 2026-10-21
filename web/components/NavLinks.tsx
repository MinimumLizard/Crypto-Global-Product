"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The main navigation, marking the section the visitor is in. A client component only because the current path is
// known there; the labels come from the server.
export default function NavLinks({ links, label }: { links: (readonly [string, string])[]; label: string }) {
  const path = usePathname() ?? "/";
  const current = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label={label}>
      {links.map(([href, text]) => (
        <Link key={href} href={href} aria-current={current(href) ? "page" : undefined}>
          {text}
        </Link>
      ))}
    </nav>
  );
}
