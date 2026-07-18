"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Submit", icon: "📸" },
  { href: "/installs", label: "My Installs", icon: "📋" },
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
