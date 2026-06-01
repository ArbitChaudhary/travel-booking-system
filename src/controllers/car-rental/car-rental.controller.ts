import type { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

export const addCarRental = async (req: Request, res: Response) => {
  try {
    const {
      company,
      model,
      type,
      city,
      pricePerDay,
      available,
      features,
      images,
    } = req.body;

    // Validate required fields up-front to avoid an unnecessary DB round-trip.
    if (!company || !model || !type || !city || pricePerDay === undefined) {
      return res.status(400).json({
        message:
          "company, model, type, city and pricePerDay are required fields",
      });
    }

    const price = Number(pricePerDay);
    if (Number.isNaN(price) || price < 0) {
      return res
        .status(400)
        .json({ message: "pricePerDay must be a non-negative number" });
    }

    const newCarRental = await prisma.carRental.create({
      data: {
        company,
        model,
        type,
        city,
        pricePerDay: price,
        available: available ?? true,
        features: features ?? [],
        images: images ?? [],
      },
    });

    return res.status(201).json({
      message: "Car rental added successfully",
      carRental: newCarRental,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getAllCarRental = async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || "";
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;

    const offset = (page - 1) * limit;

    const where: Prisma.CarRentalWhereInput = search
      ? {
          OR: [
            { company: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
            { type: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [carRentals, totalCount] = await Promise.all([
      prisma.carRental.findMany({
        take: limit,
        skip: offset,
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.carRental.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      cars: carRentals,
      totalCount,
      totalPages,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getCarRentalById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid car rental id" });
    }

    const carRental = await prisma.carRental.findUnique({
      where: { id },
    });

    if (!carRental) {
      return res.status(404).json({ message: "Car rental not found" });
    }

    return res.status(200).json({ carRental });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const updateCarRentalById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid car rental id" });
    }

    const {
      company,
      model,
      type,
      city,
      pricePerDay,
      available,
      features,
      images,
    } = req.body;

    // Build the update payload with only the provided fields so we avoid
    // overwriting existing columns with `undefined` unintentionally.
    const data: Prisma.CarRentalUpdateInput = {};
    if (company !== undefined) data.company = company;
    if (model !== undefined) data.model = model;
    if (type !== undefined) data.type = type;
    if (city !== undefined) data.city = city;
    if (pricePerDay !== undefined) {
      const price = Number(pricePerDay);
      if (Number.isNaN(price) || price < 0) {
        return res
          .status(400)
          .json({ message: "pricePerDay must be a non-negative number" });
      }
      data.pricePerDay = price;
    }
    if (available !== undefined) data.available = available;
    if (features !== undefined) data.features = features;
    if (images !== undefined) data.images = images;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    // Single round-trip: update directly and rely on Prisma's P2025 error
    // instead of an extra findUnique existence check.
    const updatedCarRental = await prisma.carRental.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      message: "Car rental updated successfully",
      carRental: updatedCarRental,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Car rental not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const deleteCarRentalById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid car rental id" });
    }

    // Single round-trip: delete directly and rely on Prisma's P2025 error
    // instead of an extra findUnique existence check.
    await prisma.carRental.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Car rental deleted successfully" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Car rental not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
