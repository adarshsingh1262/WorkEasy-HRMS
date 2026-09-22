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
