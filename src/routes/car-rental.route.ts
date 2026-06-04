import express from "express";
import {
  addCarRental,
  deleteCarRentalById,
  getAllCarRental,
  getCarRentalById,
  updateCarRentalById,
} from "../controllers/car-rental/car-rental.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorizeAdmin } from "../middlewares/authorizeAdmin";

const router = express.Router();

// Public
router.get("/", getAllCarRental);
router.get("/:id", getCarRentalById);

// Admin only
router.post("/", authenticate, authorizeAdmin, addCarRental);
router.put("/:id", authenticate, authorizeAdmin, updateCarRentalById);
router.delete("/:id", authenticate, authorizeAdmin, deleteCarRentalById);

export default router;
