import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { writeAuditLog } from "../../utils/audit";
import { HttpError } from "../../utils/HttpError";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();
router.use(requireAuth);

// Placeholder flat deduction rate. Real statutory calculations (PF/ESI/TDS)
// are deferred to v1 — see ARCHITECTURE.md §10 "Statutory & Compliance".
const PLACEHOLDER_DEDUCTION_RATE = 0.1;

router.get("/me/payslips", async (req, res) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new HttpError(400, "No employee profile linked to this user");

  const payslips = await prisma.payslip.findMany({
    where: { employeeId },
    include: { payrollRun: { select: { month: true, year: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json(payslips);
});

router.get("/", requirePermission(PERMISSIONS.PAYROLL_MANAGE), async (req, res) => {
  const runs = await prisma.payrollRun.findMany({
    where: { organizationId: req.user!.organizationId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return res.json(runs);
});

const createRunSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

router.post("/", requirePermission(PERMISSIONS.PAYROLL_MANAGE), async (req, res) => {
  const parsed = createRunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.payrollRun.findUnique({
    where: {
      organizationId_month_year: {
        organizationId: req.user!.organizationId,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
  });
  if (existing) return res.status(409).json({ error: "A payroll run already exists for this month" });

  const run = await prisma.payrollRun.create({
    data: { organizationId: req.user!.organizationId, ...parsed.data },
  });
  return res.status(201).json(run);
});

router.get("/:id/payslips", requirePermission(PERMISSIONS.PAYROLL_MANAGE), async (req, res) => {
  const payslips = await prisma.payslip.findMany({
    where: { payrollRunId: req.params.id, organizationId: req.user!.organizationId },
    include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    orderBy: { createdAt: "asc" },
  });
  return res.json(payslips);
});

router.post("/:id/process", requirePermission(PERMISSIONS.PAYROLL_MANAGE), async (req, res) => {
  const organizationId = req.user!.organizationId;
  const run = await prisma.payrollRun.findFirst({ where: { id: req.params.id, organizationId } });
  if (!run) return res.status(404).json({ error: "Payroll run not found" });
  if (run.status === "PROCESSED") return res.status(409).json({ error: "Payroll run already processed" });

  const periodEnd = new Date(run.year, run.month, 0);
  const employees = await prisma.employee.findMany({ where: { organizationId, status: "ACTIVE" } });

  const { payslips, processedRun } = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const employee of employees) {
      const compensation = await tx.compensationRecord.findFirst({
        where: { employeeId: employee.id, effectiveFrom: { lte: periodEnd } },
        orderBy: { effectiveFrom: "desc" },
      });
      if (!compensation) continue; // no compensation on file yet — skipped, not paid

      const grossPay = compensation.monthlyGross;
      const deductions = Math.round(grossPay * PLACEHOLDER_DEDUCTION_RATE * 100) / 100;
      const netPay = Math.round((grossPay - deductions) * 100) / 100;

      const payslip = await tx.payslip.upsert({
        where: { payrollRunId_employeeId: { payrollRunId: run.id, employeeId: employee.id } },
        create: { organizationId, payrollRunId: run.id, employeeId: employee.id, grossPay, deductions, netPay },
        update: { grossPay, deductions, netPay },
      });
      created.push(payslip);
    }

    const processedRun = await tx.payrollRun.update({
      where: { id: run.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    return { payslips: created, processedRun };
  });

  await writeAuditLog({
    organizationId,
    actorUserId: req.user!.sub,
    action: "payroll.process",
    entityType: "PayrollRun",
    entityId: run.id,
    after: { month: run.month, year: run.year, payslipCount: payslips.length },
  });

  return res.json({ run: processedRun, payslips });
});

export default router;
