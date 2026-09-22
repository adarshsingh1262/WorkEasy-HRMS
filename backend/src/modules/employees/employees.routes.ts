import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { createEmployeeWithUser } from "../../utils/createEmployee";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();
router.use(requireAuth);

// Employee Directory (People > Employee Directory)
router.get("/", requirePermission(PERMISSIONS.EMPLOYEE_READ), async (req, res) => {
  const { departmentId, search } = req.query as { departmentId?: string; search?: string };

  const employees = await prisma.employee.findMany({
    where: {
      organizationId: req.user!.organizationId,
      ...(departmentId ? { departmentId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { employeeCode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { department: true, user: { select: { email: true } } },
    orderBy: { firstName: "asc" },
  });
  return res.json(employees);
});

// My Workspace > My Profile
router.get("/me", async (req, res) => {
  if (!req.user!.employeeId) {
    return res.status(404).json({ error: "No employee profile linked to this user" });
  }
  const employee = await prisma.employee.findFirst({
    where: { id: req.user!.employeeId, organizationId: req.user!.organizationId },
    include: { department: true, manager: true, user: { select: { email: true } } },
  });
  return res.json(employee);
});

router.get("/:id", async (req, res) => {
  const isSelf = req.params.id === req.user!.employeeId;
  if (!isSelf && !req.user!.permissions.includes(PERMISSIONS.EMPLOYEE_READ)) {
    return res.status(403).json({ error: `Missing permission: ${PERMISSIONS.EMPLOYEE_READ}` });
  }

  const employee = await prisma.employee.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
    include: { department: true, manager: true, user: { select: { email: true } } },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }
  return res.json(employee);
});

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  designation: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  dateOfJoining: z.coerce.date().optional(),
});

// Onboarding: creates a User (with a temp password) + Employee record, assigns default Employee role.
router.post("/", requirePermission(PERMISSIONS.EMPLOYEE_WRITE), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const result = await createEmployeeWithUser(req.user!.organizationId, parsed.data);

  // Temp password returned once so HR can share it out-of-band; a real deployment would email it instead.
  return res.status(201).json({ employee: result.employee, tempPassword: result.tempPassword });
});

const updateSchema = z.object({
  designation: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  status: z.enum(["ACTIVE", "ONBOARDING", "ON_LEAVE", "EXITED"]).optional(),
});

router.patch("/:id", requirePermission(PERMISSIONS.EMPLOYEE_WRITE), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const employee = await prisma.employee.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const updated = await prisma.employee.update({
    where: { id: employee.id },
    data: {
      ...parsed.data,
      ...(parsed.data.status === "EXITED" && !employee.exitDate ? { exitDate: new Date() } : {}),
    },
  });
  return res.json(updated);
});

export default router;
