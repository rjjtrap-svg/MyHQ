"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Log Deal", icon: "✍️" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/deals", label: "All Deals", icon: "📋" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={pathname === tab.href ? "active" : ""}>
          <span className="icon">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
