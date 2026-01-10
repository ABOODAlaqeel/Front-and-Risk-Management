/**
 *
 */

// ===========================================
// Enums from Backend
// ===========================================

export type BackendUserRole =
  | "super_admin"
  | "risk_manager"
  | "risk_owner"
  | "viewer";

export type BackendRiskStatus =
  | "identified"
  | "analyzing"
  | "analyzed"
  | "treating"
  | "treated"
  | "monitoring"
  | "accepted"
  | "closed";

export type BackendRiskLevel = "low" | "medium" | "high" | "critical";

export type BackendTreatmentStrategy =
  | "avoid"
  | "mitigate"
  | "transfer"
  | "accept";

export type BackendTreatmentStatus =
  | "draft"
  | "pending"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BackendActionPriority = "low" | "medium" | "high" | "urgent";

export type BackendAssessmentType = "inherent" | "residual";

export type BackendAssessmentStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

// ===========================================
// API Response Wrapper
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
    count?: number;
  };
  request_id?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
  };
}

// ===========================================
// Auth Types
// ===========================================

export interface BackendLoginRequest {
  email: string;
  password: string;
}

export interface BackendLoginResponse {
  access_token: string;
  refresh_token: string;
  user: BackendUser;
}

export interface BackendRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  department?: string;
  job_title?: string;
}

// ===========================================
// User Types
// ===========================================

export interface BackendUser {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  job_title?: string;
  role_id?: number;
  role?: BackendRole;
  is_active: boolean;
  last_login?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendRole {
  id: number;
  name: string;
  code: BackendUserRole;
  description?: string;
  is_system: boolean;
  is_default: boolean;
  permissions?: BackendPermission[];
}

export interface BackendPermission {
  id: number;
  name: string;
  code: string;
  description?: string;
  module: string;
}

// ===========================================
// Risk Types
// ===========================================

export interface BackendRiskCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  risks_count?: number;
}

