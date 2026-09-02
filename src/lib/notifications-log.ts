import { prisma } from "./prisma";

/**
 * Records a notification in the notification log. Returns the record, or null
 * if logging fails (never throws).
 */
export async function logNotification(data: {
  type: string;
  recipient: string;
  subject?: string;
  body: string;
}) {
  try {
    return await prisma.notificationLog.create({
      data: {
        type: data.type,
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        status: "LOGGED",
      },
    });
  } catch (error) {
    console.error("Failed to write notification log:", error);
    return null;
  }
}