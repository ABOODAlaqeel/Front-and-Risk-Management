export interface CommitteeMeeting {
  id: number;
  date: string;
  topic: string;
  notes?: string;
  decision?: string;
  created_by_id?: number;
}

export interface CommitteeEscalation {
  id: number;
  risk_id: number;
  meeting_id?: number;
  status?: string;
  action?: string;
  decision?: string;
  created_at?: string;
  created_by_id?: number;
}
import type {
  RiskCategory,
  RiskStatus,
  TreatmentApproach,
  ActionStatus,
  RiskStage,
  UserRole,
} from "@/utils/constants";

// ===========================================
// Re-export Backend Types
// ===========================================
export * from "./backend";

// ===========================================
// Frontend Types (Used in UI Components)
// ===========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  /** Backend ID (numeric) - used for API calls */
  _backendId?: number;
  /** User permissions from backend */
  permissions?: string[];
}

export interface StageHistory {
  stage: RiskStage;
  date: string;
  notes: string;
  updatedBy: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  owner: string;
  status: RiskStatus;
  likelihood: number;
  impact: number;
  score: number;
  level: string;
  createdAt: string;
  updatedAt: string;
  stagesHistory: StageHistory[];
  /** Backend ID (numeric) - used for API calls */
  _backendId?: number;
  /** Backend category ID - used for API calls */
  _categoryId?: number;
  /** Backend owner ID - used for API calls */
  _ownerId?: number;
  /** Backend detailed status */
  _backendStatus?: string;
}

export interface Assessment {
  id: string;
  riskId: string;
  likelihood: number;
  impact: number;
  score: number;
  level: string;
  assessor: string;
  date: string;
  notes: string;
  /** Backend ID (numeric) - used for API calls */
  _backendId?: number;
  /** Backend risk ID (numeric) */
  _backendRiskId?: number;
  /** Assessment type: inherent or residual */
  _type?: "inherent" | "residual";
}

export interface TreatmentAction {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
  evidenceLink?: string;
  /** Backend ID (numeric) - used for API calls */
  _backendId?: number;
  /** Backend assignee ID */
  _assigneeId?: number;
}

export interface Treatment {
  id: string;
  riskId: string;
  approach: TreatmentApproach;
  actions: TreatmentAction[];
  createdAt: string;
  updatedAt: string;
  /** Backend ID (numeric) - used for API calls */
  _backendId?: number;
  /** Backend risk ID (numeric) */
  _backendRiskId?: number;
  /** Backend treatment plan title */
  _title?: string;
  /** Backend treatment plan status */
  _status?: string;
  /** Backend treatment plan progress */
  _progress?: number;
}

export interface KRI {
  id: string;
  riskId?: string;
  metricName: string;
  value: number;
  targetValue: number;
  status: "green" | "yellow" | "red";
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  /** Backend ID (numeric) */
  _backendId?: number;
}

export interface BCPService {
  id: string;
  name: string;
  criticality: "Critical" | "High" | "Medium" | "Low";
  rto: string;
  rpo: string;
  dependencies: string[];
  owner: string;
}

export interface BCPTest {
  id: string;
  name: string;
  type: "BCP" | "DR";
  date: string;
  status: "Planned" | "Passed" | "Failed";
  durationMinutes?: number;
  notes?: string;
  serviceIds?: string[];
  drTargetId?: string;
}

export interface DRSite {
  id: string;
  name: string;
  code?: string;
  description?: string;
  site_type?: string;
  siteType?: string;
  location?: string;
  capacity?: number;
  rto?: string;
  rpo?: string;
  is_primary?: boolean;
  isPrimary?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  notes?: string;
  last_tested_at?: string;
}

export interface Incident {
  id: string;
  riskId: string;
  title: string;
  date: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Investigating" | "Resolved";
}

// ===========================================
// API Response Types (for frontend consumption)
// ===========================================

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
