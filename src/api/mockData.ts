import type { Risk, Assessment, Treatment, KRI, AuditLog, BCPService, BCPTest, Incident, User } from '@/types';
import { getRiskLevel } from '@/utils/constants';

export const mockUsers: User[] = [
  { id: '1', email: 'admin@company.com', name: 'John Admin', role: 'Admin' },
  { id: '2', email: 'analyst@company.com', name: 'Sarah Analyst', role: 'Data Entry' },
  { id: '3', email: 'viewer@company.com', name: 'Mike Viewer', role: 'Viewer' },
];

export const mockRisks: Risk[] = [
  {
    id: 'RISK-001',
    title: 'Cybersecurity Breach Risk',
    description: 'Potential unauthorized access to critical systems and data theft through sophisticated cyber attacks.',
    category: 'Security',
    owner: 'IT Security Team',
    status: 'Open',
    likelihood: 4,
    impact: 5,
    score: 20,
    level: getRiskLevel(20).label,
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-12-20T14:30:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-01-15', notes: 'Initial risk context established', updatedBy: 'John Admin' },
      { stage: 'Identification', date: '2025-01-20', notes: 'Risk identified through vulnerability assessment', updatedBy: 'Sarah Analyst' },
      { stage: 'Analysis', date: '2025-02-01', notes: 'Detailed analysis completed with threat modeling', updatedBy: 'Sarah Analyst' },
      { stage: 'Evaluation', date: '2025-02-15', notes: 'Risk evaluated as critical priority', updatedBy: 'John Admin' },
      { stage: 'Treatment', date: '2025-03-01', notes: 'Treatment plan implemented', updatedBy: 'IT Security Team' },
      { stage: 'Monitoring', date: '2025-03-15', notes: 'Continuous monitoring established', updatedBy: 'IT Security Team' },
    ],
  },
  {
    id: 'RISK-002',
    title: 'Supply Chain Disruption',
    description: 'Risk of major supplier failure affecting production capacity and delivery commitments.',
    category: 'Operational',
    owner: 'Supply Chain Manager',
    status: 'Monitoring',
    likelihood: 3,
    impact: 4,
    score: 12,
    level: getRiskLevel(12).label,
    createdAt: '2025-02-10T10:00:00Z',
    updatedAt: '2025-12-18T09:15:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-02-10', notes: 'Context defined for supply chain risks', updatedBy: 'John Admin' },
      { stage: 'Identification', date: '2025-02-15', notes: 'Critical suppliers identified', updatedBy: 'Supply Chain Manager' },
      { stage: 'Analysis', date: '2025-02-28', notes: 'Impact analysis on production', updatedBy: 'Sarah Analyst' },
    ],
  },
  {
    id: 'RISK-003',
    title: 'Regulatory Non-Compliance',
    description: 'Failure to meet new GDPR and data protection requirements could result in significant fines.',
    category: 'Compliance',
    owner: 'Legal & Compliance',
    status: 'Open',
    likelihood: 2,
    impact: 5,
    score: 10,
    level: getRiskLevel(10).label,
    createdAt: '2025-03-05T11:00:00Z',
    updatedAt: '2025-12-15T16:45:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-03-05', notes: 'Regulatory landscape mapped', updatedBy: 'Legal & Compliance' },
      { stage: 'Identification', date: '2025-03-10', notes: 'Compliance gaps identified', updatedBy: 'Legal & Compliance' },
    ],
  },
  {
    id: 'RISK-004',
    title: 'Market Volatility Impact',
    description: 'Economic downturn and market fluctuations affecting revenue projections and investments.',
    category: 'Financial',
    owner: 'CFO Office',
    status: 'Monitoring',
    likelihood: 4,
    impact: 4,
    score: 16,
    level: getRiskLevel(16).label,
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-12-22T11:00:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-01-20', notes: 'Market analysis context', updatedBy: 'CFO Office' },
      { stage: 'Identification', date: '2025-01-25', notes: 'Key market risks identified', updatedBy: 'CFO Office' },
      { stage: 'Analysis', date: '2025-02-05', notes: 'Financial impact modeled', updatedBy: 'Sarah Analyst' },
      { stage: 'Evaluation', date: '2025-02-20', notes: 'Risk prioritized for treatment', updatedBy: 'John Admin' },
    ],
  },
  {
    id: 'RISK-005',
    title: 'Key Personnel Departure',
    description: 'Loss of critical employees with specialized knowledge impacting operations.',
    category: 'Operational',
    owner: 'HR Department',
    status: 'Open',
    likelihood: 3,
    impact: 3,
    score: 9,
    level: getRiskLevel(9).label,
    createdAt: '2025-04-01T08:30:00Z',
    updatedAt: '2025-12-10T10:20:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-04-01', notes: 'HR risk context established', updatedBy: 'HR Department' },
      { stage: 'Identification', date: '2025-04-05', notes: 'Key roles identified', updatedBy: 'HR Department' },
    ],
  },
  {
    id: 'RISK-006',
    title: 'Technology Obsolescence',
    description: 'Legacy systems becoming unsupported, creating operational and security vulnerabilities.',
    category: 'Technology',
    owner: 'IT Operations',
    status: 'Open',
    likelihood: 4,
    impact: 3,
    score: 12,
    level: getRiskLevel(12).label,
    createdAt: '2025-05-15T14:00:00Z',
    updatedAt: '2025-12-19T15:30:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-05-15', notes: 'Technology landscape assessed', updatedBy: 'IT Operations' },
      { stage: 'Identification', date: '2025-05-20', notes: 'Legacy systems catalogued', updatedBy: 'IT Operations' },
      { stage: 'Analysis', date: '2025-06-01', notes: 'Migration complexity analyzed', updatedBy: 'Sarah Analyst' },
    ],
  },
  {
    id: 'RISK-007',
    title: 'Reputation Damage from Social Media',
    description: 'Negative publicity or viral incidents damaging brand reputation and customer trust.',
    category: 'Reputational',
    owner: 'Communications Team',
    status: 'Monitoring',
    likelihood: 3,
    impact: 4,
    score: 12,
    level: getRiskLevel(12).label,
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: '2025-12-21T12:00:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-06-01', notes: 'Social media landscape mapped', updatedBy: 'Communications Team' },
      { stage: 'Identification', date: '2025-06-05', notes: 'Potential reputation risks identified', updatedBy: 'Communications Team' },
      { stage: 'Analysis', date: '2025-06-15', notes: 'Response protocols analyzed', updatedBy: 'Sarah Analyst' },
      { stage: 'Evaluation', date: '2025-06-25', notes: 'Monitoring tools evaluated', updatedBy: 'John Admin' },
      { stage: 'Treatment', date: '2025-07-01', notes: 'Crisis communication plan developed', updatedBy: 'Communications Team' },
      { stage: 'Monitoring', date: '2025-07-10', notes: 'Active social monitoring enabled', updatedBy: 'Communications Team' },
    ],
  },
  {
    id: 'RISK-008',
    title: 'Climate Change Impact',
    description: 'Physical and transitional risks from climate change affecting facilities and operations.',
    category: 'Environmental',
    owner: 'Facilities Management',
    status: 'Open',
    likelihood: 2,
    impact: 4,
    score: 8,
    level: getRiskLevel(8).label,
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-12-05T14:00:00Z',
    stagesHistory: [
      { stage: 'Context', date: '2025-07-01', notes: 'Climate risk context established', updatedBy: 'Facilities Management' },
    ],
  },
];

