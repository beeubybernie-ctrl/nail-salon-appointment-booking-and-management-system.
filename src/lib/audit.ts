import { prisma } from "./prisma";

export async function logAudit(
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}