// Risk Matrix Thresholds
export const RISK_MATRIX_THRESHOLDS = {
  LOW: { max: 4, label: "Low", color: "status-low" },
  MEDIUM: { min: 5, max: 9, label: "Medium", color: "status-medium" },
  HIGH: { min: 10, max: 14, label: "High", color: "status-high" },
  CRITICAL: { min: 15, label: "Critical", color: "status-critical" },
};

const SETTINGS_KEY = "riskms_system_settings_v1";
const PERMISSIONS_KEY = "riskms_permissions_v1";

// ===========================================
// Backend Compatible Constants
// ===========================================

export const BACKEND_RISK_STATUSES = [
  "identified",
  "analyzing",
  "analyzed",
  "treating",
  "treated",
  "monitoring",
  "accepted",
  "closed",
] as const;

export type BackendRiskStatusType = (typeof BACKEND_RISK_STATUSES)[number];

export const BACKEND_TREATMENT_STRATEGIES = [
  "avoid",
  "mitigate",
  "transfer",
  "accept",
] as const;

export type BackendTreatmentStrategyType =
  (typeof BACKEND_TREATMENT_STRATEGIES)[number];

export const BACKEND_TREATMENT_STATUSES = [
  "draft",
  "pending",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type BackendTreatmentStatusType =
  (typeof BACKEND_TREATMENT_STATUSES)[number];

export const BACKEND_ACTION_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export type BackendActionPriorityType =
  (typeof BACKEND_ACTION_PRIORITIES)[number];

export const BACKEND_USER_ROLES = [
  "super_admin",
  "risk_manager",
  "risk_owner",
  "viewer",
] as const;

export type BackendUserRoleType = (typeof BACKEND_USER_ROLES)[number];

export const BACKEND_RISK_STATUS_LABELS: Record<
  BackendRiskStatusType,
  { ar: string; en: string }
> = {
  identified: { ar: "تم تحديده", en: "Identified" },
  analyzing: { ar: "قيد التحليل", en: "Analyzing" },
  analyzed: { ar: "تم تحليله", en: "Analyzed" },
  treating: { ar: "قيد المعالجة", en: "Treating" },
  treated: { ar: "تمت معالجته", en: "Treated" },
  monitoring: { ar: "تحت المراقبة", en: "Monitoring" },
  accepted: { ar: "مقبول", en: "Accepted" },
  closed: { ar: "مغلق", en: "Closed" },
};

export const BACKEND_TREATMENT_STRATEGY_LABELS: Record<
  BackendTreatmentStrategyType,
  { ar: string; en: string }
> = {
  avoid: { ar: "تجنب", en: "Avoid" },
  mitigate: { ar: "تخفيف", en: "Mitigate" },
  transfer: { ar: "نقل", en: "Transfer" },
  accept: { ar: "قبول", en: "Accept" },
};

export const BACKEND_TREATMENT_STATUS_LABELS: Record<
  BackendTreatmentStatusType,
  { ar: string; en: string }
> = {
  draft: { ar: "مسودة", en: "Draft" },
  pending: { ar: "قيد الانتظار", en: "Pending" },
  approved: { ar: "معتمدة", en: "Approved" },
  in_progress: { ar: "قيد التنفيذ", en: "In Progress" },
  completed: { ar: "مكتملة", en: "Completed" },
  cancelled: { ar: "ملغاة", en: "Cancelled" },
};

// ===========================================
// Original Frontend Constants
// ===========================================

export const getStoredRiskMatrixThresholds = (): {
  low: number;
  medium: number;
  high: number;
} | null => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const thresholds = (parsed as { riskMatrixThresholds?: unknown })
      .riskMatrixThresholds as
      | { low?: unknown; medium?: unknown; high?: unknown }
      | undefined;
    if (!thresholds) return null;

    const low = Number(thresholds.low);
    const medium = Number(thresholds.medium);
    const high = Number(thresholds.high);
    if (![low, medium, high].every(Number.isFinite)) return null;
    return { low, medium, high };
  } catch {
    return null;
  }
};

