import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission(PERMISSIONS.AUDIT_READ), async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    where: { organizationId: req.user!.organizationId },
    include: { actor: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return res.json(logs);
});

export default router;
