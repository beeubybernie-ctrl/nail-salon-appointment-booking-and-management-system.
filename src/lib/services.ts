import { prisma } from "./prisma";

export interface PublicService {
  id: string;
  name: string;
  price: number;
  duration: number;
  isPerNail: boolean;
  isActive: boolean;
  order: number;
}

export interface ServiceCategoryWithServices {
  categoryName: string;
  order: number;
  services: PublicService[];
}

export async function getServiceCatalog(): Promise<
  ServiceCategoryWithServices[]
> {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return categories
    .filter((c) => c.services.length > 0)
    .map((c) => ({
      categoryName: c.name,
      order: c.order,
      services: c.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        isPerNail: s.isPerNail,
        isActive: s.isActive,
        order: s.order,
      })),
    }));
}

export async function getMainServices(filterPerNail = false) {
  const extrasCategory = await prisma.serviceCategory.findFirst({
    where: { name: "EXTRAS" },
  });

  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      ...(filterPerNail
        ? { isPerNail: true }
        : extrasCategory
          ? { category: { isNot: { id: extrasCategory.id } } }
          : {}),
    },
    orderBy: { order: "asc" },
  });

  return services;
}