export const mockAssessments: Assessment[] = [
  { id: 'ASS-001', riskId: 'RISK-001', likelihood: 4, impact: 5, score: 20, level: 'Critical', assessor: 'Sarah Analyst', date: '2025-02-01', notes: 'Initial assessment based on threat intelligence' },
  { id: 'ASS-002', riskId: 'RISK-001', likelihood: 3, impact: 5, score: 15, level: 'Critical', assessor: 'Sarah Analyst', date: '2025-06-01', notes: 'Re-assessment after implementing controls' },
  { id: 'ASS-003', riskId: 'RISK-002', likelihood: 3, impact: 4, score: 12, level: 'High', assessor: 'John Admin', date: '2025-02-28', notes: 'Supply chain vulnerability assessment' },
  { id: 'ASS-004', riskId: 'RISK-004', likelihood: 4, impact: 4, score: 16, level: 'Critical', assessor: 'CFO Office', date: '2025-02-05', notes: 'Financial impact assessment' },
];

export const mockTreatments: Treatment[] = [
  {
    id: 'TRT-001',
    riskId: 'RISK-001',
    approach: 'Mitigate',
    actions: [
      { id: 'ACT-001', title: 'Implement Multi-Factor Authentication', owner: 'IT Security', dueDate: '2025-03-15', status: 'Done', evidenceLink: 'https://evidence.com/mfa' },
      { id: 'ACT-002', title: 'Deploy Intrusion Detection System', owner: 'IT Security', dueDate: '2025-04-01', status: 'Done', evidenceLink: 'https://evidence.com/ids' },
      { id: 'ACT-003', title: 'Conduct Penetration Testing', owner: 'External Vendor', dueDate: '2025-06-30', status: 'In Progress' },
      { id: 'ACT-004', title: 'Security Awareness Training', owner: 'HR Department', dueDate: '2025-12-31', status: 'In Progress' },
    ],
    createdAt: '2025-03-01',
    updatedAt: '2025-12-20',
  },
  {
    id: 'TRT-002',
    riskId: 'RISK-002',
    approach: 'Transfer',
    actions: [
      { id: 'ACT-005', title: 'Review Insurance Coverage', owner: 'Risk Management', dueDate: '2025-04-15', status: 'Done' },
      { id: 'ACT-006', title: 'Identify Backup Suppliers', owner: 'Procurement', dueDate: '2025-05-01', status: 'Done' },
      { id: 'ACT-007', title: 'Negotiate Alternative Contracts', owner: 'Legal', dueDate: '2025-08-01', status: 'Not Started' },
    ],
    createdAt: '2025-03-15',
    updatedAt: '2025-11-10',
  },
];

