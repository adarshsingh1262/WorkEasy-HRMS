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
