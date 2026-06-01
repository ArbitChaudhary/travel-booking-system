import type { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

export const addRoom = async (req: Request, res: Response) => {
  try {
    const hotelId = parseInt(req.params.id as string);
    if (isNaN(hotelId)) {
      return res.status(400).json({ message: "Invalid hotel ID" });
    }

    const {
      name,
      description,
      type,
      bedType,
      pricePerNight,
      availableRooms,
      totalRooms,
      size,
      view,
      images,
      amenities,
      isActive,
    } = req.body;

    // Validate required fields up front to avoid hitting the DB on bad input
    if (
      !name ||
      !type ||
      !bedType ||
      pricePerNight == null ||
      availableRooms == null ||
      totalRooms == null
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const room = await prisma.room.create({
      data: {
        hotelId,
        name,
        description,
        type,
        bedType,
        pricePerNight,
        availableRooms,
        totalRooms,
        size,
        view,
        images,
        amenities,
        isActive,
      },
    });

    return res.status(201).json({ message: "Room added successfully", room });
  } catch (error) {
    // Foreign key violation -> hotel does not exist
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId as string);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const {
      name,
      description,
      type,
      bedType,
      pricePerNight,
      availableRooms,
      totalRooms,
      size,
      view,
      images,
      amenities,
      isActive,
    } = req.body;

    // Build a partial update payload so only provided fields are touched
    const data: Prisma.RoomUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (bedType !== undefined) data.bedType = bedType;
    if (pricePerNight !== undefined) data.pricePerNight = pricePerNight;
    if (availableRooms !== undefined) data.availableRooms = availableRooms;
    if (totalRooms !== undefined) data.totalRooms = totalRooms;
    if (size !== undefined) data.size = size;
    if (view !== undefined) data.view = view;
    if (images !== undefined) data.images = images;
    if (amenities !== undefined) data.amenities = amenities;
    if (isActive !== undefined) data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data,
    });

    return res.status(200).json({ message: "Room updated successfully", room });
  } catch (error) {
    // Record to update not found
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Room not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId as string);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    await prisma.room.delete({ where: { id: roomId } });

    return res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    // Record to delete not found
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Room not found" });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
