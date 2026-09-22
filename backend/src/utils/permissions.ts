export const PERMISSIONS = {
  ORG_MANAGE: "org:manage",
  DEPARTMENT_MANAGE: "department:manage",
  DEPARTMENT_READ: "department:read",
  EMPLOYEE_READ: "employee:read",
  EMPLOYEE_WRITE: "employee:write",
  ROLE_MANAGE: "role:manage",
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
  ],
  Manager: [PERMISSIONS.DEPARTMENT_READ, PERMISSIONS.EMPLOYEE_READ],
  Employee: [PERMISSIONS.DEPARTMENT_READ],
};
