import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "bee_u_session";

interface SessionData {
  userId: string;
}

function sign(data: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET || "dev-secret")
    .update(data)
    .digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = `${userId}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  const signed = `${token}.${sign(token)}`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

function parseSession(
  value: string | undefined
): SessionData | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length < 4) return null;
  const signed = parts[parts.length - 1];
  const token = parts.slice(0, parts.length - 1).join(".");
  const expected = sign(token);
  let valid = false;
  try {
    valid = timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signed)
    );
  } catch {
    valid = false;
  }
  if (!valid) return null;
  return { userId: parts[0] };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export { SESSION_COOKIE };