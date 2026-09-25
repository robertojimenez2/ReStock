"use client";

import { cn } from "@/lib/utils";

interface OfferTabsProps {
  value: "received" | "sent";
  onChange: (value: "received" | "sent") => void;
  receivedCount: number;
  sentCount: number;
}

export function OfferTabs({
  value,
  onChange,
  receivedCount,
  sentCount,
}: OfferTabsProps) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
      <Tab
        active={value === "received"}
        onClick={() => onChange("received")}
      >
        Recibidas
        <Badge>{receivedCount}</Badge>
      </Tab>
      <Tab active={value === "sent"} onClick={() => onChange("sent")}>
        Enviadas
        <Badge>{sentCount}</Badge>
      </Tab>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-500 text-white"
          : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
      )}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-mono font-medium">
      {children}
    </span>
  );
}