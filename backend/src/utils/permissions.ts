export const PERMISSIONS = {
  ORG_MANAGE: "org:manage",
  DEPARTMENT_MANAGE: "department:manage",
  DEPARTMENT_READ: "department:read",
  EMPLOYEE_READ: "employee:read",
  EMPLOYEE_WRITE: "employee:write",
  ROLE_MANAGE: "role:manage",
  LEAVE_MANAGE: "leave:manage",
  ANNOUNCEMENT_READ: "announcement:read",
  ANNOUNCEMENT_MANAGE: "announcement:manage",
  ONBOARDING_MANAGE: "onboarding:manage",
  SHIFT_MANAGE: "shift:manage",
  TIMESHEET_MANAGE: "timesheet:manage",
  COMPENSATION_MANAGE: "compensation:manage",
  PAYROLL_MANAGE: "payroll:manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

// System default roles seeded for every new organization.
export const SYSTEM_ROLES: Record<string, PermissionKey[]> = {
  Admin: ALL_PERMISSIONS,
  HR: [
    PERMISSIONS.DEPARTMENT_MANAGE,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_WRITE,
    PERMISSIONS.LEAVE_MANAGE,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_MANAGE,
    PERMISSIONS.ONBOARDING_MANAGE,
    PERMISSIONS.SHIFT_MANAGE,
    PERMISSIONS.TIMESHEET_MANAGE,
    PERMISSIONS.COMPENSATION_MANAGE,
    PERMISSIONS.PAYROLL_MANAGE,
  ],
  Manager: [PERMISSIONS.DEPARTMENT_READ, PERMISSIONS.EMPLOYEE_READ, PERMISSIONS.ANNOUNCEMENT_READ],
  Employee: [PERMISSIONS.DEPARTMENT_READ, PERMISSIONS.ANNOUNCEMENT_READ],
};
