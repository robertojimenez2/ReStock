"use client";

import { Bell, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-900/80">
      <div className="flex h-full items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
        >
          ReStockMX
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/notificaciones"
            aria-label="Notificaciones"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md",
              "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
              "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            )}
          >
            <Bell className="h-4 w-4" />
          </Link>

          <div className="relative">
            <button
              type="button"
              aria-label="Menú de usuario"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-2",
                "text-sm text-neutral-700 hover:bg-neutral-100",
                "dark:text-neutral-200 dark:hover:bg-neutral-800"
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">
                {user?.full_name.charAt(0).toUpperCase() ?? "?"}
              </div>
              <span className="hidden md:inline truncate max-w-[140px]">
                {user?.full_name}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user?.email}
                  </p>
                </div>

                <Link
                  href="/empresas"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <UserIcon className="h-4 w-4" />
                  Mi empresa
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}