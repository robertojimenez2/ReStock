import {
  Archive,
  Ban,
  CheckCircle2,
  Clock,
  Inbox,
  PackageCheck,
  Repeat,
  Target,
  Timer,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type StatusColor =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "accent";

export interface StatusConfig {
  label: string;
  color: StatusColor;
  icon: LucideIcon;
}

// ── Surplus 
export type SurplusStatus = "available" | "reserved" | "sold" | "inactive";

const surplusStatus: Record<SurplusStatus, StatusConfig> = {
  available: { label: "Disponible", color: "success", icon: CheckCircle2 },
  reserved: { label: "Reservado", color: "warning", icon: Clock },
  sold: { label: "Vendido", color: "info", icon: PackageCheck },
  inactive: { label: "Inactivo", color: "neutral", icon: Archive },
};

// ── Need 
export type NeedStatus = "active" | "fulfilled" | "inactive";

const needStatus: Record<NeedStatus, StatusConfig> = {
  active: { label: "Activa", color: "success", icon: Target },
  fulfilled: { label: "Cumplida", color: "info", icon: CheckCircle2 },
  inactive: { label: "Inactiva", color: "neutral", icon: Archive },
};

// ── Material 
export type MaterialStatus = "active" | "pending" | "rejected";

const materialStatus: Record<MaterialStatus, StatusConfig> = {
  active: { label: "Activo", color: "success", icon: CheckCircle2 },
  pending: { label: "Pendiente", color: "warning", icon: Clock },
  rejected: { label: "Rechazado", color: "danger", icon: XCircle },
};

// ── Offer 
export type OfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "countered"
  | "cancelled"
  | "expired";

const offerStatus: Record<OfferStatus, StatusConfig> = {
  pending: { label: "Pendiente", color: "warning", icon: Clock },
  accepted: { label: "Aceptada", color: "success", icon: CheckCircle2 },
  rejected: { label: "Rechazada", color: "danger", icon: XCircle },
  countered: { label: "Contraofertada", color: "info", icon: Repeat },
  cancelled: { label: "Cancelada", color: "neutral", icon: Ban },
  expired: { label: "Expirada", color: "neutral", icon: Timer },
};

// ── Transaction 
export type TransactionStatus =
  | "pending"
  | "in_transit"
  | "completed"
  | "cancelled";

const transactionStatus: Record<TransactionStatus, StatusConfig> = {
  pending: { label: "Pendiente", color: "warning", icon: Clock },
  in_transit: { label: "En tránsito", color: "info", icon: Truck },
  completed: { label: "Completada", color: "success", icon: PackageCheck },
  cancelled: { label: "Cancelada", color: "danger", icon: Ban },
};

// ── Notification 
export type NotificationType =
  | "offer_received"
  | "offer_accepted"
  | "offer_rejected"
  | "offer_countered"
  | "offer_cancelled"
  | "transaction_status_changed"
  | "material_approved"
  | "material_rejected";

const notificationType: Record<NotificationType, StatusConfig> = {
  offer_received: { label: "Oferta recibida", color: "info", icon: Inbox },
  offer_accepted: { label: "Oferta aceptada", color: "success", icon: CheckCircle2 },
  offer_rejected: { label: "Oferta rechazada", color: "danger", icon: XCircle },
  offer_countered: { label: "Contraoferta", color: "info", icon: Repeat },
  offer_cancelled: { label: "Oferta cancelada", color: "neutral", icon: Ban },
  transaction_status_changed: { label: "Transacción", color: "info", icon: Truck },
  material_approved: { label: "Material aprobado", color: "success", icon: CheckCircle2 },
  material_rejected: { label: "Material rechazado", color: "danger", icon: XCircle },
};

// ── API pública 
const statusMaps = {
  surplus: surplusStatus,
  need: needStatus,
  material: materialStatus,
  offer: offerStatus,
  transaction: transactionStatus,
  notification: notificationType,
} as const;

export type StatusEntity = keyof typeof statusMaps;

export function getStatusConfig(
  entity: StatusEntity,
  status: string
): StatusConfig {
  const map = statusMaps[entity] as Record<string, StatusConfig>;
  return (
    map[status] ?? {
      label: status,
      color: "neutral",
      icon: Archive,
    }
  );
}