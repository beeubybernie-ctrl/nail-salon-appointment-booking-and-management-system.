(process.env as Record<string, string>).NODE_ENV = "test";

import { v4 as uuidv4 } from "uuid";

type Db = typeof import("../src/lib/prisma").prisma;
type Avail = typeof import("../src/lib/availability");

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.error(`  ✗ ${name}${detail ? ` — ${JSON.stringify(detail)}` : ""}`);
  }
}

async function reset(prisma: Db) {
  await prisma.appointmentExtra.deleteMany();
  await prisma.blockedTime.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();

  // Standard schedule
  const days: { dayOfWeek: number; open: string; close: string }[] = [
    { dayOfWeek: 1, open: "09:00", close: "19:00" },
    { dayOfWeek: 2, open: "09:00", close: "19:00" },
    { dayOfWeek: 3, open: "09:00", close: "19:00" },
    { dayOfWeek: 4, open: "09:00", close: "19:00" },
    { dayOfWeek: 5, open: "09:00", close: "19:00" },
    { dayOfWeek: 6, open: "09:00", close: "17:00" },
    { dayOfWeek: 0, open: "09:00", close: "17:00" }, // Sun recorded but inactive
  ];
  for (const d of days) {
    const existing = await prisma.businessHours.findFirst({ where: { dayOfWeek: d.dayOfWeek } });
    if (existing) {
      await prisma.businessHours.update({
        where: { id: existing.id },
        data: { openTime: d.open, closeTime: d.close, isActive: d.dayOfWeek !== 0 },
      });
    } else {
      await prisma.businessHours.create({
        data: { dayOfWeek: d.dayOfWeek, openTime: d.open, closeTime: d.close, isActive: d.dayOfWeek !== 0 },
      });
    }
  }

  await prisma.businessBreak.deleteMany();
  // Mon break 14:30-15:00
  await prisma.businessBreak.create({
    data: { dayOfWeek: 1, startTime: "14:30", endTime: "15:00", isActive: true },
  });
  // Tue-Fri break 15:00-15:30
  for (let d = 2; d <= 5; d++) {
    await prisma.businessBreak.create({
      data: { dayOfWeek: d, startTime: "15:00", endTime: "15:30", isActive: true },
    });
  }

  await prisma.setting.upsert({
    where: { key: "defaultDuration" },
    update: { value: "120" },
    create: { key: "defaultDuration", value: "120" },
  });
}

async function seedAppointment(prisma: Db, date: string, start: string, end: string, status = "CONFIRMED") {
  const client = await prisma.client.create({
    data: { name: "Test Client", phone: "0820000000", email: `client-${uuidv4()}@test.dev` },
  });
  const category = await prisma.serviceCategory.create({
    data: { name: "TEST", order: 99 },
  });
  const service = await prisma.service.create({
    data: { name: "Test Service", price: 100, duration: 120, categoryId: category.id },
  });
  return prisma.appointment.create({
    data: {
      bookingRef: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clientId: client.id,
      serviceId: service.id,
      date: new Date(`${date}T00:00:00`),
      startTime: start,
      endTime: end,
      duration: 120,
      price: 100,
      status,
      cancelToken: uuidv4(),
      rescheduleToken: uuidv4(),
    },
  });
}

// Dates used (2026-09-05 Sat, 2026-09-06 Sun, 2026-09-07 Mon, 2026-09-08 Tue)
const MON = "2026-09-07";
const TUE = "2026-09-08";
const SAT = "2026-09-05";
const SUN = "2026-09-06";

