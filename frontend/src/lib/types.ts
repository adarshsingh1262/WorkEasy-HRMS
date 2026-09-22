export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
}

export type EmployeeStatus = "ACTIVE" | "ONBOARDING" | "ON_LEAVE" | "EXITED";

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  phone: string | null;
  departmentId: string | null;
  department?: Department | null;
  managerId: string | null;
  manager?: Employee | null;
  dateOfJoining: string | null;
  status: EmployeeStatus;
  user?: { email: string };
}

export interface CurrentUser {
  id: string;
  email: string;
  organizationId: string;
  employee: Employee | null;
  roles: string[];
  permissions: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  employee?: { firstName: string; lastName: string; employeeCode: string };
}

export interface LeaveType {
  id: string;
  name: string;
  defaultDaysPerYear: number;
}

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveRequestStatus;
  decisionNote: string | null;
  employee?: { firstName: string; lastName: string; employeeCode: string };
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  author: { firstName: string; lastName: string };
}

export interface OnboardingTask {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  employee?: { firstName: string; lastName: string; employeeCode: string };
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftTemplateId: string;
  effectiveFrom: string;
  shiftTemplate: ShiftTemplate;
  employee?: { firstName: string; lastName: string; employeeCode: string };
}

export type TimesheetStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  task: string | null;
  status: TimesheetStatus;
  employee?: { firstName: string; lastName: string; employeeCode: string };
}

export interface CompensationRecord {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  annualCTC: number;
  monthlyGross: number;
  currency: string;
}

export type PayrollRunStatus = "DRAFT" | "PROCESSED";

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  processedAt: string | null;
}

export interface Payslip {
  id: string;
  employeeId: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  createdAt: string;
  payrollRun?: { month: number; year: number; status: PayrollRunStatus };
  employee?: { firstName: string; lastName: string; employeeCode: string };
}
