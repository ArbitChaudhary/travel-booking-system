import type { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

export const addHotel = async (req: Request, res: Response) => {
  try {
    const hotelData = req.body;

    // Add logic to save hotelData to the database
    const newHotel = await prisma.hotel.create({
      data: {
        name: hotelData.name,
        description: hotelData.description,
        city: hotelData.city,
        country: hotelData.country,
        address: hotelData.address,
        latitude: hotelData.latitude,
        longitude: hotelData.longitude,
        starRating: hotelData.starRating,
        amenities: hotelData.amenities,
      },
    });
    return res
      .status(201)
      .json({ message: "Hotel added successfully", hotel: newHotel });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getHotels = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | "";
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;

    const offset = (page - 1) * limit;

    const [hotels, totalHotels] = await Promise.all([
      prisma.hotel.findMany({
        take: limit,
        skip: offset,
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { country: { contains: search, mode: "insensitive" } },
          ],
        },
        include: {
          rooms: true,
        },
      }),
      prisma.hotel.count(),
    ]);
    const totalPages = Math.ceil(totalHotels / limit);

    return res.status(200).json({
      hotels,
      totalCount: totalHotels,
      pageCount: totalPages,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id as string) },
      include: {
        rooms: true,
      },
    });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    return res.status(200).json({ hotel });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const updateHotel = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid hotel id" });
    }

    const {
      name,
      description,
      city,
      country,
      address,
      latitude,
      longitude,
      starRating,
      images,
      amenities,
    } = req.body;

    // Build the update payload with only the provided fields so we avoid
    // overwriting existing columns with `undefined`/`null` unintentionally.
    const data: Prisma.HotelUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (city !== undefined) data.city = city;
    if (country !== undefined) data.country = country;
    if (address !== undefined) data.address = address;
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    if (starRating !== undefined) data.starRating = starRating;
    if (images !== undefined) data.images = images;
    if (amenities !== undefined) data.amenities = amenities;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    // Single round-trip: update directly and rely on Prisma's P2025 error
    // instead of an extra findUnique existence check.
    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data,
    });

    return res
      .status(200)
      .json({ message: "Hotel updated successfully", hotel: updatedHotel });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const deleteHotel = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid hotel id" });
    }

    // Single round-trip: delete directly and rely on Prisma's P2025 error
    // instead of an extra findUnique existence check.
    await prisma.hotel.delete({
      where: { id },
    });
    return res.status(200).json({ message: "Hotel deleted successfully" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Hotel does not exist" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
