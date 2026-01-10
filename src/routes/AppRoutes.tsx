import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { Login } from "@/auth/Login";
import { ForgotPassword } from "@/auth/ForgotPassword";
import { ResetPassword } from "@/auth/ResetPassword";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/dashboard";
import { RiskList, RiskDetails, RiskForm, RisksDashboard } from "@/pages/risks";
import FollowUp from "@/pages/risks/FollowUp";
import AnalysisDashboard from "@/pages/analysis/AnalysisDashboard";
import RiskMatrixPage from "@/pages/analysis/RiskMatrixPage";
import AssessmentForm from "@/pages/assessments/AssessmentForm";
import TreatmentPlan from "@/pages/treatments/TreatmentPlan";
import BCPServices from "@/pages/bcp/BCPServices";
import BCPPlan from "@/pages/bcp/BCPPlan";
import DRPlan from "@/pages/bcp/DRPlan";
import BCPDashboard from "@/pages/bcp/BCPDashboard";
import BCPTests from "@/pages/bcp/BCPTests";
import BCPPlans from "@/pages/bcp/BCPPlans";
import Reports from "@/pages/reports/Reports";
import ReportsHome from "@/pages/reports/ReportsHome";
import Roles from "@/pages/settings/Roles";
import Permissions from "@/pages/settings/Permissions";
import SystemSettings from "@/pages/settings/SystemSettings";
import Users from "@/pages/settings/Users";
import BackupPage from "@/pages/settings/BackupPage";
import AuditLog from "@/pages/audit/AuditLog";
import ExecutiveReport from "@/pages/reports/ExecutiveReport";
import StandardReport from "@/pages/reports/StandardReport";
import CustomReport from "@/pages/reports/CustomReport";
import CommitteeGovernance from "@/pages/committee/CommitteeGovernance";
import { NotificationsPage } from "@/pages/notifications";
import { RiskAppetitePage } from "@/pages/risk-appetite";
import { PolicyDocumentsPage } from "@/pages/policies";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Policies & Procedures */}
        <Route path="/policies" element={<PolicyDocumentsPage />} />

        {/* Risks */}
        <Route path="/risks/dashboard" element={<RisksDashboard />} />
        <Route path="/risks" element={<RiskList />} />
        <Route
          path="/risks/new"
          element={
            <ProtectedRoute requirePermission="canCreate">
              <RiskForm />
            </ProtectedRoute>
          }
        />
        <Route path="/risks/:id" element={<RiskDetails />} />
        <Route
          path="/risks/:id/edit"
          element={
            <ProtectedRoute requirePermission="canEdit">
              <RiskForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/risks/followup"
          element={
            <ProtectedRoute requirePermission="canViewFollowUp">
              <FollowUp />
            </ProtectedRoute>
          }
        />

        {/* Analysis */}
        <Route
          path="/analysis/dashboard"
          element={
            <ProtectedRoute requirePermission="canViewAnalysis">
              <AnalysisDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis/matrix"
          element={
            <ProtectedRoute requirePermission="canViewAnalysis">
              <RiskMatrixPage />
            </ProtectedRoute>
          }
        />

        {/* Assessments */}
        <Route
          path="/assessments/new"
          element={
            <ProtectedRoute requirePermission="canCreate">
              <AssessmentForm />
            </ProtectedRoute>
          }
        />

        {/* Treatments */}
        <Route
          path="/treatments"
          element={
            <ProtectedRoute requirePermission="canViewTreatments">
              <TreatmentPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treatments/:riskId"
          element={
            <ProtectedRoute requirePermission="canViewTreatments">
              <TreatmentPlan />
            </ProtectedRoute>
          }
        />

        {/* BCP/DR */}
        <Route
          path="/bcp/dashboard"
          element={
            <ProtectedRoute requirePermission="canViewBCP">
              <BCPDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bcp/plans"
          element={
            <ProtectedRoute requirePermission="canViewBCP">
              <BCPPlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bcp/services"
          element={
            <ProtectedRoute requirePermission="canViewBCP">
              <BCPServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bcp/plan"
          element={
            <ProtectedRoute requirePermission="canViewBCP">
              <BCPPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bcp/dr"
          element={
            <ProtectedRoute requirePermission="canViewBCP">
              <DRPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bcp/tests"
          element={
            <ProtectedRoute requirePermission="canViewBCP">
              <BCPTests />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={<Navigate to="/reports/home" replace />}
        />
        <Route
          path="/reports/home"
          element={
            <ProtectedRoute requirePermission="canViewReports">
              <ReportsHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/register"
          element={
            <ProtectedRoute requirePermission="canViewReports">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/executive"
          element={
            <ProtectedRoute requirePermission="canViewReports">
              <ExecutiveReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/standard"
          element={
            <ProtectedRoute requirePermission="canViewReports">
              <StandardReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/custom"
          element={
            <ProtectedRoute requirePermission="canViewReports">
              <CustomReport />
            </ProtectedRoute>
          }
        />

        {/* Committee Governance */}
        <Route
          path="/committee"
          element={
            <ProtectedRoute requirePermission="canViewSettings">
              <CommitteeGovernance />
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Risk Appetite */}
        <Route
          path="/risk-appetite"
          element={
            <ProtectedRoute requirePermission="canViewSettings">
              <RiskAppetitePage />
            </ProtectedRoute>
          }
        />

        {/* Settings - Admin only */}
        <Route
          path="/settings/roles"
          element={
            <ProtectedRoute requirePermission="canViewSettings">
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/permissions"
          element={
            <ProtectedRoute requirePermission="canViewSettings">
              <Permissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/system"
          element={
            <ProtectedRoute requirePermission="canViewSettings">
              <SystemSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute requirePermission="canManageUsers">
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/backup"
          element={
            <ProtectedRoute requirePermission="canViewSettings">
              <BackupPage />
            </ProtectedRoute>
          }
        />

        {/* Audit - Admin only */}
        <Route
          path="/audit"
          element={
            <ProtectedRoute requirePermission="canViewAudit">
              <AuditLog />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
