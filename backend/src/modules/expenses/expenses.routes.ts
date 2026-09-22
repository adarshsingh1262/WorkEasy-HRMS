import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { HttpError } from "../../utils/HttpError";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();
router.use(requireAuth);

router.get("/me", async (req, res) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new HttpError(400, "No employee profile linked to this user");

  const claims = await prisma.expenseClaim.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" } });
  return res.json(claims);
});

router.get("/pending-approvals", async (req, res) => {
  const organizationId = req.user!.organizationId;
  const canManageAll = req.user!.permissions.includes(PERMISSIONS.EXPENSE_MANAGE);

  const claims = await prisma.expenseClaim.findMany({
    where: {
      organizationId,
      status: "PENDING",
      ...(canManageAll ? {} : { employee: { managerId: req.user!.employeeId ?? "__none__" } }),
    },
    include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    orderBy: { createdAt: "asc" },
  });
  return res.json(claims);
});

router.get("/", requirePermission(PERMISSIONS.EXPENSE_MANAGE), async (req, res) => {
  const claims = await prisma.expenseClaim.findMany({
    where: { organizationId: req.user!.organizationId },
    include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json(claims);
});

const createSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  expenseDate: z.coerce.date(),
  description: z.string().optional(),
});

router.post("/", async (req, res) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new HttpError(400, "No employee profile linked to this user");

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const claim = await prisma.expenseClaim.create({
    data: { organizationId: req.user!.organizationId, employeeId, ...parsed.data },
  });
  return res.status(201).json(claim);
});

const decisionSchema = z.object({ decisionNote: z.string().optional() });

async function decide(req: Request, res: Response, approve: boolean) {
  const parsed = decisionSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const claim = await prisma.expenseClaim.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
    include: { employee: true },
  });
  if (!claim) return res.status(404).json({ error: "Expense claim not found" });
  if (claim.status !== "PENDING") return res.status(409).json({ error: "Claim has already been decided" });

  const canManageAll = req.user!.permissions.includes(PERMISSIONS.EXPENSE_MANAGE);
  const isDirectManager = claim.employee.managerId === req.user!.employeeId;
  if (!canManageAll && !isDirectManager) {
    return res.status(403).json({ error: "Not authorized to decide this claim" });
  }

  const updated = await prisma.expenseClaim.update({
    where: { id: claim.id },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      approverId: req.user!.employeeId,
      decisionNote: parsed.data.decisionNote,
      decidedAt: new Date(),
    },
  });
  return res.json(updated);
}

router.post("/:id/approve", (req, res) => decide(req, res, true));
router.post("/:id/reject", (req, res) => decide(req, res, false));

router.post("/:id/mark-reimbursed", requirePermission(PERMISSIONS.EXPENSE_MANAGE), async (req, res) => {
  const claim = await prisma.expenseClaim.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });
  if (!claim) return res.status(404).json({ error: "Expense claim not found" });
  if (claim.status !== "APPROVED") return res.status(409).json({ error: "Only approved claims can be marked reimbursed" });

  const updated = await prisma.expenseClaim.update({ where: { id: claim.id }, data: { status: "REIMBURSED" } });
  return res.json(updated);
});

export default router;
