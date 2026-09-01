import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create/update admin user
  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "berniefoss@gmail.com" },
    update: {},
    create: {
      email: "berniefoss@gmail.com",
      password,
      name: "Bernie",
      role: "admin",
    },
  });
  console.log("Admin user created. Email: berniefoss@gmail.com / Password: admin123");
  console.log("To change the default password, update the hash in prisma/seed.ts and re-run `npm run db:seed`.");

  // Service categories
  const categories = [
    { name: "MANICURE", order: 1 },
    { name: "ACRYLIC", order: 2 },
    { name: "GEL X", order: 3 },
    { name: "OVERLAYS", order: 4 },
    { name: "EXTRAS", order: 5 },
  ];

  for (const c of categories) {
    await prisma.serviceCategory.upsert({
      where: { id: c.name.toLowerCase() },
      update: { name: c.name, order: c.order },
      create: { id: c.name.toLowerCase(), name: c.name, order: c.order },
    });
  }

  // Services
  const services = [
    { name: "Plain Manicure", price: 150, duration: 120, categoryId: "manicure", isPerNail: false, order: 1 },
    { name: "Acrylic Short", price: 180, duration: 120, categoryId: "acrylic", isPerNail: false, order: 2 },
    { name: "Acrylic Medium", price: 200, duration: 120, categoryId: "acrylic", isPerNail: false, order: 3 },
    { name: "Acrylic Long", price: 220, duration: 120, categoryId: "acrylic", isPerNail: false, order: 4 },
    { name: "Gel X Short", price: 150, duration: 120, categoryId: "gel x", isPerNail: false, order: 5 },
    { name: "Gel X Medium", price: 170, duration: 120, categoryId: "gel x", isPerNail: false, order: 6 },
    { name: "Gel X Long", price: 190, duration: 120, categoryId: "gel x", isPerNail: false, order: 7 },
    { name: "Rubber Base Overlay", price: 150, duration: 120, categoryId: "overlays", isPerNail: false, order: 8 },
    { name: "Gel Overlay (Natural Nails)", price: 110, duration: 120, categoryId: "overlays", isPerNail: false, order: 9 },
    { name: "Almond + Stiletto Shape", price: 20, duration: 0, categoryId: "extras", isPerNail: false, order: 10 },
    { name: "French Tip", price: 50, duration: 0, categoryId: "extras", isPerNail: false, order: 11 },
    { name: "Chrome", price: 10, duration: 0, categoryId: "extras", isPerNail: true, order: 12 },
    { name: "Foil Art", price: 5, duration: 0, categoryId: "extras", isPerNail: true, order: 13 },
    { name: "Rhinestone", price: 5, duration: 0, categoryId: "extras", isPerNail: true, order: 14 },
    { name: "Stickers", price: 5, duration: 0, categoryId: "extras", isPerNail: true, order: 15 },
    { name: "Soak Off", price: 50, duration: 0, categoryId: "extras", isPerNail: false, order: 16 },
    { name: "Foreign Soak Off", price: 70, duration: 0, categoryId: "extras", isPerNail: false, order: 17 },
    { name: "Nail Replacement", price: 20, duration: 0, categoryId: "extras", isPerNail: true, order: 18 },
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          price: s.price,
          duration: s.duration,
          categoryId: s.categoryId,
          isPerNail: s.isPerNail,
          order: s.order,
          isActive: true,
        },
      });
    } else {
      await prisma.service.create({
        data: s,
      });
    }
  }
  console.log(`Seeded ${services.length} services`);

  // Business hours
  const hours = [
    { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00" },
    { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00" },
    { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00" },
    { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00" },
    { dayOfWeek: 5, openTime: "09:00", closeTime: "19:00" },
    { dayOfWeek: 6, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 0, openTime: "00:00", closeTime: "00:00", isActive: false },
  ];

  for (const h of hours) {
    const existing = await prisma.businessHours.findFirst({
      where: { dayOfWeek: h.dayOfWeek },
    });
    if (existing) {
      await prisma.businessHours.update({
        where: { id: existing.id },
        data: h,
      });
    } else {
      await prisma.businessHours.create({
        data: h,
      });
    }
  }

  // Breaks
  const breaks = [
    { dayOfWeek: 1, startTime: "14:30", endTime: "15:00" },
    { dayOfWeek: 2, startTime: "15:00", endTime: "15:30" },
    { dayOfWeek: 3, startTime: "15:00", endTime: "15:30" },
    { dayOfWeek: 4, startTime: "15:00", endTime: "15:30" },
    { dayOfWeek: 5, startTime: "15:00", endTime: "15:30" },
  ];

  await prisma.businessBreak.deleteMany();
  for (const b of breaks) {
    await prisma.businessBreak.create({ data: b });
  }
  console.log("Business hours and breaks seeded");

  // Settings
  const settings = [
    { key: "businessName", value: "Bee-U by Bernie" },
    { key: "tagline", value: "Be You. Be Beautiful." },
    { key: "phone", value: "067 253 5540" },
    { key: "email", value: "bee.u.by.bernie@gmail.com" },
    { key: "defaultDuration", value: "120" },
    { key: "minAdvanceBooking", value: "0" },
    { key: "maxAdvanceBooking", value: "30" },
    { key: "allowSameDay", value: "true" },
    { key: "allowClientCancellation", value: "true" },
    { key: "cancellationDeadline", value: "24" },
    { key: "reminderTime", value: "24" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("Settings seeded");

  // Demo clients & appointments
  const demoClients = [
    { name: "Sarah Williams", phone: "082 111 2233", email: "sarah.w@example.com" },
    { name: "Jessica Adams", phone: "083 444 5566", email: "jessica.a@example.com" },
    { name: "Megan Smith", phone: "084 777 8899", email: "megan.s@example.com" },
  ];

  // Find services
  const acrylicMedium = await prisma.service.findFirst({ where: { name: "Acrylic Medium" } });
  const gelXShort = await prisma.service.findFirst({ where: { name: "Gel X Short" } });
  const plainManicure = await prisma.service.findFirst({ where: { name: "Plain Manicure" } });

  const clientIds: string[] = [];
  for (const c of demoClients) {
    const existing = await prisma.client.findFirst({ where: { email: c.email } });
    if (existing) {
      clientIds.push(existing.id);
    } else {
      const created = await prisma.client.create({ data: c });
      clientIds.push(created.id);
    }
  }

  // Create demo appointments for today & upcoming
  if (clientIds.length >= 3 && acrylicMedium && gelXShort && plainManicure) {
    const today = new Date();
    // Today appointments
    const appt1Date = new Date(today);
    appt1Date.setHours(0, 0, 0, 0);
    await createDemoAppointment({
      clientId: clientIds[0],
      service: acrylicMedium,
      date: appt1Date,
      startTime: "10:00",
      endTime: "12:00",
      status: "CONFIRMED",
    });

    const appt2Date = new Date(today);
    appt2Date.setHours(0, 0, 0, 0);
    await createDemoAppointment({
      clientId: clientIds[1],
      service: gelXShort,
      date: appt2Date,
      startTime: "13:00",
      endTime: "15:00",
      status: "CONFIRMED",
    });

    // Tomorrow & upcoming
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await createDemoAppointment({
      clientId: clientIds[2],
      service: plainManicure,
      date: tomorrow,
      startTime: "09:00",
      endTime: "11:00",
      status: "CONFIRMED",
    });

    // A couple more days ahead
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    dayAfter.setHours(0, 0, 0, 0);

    await createDemoAppointment({
      clientId: clientIds[0],
      service: acrylicMedium,
      date: dayAfter,
      startTime: "11:00",
      endTime: "13:00",
      status: "CONFIRMED",
    });
  }

  console.log("Demo data seeded");
  console.log("Seed complete!");
}

function makeBookingRef(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const seq = Math.floor(Math.random() * 900 + 100);
  return `BU-${y}${m}${d}-${seq}`;
}

async function createDemoAppointment(args: {
  clientId: string;
  service: { id: string; price: number; duration: number };
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
}) {
  const existing = await prisma.appointment.findFirst({
    where: {
      clientId: args.clientId,
      startTime: args.startTime,
      date: args.date,
    },
  });
  if (existing) return;

  const bookingRef = makeBookingRef(args.date);

  await prisma.appointment.create({
    data: {
      bookingRef,
      clientId: args.clientId,
      serviceId: args.service.id,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.service.duration,
      price: args.service.price,
      status: args.status,
      cancelToken: uuidv4(),
      rescheduleToken: uuidv4(),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