export const getRiskLevel = (
  score: number
): { label: string; color: string } => {
  const stored = getStoredRiskMatrixThresholds();
  const lowMax = stored?.low ?? RISK_MATRIX_THRESHOLDS.LOW.max;
  const mediumMax = stored?.medium ?? RISK_MATRIX_THRESHOLDS.MEDIUM.max;
  const highMax = stored?.high ?? RISK_MATRIX_THRESHOLDS.HIGH.max;

  if (score <= lowMax) return RISK_MATRIX_THRESHOLDS.LOW;
  if (score <= mediumMax) return RISK_MATRIX_THRESHOLDS.MEDIUM;
  if (score <= highMax) return RISK_MATRIX_THRESHOLDS.HIGH;
  return RISK_MATRIX_THRESHOLDS.CRITICAL;
};

export const RISK_CATEGORIES = [
  "Operational",
  "Financial",
  "Strategic",
  "Compliance",
  "Technology",
  "Reputational",
  "Environmental",
  "Security",
] as const;

export const RISK_STATUSES = ["Open", "Closed", "Monitoring"] as const;

export const TREATMENT_APPROACHES = [
  "Mitigate",
  "Transfer",
  "Avoid",
  "Accept",
] as const;

export const ACTION_STATUSES = ["Not Started", "In Progress", "Done"] as const;

export const RISK_STAGES = [
  "Context",
  "Identification",
  "Analysis",
  "Evaluation",
  "Treatment",
  "Monitoring",
] as const;

export const USER_ROLES = ["Admin", "Data Entry", "Viewer"] as const;

export type UserRole = (typeof USER_ROLES)[number];
// Risk categories are backend-driven; keep RISK_CATEGORIES as a fallback list.
export type RiskCategory = string;
export type RiskStatus = (typeof RISK_STATUSES)[number];
export type TreatmentApproach = (typeof TREATMENT_APPROACHES)[number];
export type ActionStatus = (typeof ACTION_STATUSES)[number];
export type RiskStage = (typeof RISK_STAGES)[number];

export const PERMISSIONS = {
  Admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewTreatments: true,
    canViewReports: true,
    canViewAnalysis: true,
    canViewBCP: true,
    canViewFollowUp: true,
    canExport: true,
    canViewSettings: true,
    canViewAudit: true,
    canManageUsers: true,
  },
  "Data Entry": {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canViewTreatments: true,
    canViewReports: true,
    canViewAnalysis: true,
    canViewBCP: true,
    canViewFollowUp: true,
    canExport: false,
    canViewSettings: false,
    canViewAudit: false,
    canManageUsers: false,
  },
  Viewer: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewTreatments: true,
    canViewReports: true,
    canViewAnalysis: true,
    canViewBCP: true,
    canViewFollowUp: true,
    canExport: false,
    canViewSettings: false,
    canViewAudit: false,
    canManageUsers: false,
  },
};

export type PermissionKey = keyof typeof PERMISSIONS.Admin;

const normalizePermissions = (input: unknown): typeof PERMISSIONS => {
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : null;
  const normalized = {} as typeof PERMISSIONS;

  for (const role of USER_ROLES) {
    const roleObj =
      obj && obj[role] && typeof obj[role] === "object"
        ? (obj[role] as Record<string, unknown>)
        : null;
    const base = PERMISSIONS[role];
    const out = {} as Record<PermissionKey, boolean>;

    (Object.keys(PERMISSIONS.Admin) as PermissionKey[]).forEach((key) => {
      const v = roleObj ? roleObj[key] : undefined;
      out[key] = typeof v === "boolean" ? v : base[key];
    });

    // Guardrail: never allow removing Settings access from Admin.
    if (role === "Admin") out.canViewSettings = true;

    normalized[role] = out as (typeof PERMISSIONS)[typeof role];
  }

  return normalized;
};

export const getEffectivePermissions = (): typeof PERMISSIONS => {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return PERMISSIONS;
    const parsed = JSON.parse(raw) as unknown;
    return normalizePermissions(parsed);
  } catch {
    return PERMISSIONS;
  }
};

export const saveEffectivePermissions = (next: typeof PERMISSIONS) => {
  try {
    localStorage.setItem(
      PERMISSIONS_KEY,
      JSON.stringify(normalizePermissions(next))
    );
  } catch {
    // ignore
  }
};

export const resetEffectivePermissions = () => {
  try {
    localStorage.removeItem(PERMISSIONS_KEY);
  } catch {
    // ignore
  }
};
