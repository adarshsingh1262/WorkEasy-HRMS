import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

interface AuditEntry {
  organizationId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

// Best-effort audit trail for sensitive mutations (payroll, compensation, roles).
// Never throws — a logging failure must not break the primary request.
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        before: entry.before as Prisma.InputJsonValue,
        after: entry.after as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}
