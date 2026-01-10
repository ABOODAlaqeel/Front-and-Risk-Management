/**
 *
 */

import type {
  User,
  Risk,
  Assessment,
  Treatment,
  TreatmentAction,
  AuditLog,
  StageHistory,
  BCPService,
  BCPTest,
  DRSite,
  KRI,
  Incident,
} from "@/types";
import type {
  BackendUser,
  BackendRisk,
  BackendAssessment,
  BackendTreatmentPlan,
  BackendTreatmentAction,
  BackendAuditLog,
  BackendRiskStatus,
  BackendRiskLevel,
  BackendTreatmentStrategy,
  BackendUserRole,
  BackendBusinessService,
  BackendBCPTest,
  BackendDRSite,
  BackendKRI,
  BackendIncident,
  BackendServiceCriticality,
  BackendBCPTestStatus,
  BackendKRIStatus,
  BackendIncidentSeverity,
  BackendIncidentStatus,
} from "@/types/backend";
import type {
  UserRole,
  RiskStatus,
  TreatmentApproach,
  ActionStatus,
} from "@/utils/constants";

// ===========================================
// Role Mapping
// ===========================================

const BACKEND_TO_FRONTEND_ROLE: Record<BackendUserRole, UserRole> = {
  super_admin: "Admin",
  risk_manager: "Data Entry",
  risk_owner: "Data Entry",
  viewer: "Viewer",
};

const FRONTEND_TO_BACKEND_ROLE: Record<UserRole, BackendUserRole> = {
  Admin: "super_admin",
  "Data Entry": "risk_manager",
  Viewer: "viewer",
};

export const mapBackendRoleToFrontend = (role: BackendUserRole): UserRole => {
  return BACKEND_TO_FRONTEND_ROLE[role] || "Viewer";
};

export const mapFrontendRoleToBackend = (role: UserRole): BackendUserRole => {
  return FRONTEND_TO_BACKEND_ROLE[role] || "viewer";
};

// ===========================================
// Risk Status Mapping
// ===========================================

const BACKEND_TO_FRONTEND_STATUS: Record<BackendRiskStatus, RiskStatus> = {
  identified: "Open",
  analyzing: "Open",
  analyzed: "Open",
  treating: "Open",
  treated: "Monitoring",
  monitoring: "Monitoring",
  accepted: "Monitoring",
  closed: "Closed",
};

const FRONTEND_TO_BACKEND_STATUS: Record<RiskStatus, BackendRiskStatus> = {
  Open: "identified",
  Monitoring: "monitoring",
  Closed: "closed",
};

export const mapBackendStatusToFrontend = (
  status: BackendRiskStatus
): RiskStatus => {
  return BACKEND_TO_FRONTEND_STATUS[status] || "Open";
};

export const mapFrontendStatusToBackend = (
  status: RiskStatus
): BackendRiskStatus => {
  return FRONTEND_TO_BACKEND_STATUS[status] || "identified";
};

// ===========================================
// Risk Level Mapping
// ===========================================

const BACKEND_TO_FRONTEND_LEVEL: Record<BackendRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const FRONTEND_TO_BACKEND_LEVEL: Record<string, BackendRiskLevel> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
};

export const mapBackendLevelToFrontend = (level: BackendRiskLevel): string => {
  return BACKEND_TO_FRONTEND_LEVEL[level] || "Low";
};

export const mapFrontendLevelToBackend = (level: string): BackendRiskLevel => {
  return FRONTEND_TO_BACKEND_LEVEL[level] || "low";
};

// ===========================================
// Treatment Strategy Mapping
// ===========================================

const BACKEND_TO_FRONTEND_STRATEGY: Record<
  BackendTreatmentStrategy,
  TreatmentApproach
> = {
  avoid: "Avoid",
  mitigate: "Mitigate",
  transfer: "Transfer",
  accept: "Accept",
};

const FRONTEND_TO_BACKEND_STRATEGY: Record<
  TreatmentApproach,
  BackendTreatmentStrategy
> = {
  Avoid: "avoid",
  Mitigate: "mitigate",
  Transfer: "transfer",
  Accept: "accept",
};

export const mapBackendStrategyToFrontend = (
  strategy: BackendTreatmentStrategy
): TreatmentApproach => {
  return BACKEND_TO_FRONTEND_STRATEGY[strategy] || "Mitigate";
};

