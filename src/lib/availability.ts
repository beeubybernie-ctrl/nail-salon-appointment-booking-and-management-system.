import { prisma } from "./prisma";

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export interface AvailabilityResult {
  date: string;
  dayOfWeek: number;
  isOpen: boolean;
  slots: TimeSlot[];
  message: string;
}

interface BookingInfo {
  startTime: string;
  endTime: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aS = timeToMinutes(aStart);
  const aE = timeToMinutes(aEnd);
  const bS = timeToMinutes(bStart);
  const bE = timeToMinutes(bEnd);
  return aS < bE && aE > bS;
}

export async function getBusinessHoursForDay(
  dayOfWeek: number
): Promise<{ openTime: string; closeTime: string; isActive: boolean } | null> {
  const hours = await prisma.businessHours.findFirst({
    where: { dayOfWeek },
  });
  if (!hours) return null;
  return {
    openTime: hours.openTime,
    closeTime: hours.closeTime,
    isActive: hours.isActive,
  };
}

export async function getBreaksForDay(dayOfWeek: number) {
  const breaks = await prisma.businessBreak.findMany({
    where: { dayOfWeek, isActive: true },
  });
  return breaks;
}

export async function getSettings(): Promise<
  Record<string, string>
> {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });
  return map;
}

export async function getDefaultDuration(): Promise<number> {
  const settings = await getSettings();
  const duration = settings.defaultDuration;
  if (duration) {
    const parsed = parseInt(duration, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 120;
}

function dateToDayOfWeek(dateStr: string): number {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.getDay();
}

function breakContains(breaks: { startTime: string; endTime: string }[], start: string, end: string): boolean {
  return breaks.some((b) => intervalsOverlap(start, end, b.startTime, b.endTime));
}

export interface SlotValidationResult {
  valid: boolean;
  reason?: string;
}

export async function isSlotAvailable(
  dateStr: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<SlotValidationResult> {
  const dayOfWeek = dateToDayOfWeek(dateStr);
  const hours = await getBusinessHoursForDay(dayOfWeek);

  if (!hours || !hours.isActive) {
    return { valid: false, reason: "Business is closed on this day." };
  }

  const openMin = timeToMinutes(hours.openTime);
  const closeMin = timeToMinutes(hours.closeTime);
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin < openMin || endMin > closeMin) {
    return { valid: false, reason: "Outside of business hours." };
  }

  const breaks = await getBreaksForDay(dayOfWeek);
  if (breakContains(breaks, startTime, endTime)) {
    return { valid: false, reason: "Overlaps a break." };
  }

  const dateStart = new Date(`${dateStr}T00:00:00`);
  const dateEnd = new Date(`${dateStr}T23:59:59`);

  const [appointments, blockedTimes] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        date: { gte: dateStart, lte: dateEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    }),
    prisma.blockedTime.findMany({
      where: {
        date: { gte: dateStart, lte: dateEnd },
      },
    }),
  ]);

  for (const appt of appointments) {
    if (intervalsOverlap(startTime, endTime, appt.startTime, appt.endTime)) {
      return { valid: false, reason: "Conflicts with an existing appointment." };
    }
  }

  for (const block of blockedTimes) {
    if (intervalsOverlap(startTime, endTime, block.startTime, block.endTime)) {
      return { valid: false, reason: "Blocked time." };
    }
  }

  return { valid: true };
}

export async function getAvailableSlots(
  dateStr: string,
  duration?: number
): Promise<AvailabilityResult> {
  const dayOfWeek = dateToDayOfWeek(dateStr);
  const durationMin = duration ?? (await getDefaultDuration());

  const hours = await getBusinessHoursForDay(dayOfWeek);

  if (!hours || !hours.isActive) {
    return {
      date: dateStr,
      dayOfWeek,
      isOpen: false,
      slots: [],
      message: "Business is closed on this day.",
    };
  }

  const openMin = timeToMinutes(hours.openTime);
  const closeMin = timeToMinutes(hours.closeTime);
  const breaks = await getBreaksForDay(dayOfWeek);

  if (durationMin > closeMin - openMin) {
    return {
      date: dateStr,
      dayOfWeek,
      isOpen: true,
      slots: [],
      message: "Appointment duration exceeds the available business hours.",
    };
  }

  const dateStart = new Date(`${dateStr}T00:00:00`);
  const dateEnd = new Date(`${dateStr}T23:59:59`);

  const [appointments, blockedTimes] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        date: { gte: dateStart, lte: dateEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    }),
    prisma.blockedTime.findMany({
      where: {
        date: { gte: dateStart, lte: dateEnd },
      },
    }),
  ]);

  const slots: TimeSlot[] = [];

  for (let start = openMin; start + durationMin <= closeMin; start += 30) {
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(start + durationMin);
    const endMin = start + durationMin;

    const overlapsBlocked = blockedTimes.some((b) =>
      intervalsOverlap(startTime, endTime, b.startTime, b.endTime)
    );
    if (overlapsBlocked) continue;

    const overlapsBreak = breaks.some((b) =>
      intervalsOverlap(startTime, endTime, b.startTime, b.endTime)
    );
    if (overlapsBreak) continue;

    const overlapsAppointment = appointments.some((a) =>
      intervalsOverlap(startTime, endTime, a.startTime, a.endTime)
    );
    if (overlapsAppointment) continue;

    if (endMin > closeMin) continue;

    slots.push({
      start: startTime,
      end: endTime,
      label: `${minutesToTime(start)} - ${minutesToTime(start + durationMin)}`,
    });
  }

  return {
    date: dateStr,
    dayOfWeek,
    isOpen: true,
    slots,
    message: slots.length
      ? "Available times"
      : "No appointments are available for this date. Please choose another date.",
  };
}

/**
 * Returns a list of supported date strings (YYYY-MM-DD) from today up to
 * maxAdvance days ahead, respecting the business week.
 */
export async function getAvailableDates(): Promise<string[]> {
  const settings = await getSettings();
  const maxAdvance = parseInt(settings.maxAdvanceBooking ?? "30", 10);
  const minAdvance = parseInt(settings.minAdvanceBooking ?? "0", 10);
  const allowSameDay = settings.allowSameDay !== "false";

  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i <= Math.max(maxAdvance, 30); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    if (!allowSameDay && i === 0) continue;
    if (i < minAdvance) continue;

    const dateStr = formatISODate(d);
    dates.push(dateStr);
  }
  return dates;
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface AvailabilityOverviewDay {
  date: string;
  dayOfWeek: number;
  isOpen: boolean;
  slotCount: number;
}

/**
 * Returns a compact availability summary (open/closed + open-slot count) for
 * each of the next `days` days (starting today), for a given appointment
 * duration. Lightweight — used for the booking date grid and the weekly
 * availability mini-calendar.
 */
export async function getAvailabilityOverview(
  days: number,
  duration?: number
): Promise<AvailabilityOverviewDay[]> {
  const dateStrs = await getAvailableDates();
  const sliced = dateStrs.slice(0, days);

  const results = await Promise.all(
    sliced.map(async (date) => {
      const result = await getAvailableSlots(date, duration);
      return {
        date,
        dayOfWeek: result.dayOfWeek,
        isOpen: result.isOpen,
        slotCount: result.slots.length,
      };
    })
  );

  return results;
}
