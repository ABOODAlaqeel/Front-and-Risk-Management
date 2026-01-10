export { default as committeeApi } from "./committeeApi";
/**
 * API Module Exports
 *
 * ⚠️ PRODUCTION MODE - All data comes from Backend only
 * No mock data or demo mode
 */

// Axios instance and helpers
export { default as axiosInstance } from "./axiosInstance";
export {
  clearAuthData,
  saveAuthTokens,
  getAccessToken,
  isAuthenticated,
  extractData,
  buildQueryParams,
} from "./axiosInstance";

// Data adapters for Frontend <-> Backend conversion
export * from "./adapters";

// API modules (connected to Flask backend)
export { default as authApi } from "./authApi";
export { default as riskApi } from "./riskApi";
export { default as assessmentApi } from "./assessmentApi";
export { default as treatmentApi } from "./treatmentApi";
export { default as bcpApi } from "./bcpApi";
export { default as reportApi } from "./reportApi";
export { default as userApi } from "./userApi";
export { default as kriApi } from "./kriApi";
export { default as incidentApi } from "./incidentApi";
export { default as notificationApi } from "./notificationApi";
export { default as riskAppetiteApi } from "./riskAppetiteApi";
export { default as policyDocumentApi } from "./policyDocumentApi";