export interface BackendRisk {
  id: number;
  code: string;
  /** Legacy backend field name */
  risk_code?: string;
  title: string;
  description: string;
  category_id?: number;
  category?: BackendRiskCategory;
  /** Legacy backend convenience field */
  category_name?: string;
  owner_id?: number;
  owner?: BackendUser;
  /** Legacy backend convenience field */
  owner_name?: string;
  created_by?: number;
  source?: string;
  potential_impact?: string;
  affected_areas?: string;
  status: BackendRiskStatus;
  inherent_likelihood?: number;
  inherent_impact?: number;
  inherent_score?: number;
  residual_likelihood?: number;
  residual_impact?: number;
  residual_score?: number;
  risk_level?: BackendRiskLevel;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendRiskCreateRequest {
  title: string;
  description: string;
  category_id: number;
  owner_id?: number;
  source?: string;
  potential_impact?: string;
  affected_areas?: string;
  status?: BackendRiskStatus;
}

export interface BackendRiskUpdateRequest {
  title?: string;
  description?: string;
  category_id?: number;
  owner_id?: number;
  source?: string;
  potential_impact?: string;
  affected_areas?: string;
  notes?: string;
}

// ===========================================
// Assessment Types
// ===========================================

export interface BackendAssessment {
  id: number;
  risk_id: number;
  risk?: BackendRisk;
  assessment_type: BackendAssessmentType;
  likelihood: number;
  impact: number;
  score: number;
  risk_level: BackendRiskLevel;
  rationale?: string;
  notes?: string;
  assessed_by?: number;
  assessor?: BackendUser;
  status: BackendAssessmentStatus;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendAssessmentCreateRequest {
  risk_id: number;
  assessment_type: BackendAssessmentType;
  likelihood: number;
  impact: number;
  rationale?: string;
  notes?: string;
}

// ===========================================
// Treatment Types
// ===========================================

export interface BackendTreatmentPlan {
  id: number;
  risk_id: number;
  risk?: BackendRisk;
  title: string;
  description?: string;
  strategy: BackendTreatmentStrategy;
  start_date?: string;
  target_date?: string;
  completion_date?: string;
  estimated_budget?: number;
  actual_cost?: number;
  assignee_id?: number;
  assignee?: BackendUser;
  created_by?: number;
  approved_by?: number;
  expected_residual_likelihood?: number;
  expected_residual_impact?: number;
  status: BackendTreatmentStatus;
  progress: number;
  notes?: string;
  actions?: BackendTreatmentAction[];
  created_at: string;
  updated_at: string;
}

export interface BackendTreatmentAction {
  id: number;
  plan_id: number;
  title: string;
  description?: string;
  priority: BackendActionPriority;
  due_date?: string;
  completion_date?: string;
  assignee_id?: number;
  assignee?: BackendUser;
  is_completed: boolean;
  completion_notes?: string;
  evidence_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendTreatmentPlanCreateRequest {
  risk_id: number;
  title: string;
  strategy: BackendTreatmentStrategy;
  description?: string;
  start_date?: string;
  target_date?: string;
  estimated_budget?: number;
  assignee_id?: number;
  expected_residual_likelihood?: number;
  expected_residual_impact?: number;
  notes?: string;
}

export interface BackendTreatmentActionCreateRequest {
  title: string;
  description?: string;
  priority?: BackendActionPriority;
  due_date?: string;
  assignee_id?: number;
  notes?: string;
}

// ===========================================
// Audit Log Types
// ===========================================

export interface BackendAuditLog {
  id: number;
  user_id?: number;
  user?: BackendUser;
  user_name?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  description?: string;
  context?: Record<string, unknown>;
  created_at: string;
}

// ===========================================
// Statistics Types
// ===========================================

export interface BackendRiskStats {
  total: number;
  by_status: Record<BackendRiskStatus, number>;
  by_level: Record<BackendRiskLevel, number>;
  by_category: Array<{
    category_id: number;
    category_name: string;
    count: number;
  }>;
}

export interface BackendTreatmentStats {
  total_plans: number;
  by_status: Record<BackendTreatmentStatus, number>;
  by_strategy: Record<BackendTreatmentStrategy, number>;
  overdue_count: number;
  total_actions: number;
  completed_actions: number;
  pending_actions: number;
}

// ===========================================
// Risk Matrix
// ===========================================

export interface BackendRiskMatrixCell {
  likelihood: number;
  impact: number;
  score: number;
  level: BackendRiskLevel;
  color: string;
}

export interface BackendRiskMatrixData {
  matrix: BackendRiskMatrixCell[][];
  likelihood_labels: Record<number, { name: string; description: string }>;
  impact_labels: Record<number, { name: string; description: string }>;
  level_labels: Record<
    BackendRiskLevel,
    { name: string; color: string; action: string }
  >;
}

// ===========================================
// BCP Models (Business Continuity Planning)
// ===========================================

export type BackendServiceCriticality = "critical" | "high" | "medium" | "low";

export type BackendBCPStatus =
  | "draft"
  | "active"
  | "under_review"
  | "approved"
  | "archived";

export type BackendDRSiteType =
  | "hot_site"
  | "warm_site"
  | "cold_site"
  | "cloud"
  | "mobile";

export type BackendBCPTestType =
  | "tabletop"
  | "walkthrough"
  | "simulation"
  | "parallel"
  | "full"
  | "dr";

export type BackendBCPTestStatus =
  | "planned"
  | "in_progress"
  | "passed"
  | "failed"
  | "cancelled"
  | "partial";

export interface BackendBusinessService {
  id: number;
  name: string;
  code?: string;
  description?: string;
  criticality: BackendServiceCriticality;
  rto?: string;
  rto_hours?: number;
  rpo?: string;
  rpo_hours?: number;
  dependencies?: string[];
  resources?: string[];
  owner_id?: number;
  owner?: BackendUser;
  department?: string;
  impact_analysis?: string;
  recovery_procedure?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendBCPPlan {
  id: number;
  title: string;
  version: string;
  description?: string;
  status: BackendBCPStatus;
  effective_date?: string;
  review_date?: string;
  last_reviewed_at?: string;
  approved_at?: string;
  sections?: string[];
  objectives?: string;
  scope?: string;
  assumptions?: string;
  emergency_contacts?: Array<{ name: string; phone: string; role: string }>;
  communication_plan?: string;
  activation_triggers?: string[];
  owner_id?: number;
  owner?: BackendUser;
  approved_by?: number;
  created_at: string;
  updated_at: string;
}

export interface BackendDRSite {
  id: number;
  name: string;
  code?: string;
  description?: string;
  site_type: BackendDRSiteType;
  location?: string;
  contact_info?: Record<string, string>;
  capacity?: number;
  available_resources?: string[];
  rto?: string;
  rto_hours?: number;
  rpo?: string;
  rpo_hours?: number;
  is_primary: boolean;
  is_active: boolean;
  last_tested_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendDRPlan {
  id: number;
  title: string;
  version: string;
  description?: string;
  status: BackendBCPStatus;
  effective_date?: string;
  last_updated?: string;
  rto?: string;
  rto_hours?: number;
  rpo?: string;
  rpo_hours?: number;
  recovery_procedures?: string[];
  testing_schedule?: Record<string, unknown>;
  emergency_contacts?: Array<{ name: string; phone: string; role: string }>;
  owner_id?: number;
  owner?: BackendUser;
  sites?: BackendDRSite[];
  created_at: string;
  updated_at: string;
}

export interface BackendBCPTest {
  id: number;
  name: string;
  code?: string;
  description?: string;
  test_type: BackendBCPTestType;
  status: BackendBCPTestStatus;
  scheduled_date?: string;
  actual_date?: string;
  duration_minutes?: number;
  service_ids?: number[];
  dr_site_id?: number;
  dr_site?: BackendDRSite;
  bcp_plan_id?: number;
  objectives?: string[];
  results?: string;
  findings?: string[];
  recommendations?: string[];
  success_rate?: number;
  evidence_url?: string;
  attachments?: string[];
  notes?: string;
  participants?: string[];
  coordinator_id?: number;
  coordinator?: BackendUser;
  created_at: string;
  updated_at: string;
}

// ===========================================
// KRI Model (Key Risk Indicators)
// ===========================================

export type BackendKRIStatus = "green" | "yellow" | "red";

export type BackendKRIFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually";

export interface BackendKRI {
  id: number;
  name: string;
  code?: string;
  description?: string;
  risk_id?: number;
  risk?: BackendRisk;
  current_value?: number;
  target_value?: number;
  min_value?: number;
  max_value?: number;
  threshold_yellow?: number;
  threshold_red?: number;
  is_higher_better: boolean;
  status: BackendKRIStatus;
  last_updated?: string;
  measurement_frequency: BackendKRIFrequency;
  next_measurement_date?: string;
  unit?: string;
  format_type: "number" | "percentage" | "currency";
  owner_id?: number;
  owner?: BackendUser;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ===========================================
// Incident Model
// ===========================================

export type BackendIncidentSeverity = "low" | "medium" | "high" | "critical";

export type BackendIncidentStatus =
  | "open"
  | "investigating"
  | "contained"
  | "resolved"
  | "closed";

export type BackendIncidentCategory =
  | "security"
  | "operational"
  | "financial"
  | "compliance"
  | "technology"
  | "environmental"
  | "human_error"
  | "external"
  | "other";

export interface BackendIncident {
  id: number;
  title: string;
  code?: string;
  description?: string;
  category: BackendIncidentCategory;
  severity: BackendIncidentSeverity;
  status: BackendIncidentStatus;
  risk_id?: number;
  risk?: BackendRisk;
  occurred_at: string;
  detected_at?: string;
  reported_at?: string;
  contained_at?: string;
  resolved_at?: string;
  closed_at?: string;
  impact_description?: string;
  financial_impact?: number;
  affected_users?: number;
  affected_systems?: string[];
  root_cause?: string;
  immediate_actions?: string[];
  corrective_actions?: string[];
  lessons_learned?: string;
  evidence?: string[];
  reported_by?: number;
  reporter?: BackendUser;
  assigned_to?: number;
  assignee?: BackendUser;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ===========================================
// Statistics for BCP, KRI, Incidents
// ===========================================

export interface BackendBCPStats {
  total_services: number;
  critical_services: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  upcoming_tests: number;
}

export interface BackendKRIStats {
  total: number;
  green: number;
  yellow: number;
  red: number;
}

export interface BackendIncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  closed: number;
  by_severity: Record<BackendIncidentSeverity, number>;
  by_category: Record<BackendIncidentCategory, number>;
}