export const mockKRIs: KRI[] = [
  { id: 'KRI-001', riskId: 'RISK-001', metricName: 'Security Incidents', value: 3, targetValue: 5, status: 'green', updatedAt: '2025-12-27' },
  { id: 'KRI-002', riskId: 'RISK-001', metricName: 'Unpatched Vulnerabilities', value: 12, targetValue: 10, status: 'yellow', updatedAt: '2025-12-27' },
  { id: 'KRI-003', riskId: 'RISK-002', metricName: 'Supplier Reliability Score', value: 78, targetValue: 85, status: 'yellow', updatedAt: '2025-12-26' },
  { id: 'KRI-004', riskId: 'RISK-003', metricName: 'Compliance Score', value: 95, targetValue: 100, status: 'green', updatedAt: '2025-12-25' },
  { id: 'KRI-005', metricName: 'System Uptime %', value: 99.8, targetValue: 99.9, status: 'green', updatedAt: '2025-12-27' },
  { id: 'KRI-006', metricName: 'Audit Findings Open', value: 8, targetValue: 5, status: 'red', updatedAt: '2025-12-27' },
  { id: 'KRI-007', riskId: 'RISK-004', metricName: 'Budget Variance %', value: -5.2, targetValue: 0, status: 'yellow', updatedAt: '2025-12-26' },
  { id: 'KRI-008', metricName: 'Employee Turnover Rate', value: 12, targetValue: 10, status: 'yellow', updatedAt: '2025-12-24' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'LOG-001', timestamp: '2025-12-27T14:30:00Z', actor: 'John Admin', action: 'UPDATE', entityType: 'Risk', entityId: 'RISK-001', details: 'Updated risk status to Monitoring' },
  { id: 'LOG-002', timestamp: '2025-12-27T12:15:00Z', actor: 'Sarah Analyst', action: 'CREATE', entityType: 'Assessment', entityId: 'ASS-004', details: 'Created new risk assessment' },
  { id: 'LOG-003', timestamp: '2025-12-26T16:45:00Z', actor: 'John Admin', action: 'DELETE', entityType: 'Treatment', entityId: 'TRT-003', details: 'Deleted outdated treatment plan' },
  { id: 'LOG-004', timestamp: '2025-12-26T10:00:00Z', actor: 'System', action: 'EXPORT', entityType: 'Report', entityId: 'Q4-2025', details: 'Quarterly report exported to PDF' },
  { id: 'LOG-005', timestamp: '2025-12-25T09:30:00Z', actor: 'Mike Viewer', action: 'VIEW', entityType: 'Risk', entityId: 'RISK-002', details: 'Viewed risk details' },
  { id: 'LOG-006', timestamp: '2025-12-24T14:00:00Z', actor: 'Sarah Analyst', action: 'UPDATE', entityType: 'Treatment', entityId: 'TRT-001', details: 'Updated action status to Done' },
  { id: 'LOG-007', timestamp: '2025-12-23T11:20:00Z', actor: 'John Admin', action: 'CREATE', entityType: 'Risk', entityId: 'RISK-008', details: 'Created new climate risk entry' },
  { id: 'LOG-008', timestamp: '2025-12-22T15:45:00Z', actor: 'System', action: 'ALERT', entityType: 'KRI', entityId: 'KRI-006', details: 'KRI threshold exceeded - audit findings' },
];

