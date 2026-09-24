"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ThemeTransition() {
  const { resolvedTheme } = useTheme();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // No activar transición en el primer mount (sería un flash al cargar)
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const root = document.documentElement;
    root.classList.add("theme-transition");

    const timeout = window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [resolvedTheme]);

  return null;
}