export const mapFrontendStrategyToBackend = (
  strategy: TreatmentApproach
): BackendTreatmentStrategy => {
  return FRONTEND_TO_BACKEND_STRATEGY[strategy] || "mitigate";
};

// ===========================================
// Action Status Mapping
// ===========================================

export const mapBackendActionStatusToFrontend = (
  isCompleted: boolean
): ActionStatus => {
  return isCompleted ? "Done" : "In Progress";
};

export const mapFrontendActionStatusToBackend = (
  status: ActionStatus
): boolean => {
  return status === "Done";
};

// ===========================================
// User Adapters
// ===========================================

export const adaptBackendUser = (user: BackendUser): User => {
  // Handle different role formats from backend
  let roleCode = "viewer";
  let permissions: string[] = [];

  if (user.role) {
    if (typeof user.role === "object" && user.role.code) {
      roleCode = user.role.code;
      if (
        (user.role as unknown as { permissions?: Array<{ code: string }> })
          .permissions
      ) {
        permissions = (
          user.role as unknown as { permissions: Array<{ code: string }> }
        ).permissions.map((p) => p.code);
      }
    } else if (typeof user.role === "string") {
      roleCode = user.role;
    }
  }

  // Also check role_name for admin detection
  const roleName = (user as unknown as Record<string, string>).role_name || "";
  if (
    roleName.includes("\u0645\u062f\u064a\u0631") ||
    roleName.toLowerCase().includes("admin")
  ) {
    roleCode = "super_admin";
  }

  return {
    id: String(user.id),
    _backendId: user.id,
    email: user.email,
    name: user.full_name,
    role: mapBackendRoleToFrontend(roleCode as BackendUserRole),
    avatar: user.avatar_url,
    permissions,
  };
};

export const adaptFrontendUserForCreate = (data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) => {
  return {
    full_name: data.name,
    email: data.email,
    password: data.password,
    // Note: role_id will need to be fetched from backend
  };
};

// ===========================================
// Risk Adapters
// ===========================================

export const adaptBackendRisk = (risk: BackendRisk): Risk => {
  const legacy = risk as unknown as {
    risk_code?: string;
    owner_name?: string;
    category_name?: string;
    category_code?: string;
  };
  const likelihood = risk.residual_likelihood ?? risk.inherent_likelihood ?? 1;
  const impact = risk.residual_impact ?? risk.inherent_impact ?? 1;
  const score =
    risk.residual_score ?? risk.inherent_score ?? likelihood * impact;
  const categoryCode =
    risk.category?.code ||
    risk.category?.name ||
    legacy.category_code ||
    legacy.category_name ||
    "operational";
  const category = mapBackendCategoryToFrontend(
    categoryCode
  ) as Risk["category"];
  const code = (risk as unknown as { code?: string }).code || legacy.risk_code;

  return {
    id: code || `RISK-${String(risk.id).padStart(3, "0")}`,
    title: risk.title,
    description: risk.description,
    category,
    owner: risk.owner?.full_name || legacy.owner_name || "-",
    status: mapBackendStatusToFrontend(risk.status),
    likelihood,
    impact,
    score,
    level: mapBackendLevelToFrontend(risk.risk_level || "low"),
    createdAt: risk.created_at,
    updatedAt: risk.updated_at,
    stagesHistory: [],
    _backendId: risk.id,
    _categoryId: risk.category_id,
    _ownerId: risk.owner_id,
    _backendStatus: risk.status,
  };
};

export const adaptFrontendRiskForUpdate = (
  risk: Partial<Risk>,
  categoryId?: number,
  ownerId?: number
) => {
  const data: Record<string, unknown> = {};

  if (risk.title) data.title = risk.title;
  if (risk.description) data.description = risk.description;
  if (categoryId) data.category_id = categoryId;
  if (ownerId !== undefined) data.owner_id = ownerId;

  return data;
};

// ===========================================
// Assessment Adapters
// ===========================================

export const adaptBackendAssessment = (
  assessment: BackendAssessment
): Assessment => {
  return {
    id: `ASS-${String(assessment.id).padStart(3, "0")}`,
    riskId:
      assessment.risk?.code ||
      `RISK-${String(assessment.risk_id).padStart(3, "0")}`,
    likelihood: assessment.likelihood,
    impact: assessment.impact,
    score: assessment.score,
    level: mapBackendLevelToFrontend(assessment.risk_level),
    assessor: assessment.assessor?.full_name || "-",
    date: assessment.created_at.split("T")[0],
    notes: assessment.notes || assessment.rationale || "",
  };
};