export const mockBCPServices: BCPService[] = [
  { id: 'SVC-001', name: 'Customer Portal', criticality: 'Critical', rto: '1 hour', rpo: '15 minutes', dependencies: ['Database', 'Auth Service', 'CDN'], owner: 'IT Operations' },
  { id: 'SVC-002', name: 'Payment Processing', criticality: 'Critical', rto: '30 minutes', rpo: '0 minutes', dependencies: ['Database', 'Payment Gateway'], owner: 'Finance IT' },
  { id: 'SVC-003', name: 'Email System', criticality: 'High', rto: '4 hours', rpo: '1 hour', dependencies: ['Mail Server', 'Active Directory'], owner: 'IT Infrastructure' },
  { id: 'SVC-004', name: 'HR Portal', criticality: 'Medium', rto: '24 hours', rpo: '4 hours', dependencies: ['Database', 'Auth Service'], owner: 'HR IT' },
  { id: 'SVC-005', name: 'Internal Wiki', criticality: 'Low', rto: '72 hours', rpo: '24 hours', dependencies: ['Web Server'], owner: 'IT Operations' },
];

export const mockBCPTests: BCPTest[] = [
  { id: 'TEST-001', name: 'Monthly BCP tabletop exercise', type: 'BCP', date: '2026-01-20', status: 'Planned', notes: 'Validate comms and escalation flow.' },
  { id: 'TEST-002', name: 'DR failover drill', type: 'DR', date: '2026-01-28', status: 'Planned', notes: 'Run partial failover and measure RTO/RPO.' },
  { id: 'TEST-003', name: 'Quarterly backup restore check', type: 'DR', date: '2025-12-10', status: 'Passed', durationMinutes: 95, notes: 'Restore succeeded; evidence stored.' },
];

export const mockIncidents: Incident[] = [
  { id: 'INC-001', riskId: 'RISK-001', title: 'Phishing Attempt Detected', date: '2025-12-20', severity: 'Medium', status: 'Resolved' },
  { id: 'INC-002', riskId: 'RISK-001', title: 'Suspicious Login Activity', date: '2025-12-15', severity: 'Low', status: 'Resolved' },
  { id: 'INC-003', riskId: 'RISK-002', title: 'Supplier Delivery Delay', date: '2025-11-28', severity: 'High', status: 'Resolved' },
];

export const riskTrendData = [
  { month: 'Jul', critical: 2, high: 4, medium: 8, low: 12 },
  { month: 'Aug', critical: 3, high: 5, medium: 7, low: 10 },
  { month: 'Sep', critical: 2, high: 6, medium: 9, low: 11 },
  { month: 'Oct', critical: 4, high: 5, medium: 8, low: 9 },
  { month: 'Nov', critical: 3, high: 4, medium: 10, low: 12 },
  { month: 'Dec', critical: 2, high: 6, medium: 8, low: 11 },
];

export const riskByCategoryData = [
  { category: 'Security', count: 2, color: 'hsl(var(--chart-4))' },
  { category: 'Operational', count: 3, color: 'hsl(var(--chart-1))' },
  { category: 'Compliance', count: 1, color: 'hsl(var(--chart-2))' },
  { category: 'Financial', count: 2, color: 'hsl(var(--chart-3))' },
  { category: 'Technology', count: 1, color: 'hsl(var(--chart-5))' },
  { category: 'Reputational', count: 1, color: 'hsl(var(--chart-1))' },
  { category: 'Environmental', count: 1, color: 'hsl(var(--chart-2))' },
];