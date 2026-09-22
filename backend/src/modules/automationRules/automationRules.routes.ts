import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { HttpError } from "../../utils/HttpError";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();
router.use(requireAuth);
router.use(requirePermission(PERMISSIONS.AUTOMATION_MANAGE));

router.get("/", async (req, res) => {
  const rules = await prisma.automationRule.findMany({
    where: { organizationId: req.user!.organizationId },
    orderBy: { createdAt: "desc" },
  });
  return res.json(rules);
});

const createSchema = z.object({
  name: z.string().min(1),
  trigger: z.enum(["LEAVE_APPROVED", "EMPLOYEE_ONBOARDED", "TIMESHEET_APPROVED"]),
  actionType: z.enum(["CREATE_ANNOUNCEMENT", "ASSIGN_ONBOARDING_TASK"]),
  actionConfig: z.record(z.string(), z.unknown()),
});

router.post("/", async (req, res) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new HttpError(400, "No employee profile linked to this user");

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const rule = await prisma.automationRule.create({
    data: {
      organizationId: req.user!.organizationId,
      createdById: employeeId,
      ...parsed.data,
      actionConfig: parsed.data.actionConfig as Prisma.InputJsonValue,
    },
  });
  return res.status(201).json(rule);
});

const updateSchema = z.object({ enabled: z.boolean() });

router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const rule = await prisma.automationRule.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });
  if (!rule) return res.status(404).json({ error: "Automation rule not found" });

  const updated = await prisma.automationRule.update({ where: { id: rule.id }, data: parsed.data });
  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const rule = await prisma.automationRule.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });
  if (!rule) return res.status(404).json({ error: "Automation rule not found" });

  await prisma.automationRule.delete({ where: { id: rule.id } });
  return res.status(204).send();
});

export default router;
