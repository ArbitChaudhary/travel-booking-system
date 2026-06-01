import type { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import {
  createTourPackage,
  deleteTourPackage,
  getTourPackageById,
  listTourPackages,
  updateTourPackage,
} from "../../services/tour-package.service";

// Parse a query value into a number, returning undefined for missing/invalid.
const toNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

export const getAllTourPackages = async (req: Request, res: Response) => {
  try {
    const result = await listTourPackages({
      search: (req.query.search as string) || undefined,
      destination: (req.query.destination as string) || undefined,
      minPrice: toNumber(req.query.minPrice),
      maxPrice: toNumber(req.query.maxPrice),
      minDuration: toNumber(req.query.minDuration),
      maxDuration: toNumber(req.query.maxDuration),
      available: toBoolean(req.query.available),
      page: toNumber(req.query.page),
      limit: toNumber(req.query.limit),
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getTourPackage = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid tour package id" });
    }

    const tourPackage = await getTourPackageById(id);
    if (!tourPackage) {
      return res.status(404).json({ message: "Tour package not found" });
    }

    return res.status(200).json({ tourPackage });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const addTourPackage = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      destination,
      price,
      durationDays,
      maxGroupSize,
      availableSlots,
      images,
      inclusions,
      exclusions,
    } = req.body;

    // Validate up-front to avoid an unnecessary DB round-trip.
    if (
      !title ||
      !description ||
      !destination ||
      price === undefined ||
      durationDays === undefined ||
      maxGroupSize === undefined ||
      availableSlots === undefined
    ) {
      return res.status(400).json({
        message:
          "title, description, destination, price, durationDays, maxGroupSize and availableSlots are required fields",
      });
    }

    const numericPrice = Number(price);
    const numericDuration = Number(durationDays);
    const numericGroupSize = Number(maxGroupSize);
    const numericSlots = Number(availableSlots);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res
        .status(400)
        .json({ message: "price must be a non-negative number" });
    }
    if (!Number.isInteger(numericDuration) || numericDuration <= 0) {
      return res
        .status(400)
        .json({ message: "durationDays must be a positive integer" });
    }
    if (!Number.isInteger(numericGroupSize) || numericGroupSize <= 0) {
      return res
        .status(400)
        .json({ message: "maxGroupSize must be a positive integer" });
    }
    if (!Number.isInteger(numericSlots) || numericSlots < 0) {
      return res
        .status(400)
        .json({ message: "availableSlots must be a non-negative integer" });
    }

    const tourPackage = await createTourPackage({
      title,
      description,
      destination,
      price: numericPrice,
      durationDays: numericDuration,
      maxGroupSize: numericGroupSize,
      availableSlots: numericSlots,
      images,
      inclusions,
      exclusions,
    });

    return res.status(201).json({
      message: "Tour package added successfully",
      tourPackage,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const updateTourPackageById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid tour package id" });
    }

    const {
      title,
      description,
      destination,
      price,
      durationDays,
      maxGroupSize,
      availableSlots,
      images,
      inclusions,
      exclusions,
    } = req.body;

    // Build the update payload with only the provided fields so we avoid
    // overwriting existing columns with `undefined` unintentionally.
    const data: Prisma.TourPackageUpdateInput = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (destination !== undefined) data.destination = destination;
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res
          .status(400)
          .json({ message: "price must be a non-negative number" });
      }
      data.price = numericPrice;
    }
    if (durationDays !== undefined) {
      const numericDuration = Number(durationDays);
      if (!Number.isInteger(numericDuration) || numericDuration <= 0) {
        return res
          .status(400)
          .json({ message: "durationDays must be a positive integer" });
      }
      data.durationDays = numericDuration;
    }
    if (maxGroupSize !== undefined) {
      const numericGroupSize = Number(maxGroupSize);
      if (!Number.isInteger(numericGroupSize) || numericGroupSize <= 0) {
        return res
          .status(400)
          .json({ message: "maxGroupSize must be a positive integer" });
      }
      data.maxGroupSize = numericGroupSize;
    }
    if (availableSlots !== undefined) {
      const numericSlots = Number(availableSlots);
      if (!Number.isInteger(numericSlots) || numericSlots < 0) {
        return res
          .status(400)
          .json({ message: "availableSlots must be a non-negative integer" });
      }
      data.availableSlots = numericSlots;
    }
    if (images !== undefined) data.images = images;
    if (inclusions !== undefined) data.inclusions = inclusions;
    if (exclusions !== undefined) data.exclusions = exclusions;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    // Single round-trip: update directly and rely on Prisma's P2025 error
    // instead of an extra findUnique existence check.
    const tourPackage = await updateTourPackage(id, data);

    return res.status(200).json({
      message: "Tour package updated successfully",
      tourPackage,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Tour package not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const deleteTourPackageById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid tour package id" });
    }

    // Single round-trip: delete directly and rely on Prisma's P2025 error.
    await deleteTourPackage(id);

    return res
      .status(200)
      .json({ message: "Tour package deleted successfully" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Tour package not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
