import { prisma } from "../config/prisma";

export async function loadUserContext(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      employee: true,
      userRoles: {
        include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
      },
    },
  });

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.key)),
    ),
  );

  return {
    user,
    roles,
    permissions,
    employeeId: user.employee?.id ?? null,
  };
}
