import type { Notification, NotificationType } from "@/lib/api";
import { formatCurrency, formatQuantity } from "@/lib/format";

export interface NotificationContent {
  title: string;
  body: string;
  href: string;
}

type Payload = Record<string, unknown>;

function p(payload: Payload, key: string): string {
  const value = payload[key];
  return value == null ? "" : String(value);
}

export function getNotificationContent(
  n: Notification
): NotificationContent {
  const { type, payload } = n;

  switch (type) {
    case "offer_received":
      return {
        title: "Nueva oferta recibida",
        body: `${p(payload, "from_company_name")} ofertó ${formatQuantity(p(payload, "quantity"))} a ${formatCurrency(p(payload, "unit_price"))}`,
        href: `/ofertas/${p(payload, "offer_id")}`,
      };

    case "offer_accepted":
      return {
        title: "Oferta aceptada",
        body: `${p(payload, "from_company_name")} aceptó tu oferta. Se creó una transacción por ${formatCurrency(p(payload, "total_amount"))}.`,
        href: `/transacciones/${p(payload, "transaction_id")}`,
      };

    case "offer_rejected":
      return {
        title: "Oferta rechazada",
        body: `${p(payload, "from_company_name")} rechazó tu oferta.`,
        href: `/ofertas/${p(payload, "offer_id")}`,
      };

    case "offer_countered":
      return {
        title: "Contraoferta",
        body: `${p(payload, "from_company_name")} propuso ${formatQuantity(p(payload, "quantity"))} a ${formatCurrency(p(payload, "unit_price"))}.`,
        href: `/ofertas/${p(payload, "offer_id")}`,
      };

    case "offer_cancelled":
      return {
        title: "Oferta cancelada",
        body: `${p(payload, "from_company_name")} canceló su oferta.`,
        href: `/ofertas/${p(payload, "offer_id")}`,
      };

    case "transaction_status_changed": {
      const newStatus = p(payload, "new_status");
      const label = STATUS_LABELS[newStatus] ?? newStatus;
      return {
        title: `Transacción ${label.toLowerCase()}`,
        body: `${p(payload, "from_company_name")} cambió el estado a "${label}".`,
        href: `/transacciones/${p(payload, "transaction_id")}`,
      };
    }

    case "material_approved":
      return {
        title: "Material aprobado",
        body: `"${p(payload, "material_name")}" fue aprobado y ya está en el catálogo.`,
        href: `/materiales/${p(payload, "material_id")}`,
      };

    case "material_rejected":
      return {
        title: "Material rechazado",
        body: `"${p(payload, "material_name")}" fue rechazado por un administrador.`,
        href: `/materiales/${p(payload, "material_id")}`,
      };

    default:
      return {
        title: "Notificación",
        body: "Tienes una notificación nueva.",
        href: "/notificaciones",
      };
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_transit: "En tránsito",
  completed: "Completada",
  cancelled: "Cancelada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  countered: "Contraofertada",
  expired: "Expirada",
};

export type { NotificationType };