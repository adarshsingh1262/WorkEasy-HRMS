import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();
router.use(requireAuth);

router.get("/headcount", requirePermission(PERMISSIONS.EMPLOYEE_READ), async (req, res) => {
  const organizationId = req.user!.organizationId;
  const [byStatus, departments] = await Promise.all([
    prisma.employee.groupBy({ by: ["status"], where: { organizationId }, _count: true }),
    prisma.department.findMany({
      where: { organizationId },
      include: { _count: { select: { employees: true } } },
    }),
  ]);

  return res.json({
    total: byStatus.reduce((sum, s) => sum + s._count, 0),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byDepartment: departments.map((d) => ({ department: d.name, count: d._count.employees })),
  });
});

router.get("/attrition", requirePermission(PERMISSIONS.EMPLOYEE_READ), async (req, res) => {
  const organizationId = req.user!.organizationId;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const exits = await prisma.employee.findMany({
    where: { organizationId, status: "EXITED", exitDate: { gte: twelveMonthsAgo } },
    select: { exitDate: true },
  });

  const byMonth = new Map<string, number>();
  for (const e of exits) {
    if (!e.exitDate) continue;
    const key = `${e.exitDate.getFullYear()}-${String(e.exitDate.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  return res.json({
    totalExits: exits.length,
    byMonth: Array.from(byMonth.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  });
});

router.get("/leave-liability", requirePermission(PERMISSIONS.LEAVE_MANAGE), async (req, res) => {
  const organizationId = req.user!.organizationId;
  const year = new Date().getFullYear();

  const balances = await prisma.leaveBalance.findMany({
    where: { organizationId, year, employee: { status: "ACTIVE" } },
    include: { leaveType: true },
  });

  const byType = new Map<string, { allocated: number; used: number }>();
  for (const b of balances) {
    const entry = byType.get(b.leaveType.name) ?? { allocated: 0, used: 0 };
    entry.allocated += b.allocatedDays;
    entry.used += b.usedDays;
    byType.set(b.leaveType.name, entry);
  }

  return res.json({
    year,
    byLeaveType: Array.from(byType.entries()).map(([leaveType, v]) => ({
      leaveType,
      remainingDays: v.allocated - v.used,
      usedDays: v.used,
    })),
  });
});

router.get("/payroll-cost", requirePermission(PERMISSIONS.PAYROLL_MANAGE), async (req, res) => {
  const organizationId = req.user!.organizationId;
  const runs = await prisma.payrollRun.findMany({
    where: { organizationId, status: "PROCESSED" },
    include: { payslips: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  return res.json({
    byRun: runs.map((r) => ({
      month: r.month,
      year: r.year,
      grossTotal: r.payslips.reduce((sum, p) => sum + p.grossPay, 0),
      netTotal: r.payslips.reduce((sum, p) => sum + p.netPay, 0),
      employeeCount: r.payslips.length,
    })),
  });
});

export default router;
