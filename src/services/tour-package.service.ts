import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

export interface TourPackageListParams {
  search?: string;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateTourPackageInput {
  title: string;
  description: string;
  destination: string;
  price: number;
  durationDays: number;
  maxGroupSize: number;
  availableSlots: number;
  images?: string[];
  inclusions?: string[];
  exclusions?: string[];
}

export type UpdateTourPackageInput = Partial<CreateTourPackageInput>;

// Only select the columns the API exposes. Avoids over-fetching and keeps
// payloads small for lower serialization/transfer latency.
const tourPackageSelect = {
  id: true,
  title: true,
  description: true,
  destination: true,
  price: true,
  durationDays: true,
  maxGroupSize: true,
  availableSlots: true,
  images: true,
  inclusions: true,
  exclusions: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TourPackageSelect;

const buildWhere = (
  params: TourPackageListParams,
): Prisma.TourPackageWhereInput => {
  const {
    search,
    destination,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
    available,
  } = params;

  const where: Prisma.TourPackageWhereInput = {};
  const and: Prisma.TourPackageWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (destination) {
    and.push({ destination: { contains: destination, mode: "insensitive" } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  if (minDuration !== undefined || maxDuration !== undefined) {
    where.durationDays = {
      ...(minDuration !== undefined ? { gte: minDuration } : {}),
      ...(maxDuration !== undefined ? { lte: maxDuration } : {}),
    };
  }

  // "availability" => packages that still have open slots.
  if (available === true) {
    where.availableSlots = { gt: 0 };
  } else if (available === false) {
    where.availableSlots = { lte: 0 };
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
};

export const listTourPackages = async (params: TourPackageListParams) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = (page - 1) * limit;

  const where = buildWhere(params);

  // Run the page query and the count in parallel to halve round-trip latency.
  const [tourPackages, totalCount] = await Promise.all([
    prisma.tourPackage.findMany({
      where,
      select: tourPackageSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.tourPackage.count({ where }),
  ]);

  return {
    tourPackages,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
  };
};

export const getTourPackageById = (id: number) =>
  prisma.tourPackage.findUnique({
    where: { id },
    select: tourPackageSelect,
  });

export const createTourPackage = (data: CreateTourPackageInput) =>
  prisma.tourPackage.create({
    data: {
      title: data.title,
      description: data.description,
      destination: data.destination,
      price: data.price,
      durationDays: data.durationDays,
      maxGroupSize: data.maxGroupSize,
      availableSlots: data.availableSlots,
      images: data.images ?? [],
      inclusions: data.inclusions ?? [],
      exclusions: data.exclusions ?? [],
    },
    select: tourPackageSelect,
  });

export const updateTourPackage = (
  id: number,
  data: Prisma.TourPackageUpdateInput,
) =>
  prisma.tourPackage.update({
    where: { id },
    data,
    select: tourPackageSelect,
  });

export const deleteTourPackage = (id: number) =>
  prisma.tourPackage.delete({ where: { id } });
