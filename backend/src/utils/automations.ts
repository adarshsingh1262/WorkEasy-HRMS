import { AutomationTrigger } from "@prisma/client";
import { prisma } from "../config/prisma";

interface TriggerContext {
  organizationId: string;
  employeeId?: string;
}

// Best-effort rule dispatch — a rule failing must not break the request that triggered it.
export async function runAutomations(trigger: AutomationTrigger, ctx: TriggerContext): Promise<void> {
  const rules = await prisma.automationRule.findMany({
    where: { organizationId: ctx.organizationId, trigger, enabled: true },
  });

  for (const rule of rules) {
    try {
      const config = rule.actionConfig as Record<string, unknown>;

      if (rule.actionType === "CREATE_ANNOUNCEMENT") {
        await prisma.announcement.create({
          data: {
            organizationId: ctx.organizationId,
            authorId: rule.createdById,
            title: String(config.title ?? rule.name),
            body: String(config.body ?? ""),
          },
        });
      }

      if (rule.actionType === "ASSIGN_ONBOARDING_TASK" && ctx.employeeId) {
        await prisma.onboardingTask.create({
          data: {
            organizationId: ctx.organizationId,
            employeeId: ctx.employeeId,
            title: String(config.title ?? rule.name),
          },
        });
      }
    } catch (err) {
      console.error(`Automation rule ${rule.id} failed`, err);
    }
  }
}
