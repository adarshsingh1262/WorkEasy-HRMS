import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { loadUserContext } from "../../utils/loadUserContext";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { SYSTEM_ROLES } from "../../utils/permissions";

const router = Router();

const DEFAULT_LEAVE_TYPES = [
  { name: "Casual Leave", defaultDaysPerYear: 12 },
  { name: "Sick Leave", defaultDaysPerYear: 8 },
  { name: "Earned Leave", defaultDaysPerYear: 15 },
];

const registerSchema = z.object({
  organizationName: z.string().min(2),
  organizationSlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

// Registers a new organization plus its first Admin user/employee in one transaction.
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { organizationName, organizationSlug, firstName, lastName, email, password } =
    parsed.data;

  const existingSlug = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
  if (existingSlug) {
    return res.status(409).json({ error: "Organization slug already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: organizationName, slug: organizationSlug },
    });

    const roleMap = new Map<string, string>();
    for (const [roleName, permissionKeys] of Object.entries(SYSTEM_ROLES)) {
      const role = await tx.role.create({
        data: { organizationId: organization.id, name: roleName, isSystem: true },
      });
      roleMap.set(roleName, role.id);

      const permissions = await tx.permission.findMany({ where: { key: { in: permissionKeys } } });
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      });
    }

    const user = await tx.user.create({
      data: { organizationId: organization.id, email, passwordHash },
    });

    await tx.userRole.create({
      data: { userId: user.id, roleId: roleMap.get("Admin")! },
    });

    const employee = await tx.employee.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        employeeCode: "EMP-0001",
        firstName,
        lastName,
        status: "ACTIVE",
        dateOfJoining: new Date(),
      },
    });

    await tx.leaveType.createMany({
      data: DEFAULT_LEAVE_TYPES.map((lt) => ({ organizationId: organization.id, ...lt })),
    });

    return { organization, user, employee };
  });

  const { roles, permissions, employeeId } = await loadUserContext(result.user.id);
  const accessToken = signAccessToken({
    sub: result.user.id,
    organizationId: result.organization.id,
    employeeId,
    roles,
    permissions,
  });
  const refreshToken = signRefreshToken(result.user.id);

  return res.status(201).json({
    accessToken,
    refreshToken,
    organization: { id: result.organization.id, name: result.organization.name, slug: result.organization.slug },
  });
});

const loginSchema = z.object({
  organizationSlug: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { organizationSlug, email, password } = parsed.data;

  const organization = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
  if (!organization) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = await prisma.user.findUnique({
    where: { organizationId_email: { organizationId: organization.id, email } },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { roles, permissions, employeeId } = await loadUserContext(user.id);
  const accessToken = signAccessToken({
    sub: user.id,
    organizationId: organization.id,
    employeeId,
    roles,
    permissions,
  });
  const refreshToken = signRefreshToken(user.id);

  return res.json({ accessToken, refreshToken });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  try {
    const { sub } = verifyRefreshToken(refreshToken);
    const { user, roles, permissions, employeeId } = await loadUserContext(sub);
    const accessToken = signAccessToken({
      sub: user.id,
      organizationId: user.organizationId,
      employeeId,
      roles,
      permissions,
    });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const { user, roles, permissions } = await loadUserContext(req.user!.sub);
  return res.json({
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    employee: user.employee,
    roles,
    permissions,
  });
});

export default router;
