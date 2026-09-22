import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { runAutomations } from "../../utils/automations";
import { HttpError } from "../../utils/HttpError";
import { PERMISSIONS } from "../../utils/permissions";
import { daysBetweenInclusive } from "../../utils/date";

const router = Router();
router.use(requireAuth);

function requireSelfEmployee(req: Request): string {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new HttpError(400, "No employee profile linked to this user");
  return employeeId;
}

router.get("/me", async (req, res) => {
  const employeeId = requireSelfEmployee(req);
  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId },
    include: { leaveType: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(requests);
});

// Requests awaiting *this* user's decision: HR/Admin see every pending request,
// a manager sees pending requests from their direct reports.
router.get("/pending-approvals", async (req, res) => {
  const organizationId = req.user!.organizationId;
  const canManageAll = req.user!.permissions.includes(PERMISSIONS.LEAVE_MANAGE);

  const requests = await prisma.leaveRequest.findMany({
    where: {
      organizationId,
      status: "PENDING",
      ...(canManageAll ? {} : { employee: { managerId: req.user!.employeeId ?? "__none__" } }),
    },
    include: { leaveType: true, employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    orderBy: { createdAt: "asc" },
  });
  return res.json(requests);
});

const createSchema = z
  .object({
    leaveTypeId: z.string().uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, { message: "endDate must be on or after startDate", path: ["endDate"] });

router.post("/", async (req, res) => {
  const employeeId = requireSelfEmployee(req);
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { leaveTypeId, startDate, endDate, reason } = parsed.data;

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: leaveTypeId, organizationId: req.user!.organizationId },
  });
  if (!leaveType) {
    return res.status(404).json({ error: "Leave type not found" });
  }

  const days = daysBetweenInclusive(startDate, endDate);
  const request = await prisma.leaveRequest.create({
    data: {
      organizationId: req.user!.organizationId,
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      days,
      reason,
    },
    include: { leaveType: true },
  });
  return res.status(201).json(request);
});

router.post("/:id/cancel", async (req, res) => {
  const employeeId = requireSelfEmployee(req);
  const request = await prisma.leaveRequest.findFirst({
    where: { id: req.params.id, employeeId },
  });
  if (!request) return res.status(404).json({ error: "Leave request not found" });
  if (request.status !== "PENDING") {
    return res.status(409).json({ error: "Only pending requests can be cancelled" });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: request.id },
    data: { status: "CANCELLED" },
  });
  return res.json(updated);
});

const decisionSchema = z.object({ decisionNote: z.string().optional() });

async function decide(req: Request, res: Response, approve: boolean) {
  const parsed = decisionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const request = await prisma.leaveRequest.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
    include: { employee: true },
  });
  if (!request) return res.status(404).json({ error: "Leave request not found" });
  if (request.status !== "PENDING") {
    return res.status(409).json({ error: "Request has already been decided" });
  }

  const canManageAll = req.user!.permissions.includes(PERMISSIONS.LEAVE_MANAGE);
  const isDirectManager = request.employee.managerId === req.user!.employeeId;
  if (!canManageAll && !isDirectManager) {
    return res.status(403).json({ error: "Not authorized to decide this request" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const decided = await tx.leaveRequest.update({
      where: { id: request.id },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        approverId: req.user!.employeeId,
        decisionNote: parsed.data.decisionNote,
        decidedAt: new Date(),
      },
      include: { leaveType: true },
    });

    if (approve) {
      const year = decided.startDate.getFullYear();
      await tx.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: decided.employeeId, leaveTypeId: decided.leaveTypeId, year } },
        create: {
          organizationId: req.user!.organizationId,
          employeeId: decided.employeeId,
          leaveTypeId: decided.leaveTypeId,
          year,
          allocatedDays: 0,
          usedDays: decided.days,
        },
        update: { usedDays: { increment: decided.days } },
      });
    }

    return decided;
  });

  if (approve) {
    await runAutomations("LEAVE_APPROVED", { organizationId: req.user!.organizationId, employeeId: updated.employeeId });
  }

  return res.json(updated);
}

router.post("/:id/approve", (req, res) => decide(req, res, true));
router.post("/:id/reject", (req, res) => decide(req, res, false));

export default router;
