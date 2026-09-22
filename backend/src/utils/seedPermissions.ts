import { prisma } from "../config/prisma";
import { ALL_PERMISSIONS } from "./permissions";

// Idempotent: safe to call on every boot so the permission catalog is never missing.
export async function seedPermissions() {
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
  }
}