export const adaptFrontendAssessmentForCreate = (
  assessment: Omit<Assessment, "id" | "score" | "level">,
  riskId: number
) => {
  return {
    risk_id: riskId,
    assessment_type: "inherent",
    likelihood: assessment.likelihood,
    impact: assessment.impact,
    rationale: assessment.notes || "",
  };
};

export const adaptBackendAction = (
  action: BackendTreatmentAction
): TreatmentAction => {
  return {
    id: `ACT-${String(action.id).padStart(6, "0")}`,
    title: action.title,
    owner: action.assignee?.full_name || "-",
    dueDate: action.due_date || "",
    status: mapBackendActionStatusToFrontend(action.is_completed),
    evidenceLink: action.evidence_url,
    _assigneeId: action.assignee_id,
  };
};

export const adaptFrontendTreatmentForCreate = (
  treatment: Omit<Treatment, "id" | "createdAt" | "updatedAt">,
  riskId?: number
) => {
  return {
    title: (treatment as any)._title || "",
    risk_id: riskId,
    strategy: mapFrontendStrategyToBackend(treatment.approach),
    actions: (treatment.actions || []).map((a) => ({
      title: a.title,
      due_date: a.dueDate,
      assignee_id: (a as any)._assigneeId,
      is_completed: a.status === "Done",
    })),
  };
};

export const adaptFrontendActionForCreate = (
  action: Omit<TreatmentAction, "id">,
  assigneeId?: number
) => {
  return {
    title: action.title,
    due_date: action.dueDate,
    assignee_id: assigneeId,
    priority: "medium" as const,
  };
};

// Aliases for compatibility
export const adaptBackendTreatmentAction = adaptBackendAction;
export const mapFrontendApproachToBackend = mapFrontendStrategyToBackend;

// ===========================================
// Audit Log Adapters
// ===========================================

export const adaptBackendAuditLog = (log: BackendAuditLog): AuditLog => {
  return {
    id: `LOG-${String(log.id).padStart(3, "0")}`,
    timestamp: log.created_at,
    actor: log.user?.full_name || log.user_name || "System",
    action: log.action.toUpperCase(),
    entityType: log.entity_type,
    entityId: String(log.entity_id || ""),
    details: log.description || "",
  };
};

// ===========================================
// ID Extractors
// ===========================================