async function main() {
  console.log("\nAvailability engine tests\n");

  const prisma: Db = (await import("../src/lib/prisma")).prisma;
  const { getAvailableSlots, isSlotAvailable, getDefaultDuration }: Avail = await import(
    "../src/lib/availability"
  );

  await reset(prisma);
  const defaultDuration = await getDefaultDuration();
  check("default duration is 120 minutes", defaultDuration === 120, defaultDuration);

  // --- Monday (break 14:30-15:00) ---
  console.log("\n— Monday schedule (break 14:30–15:00) —");
  const monSlots = await getAvailableSlots(MON, 120);
  check("Monday is open", monSlots.isOpen === true);
  check("Monday has slots", monSlots.slots.length > 0);
  check(
    "Monday first slot is 09:00–11:00",
    monSlots.slots[0]?.start === "09:00" && monSlots.slots[0]?.end === "11:00",
    monSlots.slots[0]
  );
  check(
    "Monday last slot is 17:00–19:00",
    monSlots.slots.at(-1)?.start === "17:00" && monSlots.slots.at(-1)?.end === "19:00",
    monSlots.slots.at(-1)
  );
  const monBreakOverlaps = monSlots.slots.filter(
    (s) => timeToMin(s.start) < timeToMin("15:00") && timeToMin(s.end) > timeToMin("14:30")
  );
  check("no Monday slot overlaps the 14:30–15:00 break", monBreakOverlaps.length === 0, monBreakOverlaps);

  const monCheck: [string, string, boolean][] = [
    ["09:00", "11:00", true],
    ["08:30", "10:30", false], // before opening
    ["18:00", "20:00", false], // after closing
    ["13:00", "15:00", false], // overlaps break
    ["14:00", "16:00", false], // overlaps break
    ["14:30", "16:30", false], // starts exactly at break start
    ["12:30", "14:30", true], // ends exactly at break start
    ["15:00", "17:00", true], // starts exactly at break end
  ];
  for (const [start, end, expected] of monCheck) {
    const r = await isSlotAvailable(MON, start, end);
    check(`Monday ${start}–${end} ${expected ? "available" : "blocked"}`, r.valid === expected, r);
  }

  // --- Tuesday (break 15:00-15:30) ---
  console.log("\n— Tuesday schedule (break 15:00–15:30) —");
  const tueSlots = await getAvailableSlots(TUE, 120);
  const tueBreakOverlaps = tueSlots.slots.filter(
    (s) => timeToMin(s.start) < timeToMin("15:30") && timeToMin(s.end) > timeToMin("15:00")
  );
  check("no Tuesday slot overlaps the 15:00–15:30 break", tueBreakOverlaps.length === 0, tueBreakOverlaps);
  const rTueTouch = await isSlotAvailable(TUE, "14:30", "16:30");
  check("Tuesday 14:30–16:30 blocked (overlaps break)", rTueTouch.valid === false, rTueTouch);

  // --- Saturday ---
  console.log("\n— Saturday schedule (09:00–17:00) —");
  const satSlots = await getAvailableSlots(SAT, 120);
  check("Saturday is open", satSlots.isOpen === true);
  check(
    "Saturday last slot is 15:00–17:00",
    satSlots.slots.at(-1)?.start === "15:00" && satSlots.slots.at(-1)?.end === "17:00",
    satSlots.slots.at(-1)
  );
  const satOverclose = await isSlotAvailable(SAT, "16:00", "18:00");
  check("Saturday 16:00–18:00 blocked (past closing)", satOverclose.valid === false, satOverclose);

  // --- Sunday ---
  console.log("\n— Sunday (closed) —");
  const sunSlots = await getAvailableSlots(SUN, 120);
  check("Sunday is closed", sunSlots.isOpen === false && sunSlots.slots.length === 0, sunSlots);
  const rSun = await isSlotAvailable(SUN, "09:00", "11:00");
  check("Sunday slot unavailable", rSun.valid === false, rSun);

  // --- Existing appointment conflicts ---
  console.log("\n— Double-booking protection —");
  await seedAppointment(prisma, MON, "10:00", "12:00");
  const c1 = await isSlotAvailable(MON, "10:00", "12:00");
  check("exact same slot is blocked", c1.valid === false, c1);
  const c2 = await isSlotAvailable(MON, "11:00", "13:00");
  check("overlapping slot is blocked", c2.valid === false, c2);
  const c3 = await isSlotAvailable(MON, "09:00", "11:00");
  check("adjacent overlapping slot is blocked", c3.valid === false, c3);
  const c4 = await isSlotAvailable(MON, "12:00", "14:00");
  check("adjacent (touching) slot is available", c4.valid === true, c4);
  const monSlots2 = await getAvailableSlots(MON, 120);
  check(
    "Monday 09:00 slot absent while appointment exists",
    !monSlots2.slots.some((s) => s.start === "09:00"),
    monSlots2.slots.slice(0, 3)
  );

  // --- Cancelled appointment frees the slot ---
  console.log("\n— Cancellation frees slot —");
  const canceled = await seedAppointment(prisma, SAT, "10:00", "12:00", "CANCELLED");
  check("cancel seed uses CANCELLED status", canceled.status === "CANCELLED");
  const rCancelled = await isSlotAvailable(SAT, "10:00", "12:00");
  check("cancelled appointment no longer blocks slot", rCancelled.valid === true, rCancelled);

  // --- Blocked time ---
  console.log("\n— Blocked time —");
  await prisma.blockedTime.create({
    data: {
      title: "Holiday",
      date: new Date(`${SAT}T00:00:00`),
      startTime: "09:00",
      endTime: "13:00",
    },
  });
  const rBlock = await isSlotAvailable(SAT, "09:00", "11:00");
  check("blocked-time slot is unavailable", rBlock.valid === false, rBlock);
  const rBlock2 = await isSlotAvailable(SAT, "13:00", "15:00");
  check("slot after blocked time is available", rBlock2.valid === true, rBlock2);
  const satSlots2 = await getAvailableSlots(SAT, 120);
  check(
    "blocked-time slots removed from availability",
    !satSlots2.slots.some((s) => s.start === "09:00"),
    satSlots2.slots.slice(0, 3)
  );

  // --- Long appointment across a break ---
  console.log("\n— Long appointments —");
  const rLong = await isSlotAvailable(MON, "12:00", "16:00", undefined);
  check("2h+ appointment spanning break is rejected", rLong.valid === false, rLong);

  // Summary
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("Failures:\n  " + failures.join("\n  "));
    process.exit(1);
  }
  process.exit(0);
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

main().catch(async (err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});