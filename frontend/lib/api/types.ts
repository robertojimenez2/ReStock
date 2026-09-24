// ── Enums ──────────────────────────────────────────────────────────
export type UserRole = "company_user" | "company_admin" | "platform_admin";

export type MaterialStatus = "active" | "pending" | "rejected";
export type SurplusStatus = "available" | "reserved" | "sold" | "inactive";
export type NeedStatus = "active" | "fulfilled" | "inactive";
export type OfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "countered"
  | "cancelled"
  | "expired";
export type TransactionStatus =
  | "pending"
  | "in_transit"
  | "completed"
  | "cancelled";
export type SpecificationDataType = "number" | "text" | "boolean";
export type NotificationType =
  | "offer_received"
  | "offer_accepted"
  | "offer_rejected"
  | "offer_countered"
  | "offer_cancelled"
  | "transaction_status_changed"
  | "material_approved"
  | "material_rejected";

// ── Auth ───────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ── Company ────────────────────────────────────────────────────────
export interface Company {
  id: number;
  name: string;
  legal_name: string;
  industry: string;
  description: string | null;
  city: string;
  state: string;
  address: string | null;
  created_at: string;
}

// ── User ───────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  company_id: number;
  created_at: string;
}

// ── Material ───────────────────────────────────────────────────────
export interface Material {
  id: number;
  name: string;
  category: string;
  description: string | null;
  status: MaterialStatus;
  proposed_by_company_id: number | null;
  created_at: string;
  updated_at: string;
}

// ── Specification ──────────────────────────────────────────────────
export interface Specification {
  id: number;
  material_id: number;
  name: string;
  data_type: SpecificationDataType;
  unit: string | null;
  description: string | null;
  is_required: boolean;
  created_at: string;
}

// ── Surplus ────────────────────────────────────────────────────────
export interface SurplusSpecification {
  id: number;
  specification_id: number;
  value_number: string | null;
  value_text: string | null;
  value_boolean: boolean | null;
}

export interface Surplus {
  id: number;
  company_id: number;
  material_id: number;
  quantity: string;
  unit: string;
  unit_price: string;
  description: string | null;
  status: SurplusStatus;
  specifications: SurplusSpecification[];
  created_at: string;
  updated_at: string;
}

// ── Need ───────────────────────────────────────────────────────────
export interface NeedSpecification {
  id: number;
  specification_id: number;
  value_number: string | null;
  min_value_number: string | null;
  max_value_number: string | null;
  value_text: string | null;
  value_boolean: boolean | null;
}

export interface Need {
  id: number;
  company_id: number;
  material_id: number;
  quantity: string;
  unit: string;
  max_price: string | null;
  description: string | null;
  status: NeedStatus;
  specifications: NeedSpecification[];
  created_at: string;
  updated_at: string;
}

// ── Match ──────────────────────────────────────────────────────────
export interface MatchBreakdown {
  material: number;
  quantity: number;
  location: number;
  price: number;
  specifications: number;
}

export interface MatchCompanyInfo {
  id: number;
  name: string;
  city: string;
  state: string;
}

export interface Match {
  score: number;
  breakdown: MatchBreakdown;
  notes: string[];
  counterpart_company: MatchCompanyInfo;
  surplus: Surplus | null;
  need: Need | null;
}

// ── Offer ──────────────────────────────────────────────────────────
export interface Offer {
  id: number;
  surplus_id: number;
  offered_by_company_id: number;
  offered_to_company_id: number;
  parent_offer_id: number | null;
  quantity: string;
  unit_price: string;
  message: string | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

// ── Transaction ────────────────────────────────────────────────────
export interface Transaction {
  id: number;
  offer_id: number;
  surplus_id: number;
  seller_company_id: number;
  buyer_company_id: number;
  quantity: string;
  unit_price: string;
  total_amount: string;
  notes: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// ── Notification ───────────────────────────────────────────────────
export interface Notification {
  id: number;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

// ── Dashboard ──────────────────────────────────────────────────────
export interface DashboardSurplusSummary {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  inactive: number;
  total_value_available: string;
}

export interface DashboardNeedSummary {
  total: number;
  active: number;
  fulfilled: number;
  inactive: number;
}

export interface DashboardOfferSummary {
  pending_received: number;
  pending_sent: number;
  accepted: number;
  rejected: number;
  countered: number;
  cancelled: number;
  expired: number;
}

export interface DashboardTransactionSummary {
  pending: number;
  in_transit: number;
  completed: number;
  cancelled: number;
  total_completed_amount: string;
}

export interface Dashboard {
  company: MatchCompanyInfo;
  surpluses: DashboardSurplusSummary;
  needs: DashboardNeedSummary;
  offers: DashboardOfferSummary;
  transactions: DashboardTransactionSummary;
  recent_offers: Offer[];
  recent_transactions: Transaction[];
}

// ── Valuation ──────────────────────────────────────────────────────
export interface Valuation {
  surplus_id: number;
  seller_company_id: number;
  buyer_company_id: number;
  quantity: string;
  unit_price: string;
  gross_value: string;
  logistics_cost: string;
  net_value: string;
  distance_km: number;
  distance_source: string;
  material_multiplier: number;
  estimated_delivery_days: number;
  notes: string[];
}

// ── Payloads de creación / update ──────────────────────────────────
export interface RegisterPayload {
  company: {
    name: string;
    legal_name: string;
    industry: string;
    description?: string;
    city: string;
    state: string;
    address?: string;
  };
  user: {
    email: string;
    full_name: string;
    password: string;
  };
}

export interface SurplusSpecificationInput {
  specification_id: number;
  value_number?: string | null;
  value_text?: string | null;
  value_boolean?: boolean | null;
}

export interface SurplusCreatePayload {
  material_id: number;
  quantity: string;
  unit: string;
  unit_price: string;
  description?: string | null;
  specifications: SurplusSpecificationInput[];
}

export interface NeedSpecificationInput {
  specification_id: number;
  value_number?: string | null;
  min_value_number?: string | null;
  max_value_number?: string | null;
  value_text?: string | null;
  value_boolean?: boolean | null;
}

export interface NeedCreatePayload {
  material_id: number;
  quantity: string;
  unit: string;
  max_price?: string | null;
  description?: string | null;
  specifications: NeedSpecificationInput[];
}

export interface OfferCreatePayload {
  surplus_id: number;
  quantity: string;
  unit_price: string;
  message?: string | null;
}

export interface OfferCounterPayload {
  quantity: string;
  unit_price: string;
  message?: string | null;
}