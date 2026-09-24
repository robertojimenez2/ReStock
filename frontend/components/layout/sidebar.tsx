"use client";

import {
  Building2,
  Handshake,
  LayoutDashboard,
  Package,
  Search,
  ShoppingBag,
  Target,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Search },
  { href: "/excedentes", label: "Mis excedentes", icon: Package },
  { href: "/necesidades", label: "Mis necesidades", icon: Target },
  { href: "/ofertas", label: "Ofertas", icon: Handshake },
  { href: "/transacciones", label: "Transacciones", icon: Truck },
  { href: "/materiales", label: "Materiales", icon: ShoppingBag },
  { href: "/empresas", label: "Mi empresa", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900 lg:block">
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-100"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}