export const extractNumericId = (frontendId: string): number => {
  const match = frontendId.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

export const formatBackendId = (id: number, prefix: string): string => {
  return `${prefix}-${String(id).padStart(3, "0")}`;
};

// ===========================================
// Category Mapping Helper
// ===========================================
export const CATEGORY_CODE_MAP: Record<string, string> = {
  operational: "Operational",
  financial: "Financial",
  strategic: "Strategic",
  compliance: "Compliance",
  technology: "Technology",
  reputational: "Reputational",
  environmental: "Environmental",
  security: "Security",
};

export const mapBackendCategoryToFrontend = (code: string): string => {
  return CATEGORY_CODE_MAP[code.toLowerCase()] || code;
};

// ===========================================
// BCP Adapters
// ===========================================

const CRITICALITY_MAP: Record<
  BackendServiceCriticality,
  BCPService["criticality"]
> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const BCP_TEST_STATUS_MAP: Record<BackendBCPTestStatus, BCPTest["status"]> = {
  planned: "Planned",
  in_progress: "Planned",
  passed: "Passed",
  failed: "Failed",
  cancelled: "Failed",
  partial: "Passed",
};

export const adaptBackendBusinessService = (
  data: BackendBusinessService
): BCPService => {
  return {
    id: formatBackendId(data.id, "SVC"),
    name: data.name,
    criticality: CRITICALITY_MAP[data.criticality] || "Medium",
    rto: data.rto || "N/A",
    rpo: data.rpo || "N/A",
    dependencies: data.dependencies || [],
    owner: data.owner?.full_name || data.department || "Unassigned",
  };
};

export const adaptBackendDRSite = (data: BackendDRSite): DRSite => {
  return {
    id: formatBackendId(data.id, "DR"),
    name: data.name,
    code: data.code,
    description: data.description,
    site_type: data.site_type,
    siteType: data.site_type,
    location: data.location,
    capacity: data.capacity,
    rto: data.rto,
    rpo: data.rpo,
    is_primary: data.is_primary,
    isPrimary: data.is_primary,
    is_active: data.is_active,
    isActive: data.is_active,
    notes: data.notes,
    last_tested_at: data.last_tested_at,
  };
};

export const adaptBackendBCPTest = (data: BackendBCPTest): BCPTest => {
  return {
    id: formatBackendId(data.id, "TEST"),
    name: data.name,
    type: data.test_type === "dr" ? "DR" : "BCP",
    date:
      data.scheduled_date?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
    status: BCP_TEST_STATUS_MAP[data.status] || "Planned",
    durationMinutes: data.duration_minutes,
    notes: data.notes,
    serviceIds: data.service_ids?.map((id) => formatBackendId(id, "SVC")),
    drTargetId: data.dr_site_id
      ? formatBackendId(data.dr_site_id, "DR")
      : undefined,
  };
};

// ===========================================
// Treatment Adapters
// ===========================================

export const adaptBackendTreatment = (
  plan: BackendTreatmentPlan
): Treatment => {
  return {
    id: formatBackendId(plan.id, "TPL"),
    riskId:
      plan.risk?.code || `RISK-${String(plan.risk_id).padStart(3, "0")}`,
    approach: mapBackendStrategyToFrontend(plan.strategy),
    actions: (plan.actions || []).map(adaptBackendAction),
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    _backendId: plan.id,
    _backendRiskId: plan.risk_id,
    _title: plan.title,
    _status: plan.status,
    _progress: plan.progress,
  };
};


// ===========================================
// KRI Adapters
// ===========================================

const KRI_STATUS_MAP: Record<BackendKRIStatus, KRI["status"]> = {
  green: "green",
  yellow: "yellow",
  red: "red",
};

export const adaptBackendKRI = (data: BackendKRI): KRI => {
  return {
    id: formatBackendId(data.id, "KRI"),
    riskId: data.risk_id ? formatBackendId(data.risk_id, "RISK") : undefined,
    metricName: data.name,
    value: data.current_value || 0,
    targetValue: data.target_value || 0,
    status: KRI_STATUS_MAP[data.status] || "green",
    updatedAt:
      data.last_updated?.split("T")[0] || data.updated_at.split("T")[0],
  };
};

// ===========================================
// Incident Adapters
// ===========================================

const INCIDENT_SEVERITY_MAP: Record<
  BackendIncidentSeverity,
  Incident["severity"]
> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const INCIDENT_STATUS_MAP: Record<BackendIncidentStatus, Incident["status"]> = {
  open: "Open",
  investigating: "Investigating",
  contained: "Investigating",
  resolved: "Resolved",
  closed: "Resolved",
};

export const adaptBackendIncident = (data: BackendIncident): Incident => {
  return {
    id: formatBackendId(data.id, "INC"),
    riskId: data.risk_id ? formatBackendId(data.risk_id, "RISK") : "",
    title: data.title,
    date: data.occurred_at.split("T")[0],
    severity: INCIDENT_SEVERITY_MAP[data.severity] || "Medium",
    status: INCIDENT_STATUS_MAP[data.status] || "Open",
  };
};

// ===========================================
// Reverse Adapters (Frontend -> Backend)
// ===========================================

const FRONTEND_TO_BACKEND_CRITICALITY: Record<
  BCPService["criticality"],
  BackendServiceCriticality
> = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
};

const FRONTEND_TO_BACKEND_INCIDENT_SEVERITY: Record<
  Incident["severity"],
  BackendIncidentSeverity
> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
};

const FRONTEND_TO_BACKEND_INCIDENT_STATUS: Record<
  Incident["status"],
  BackendIncidentStatus
> = {
  Open: "open",
  Investigating: "investigating",
  Resolved: "resolved",
};

export const mapFrontendCriticalityToBackend = (
  criticality: BCPService["criticality"]
): BackendServiceCriticality => {
  return FRONTEND_TO_BACKEND_CRITICALITY[criticality] || "medium";
};

export const mapFrontendIncidentSeverityToBackend = (
  severity: Incident["severity"]
): BackendIncidentSeverity => {
  return FRONTEND_TO_BACKEND_INCIDENT_SEVERITY[severity] || "medium";
};

export const mapFrontendIncidentStatusToBackend = (
  status: Incident["status"]
): BackendIncidentStatus => {
  return FRONTEND_TO_BACKEND_INCIDENT_STATUS[status] || "open";
};
