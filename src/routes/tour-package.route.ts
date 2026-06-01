import express from "express";
import {
  addTourPackage,
  deleteTourPackageById,
  getAllTourPackages,
  getTourPackage,
  updateTourPackageById,
} from "../controllers/tour-package/tour-package.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorizeAdmin } from "../middlewares/authorizeAdmin";

const router = express.Router();

// Public — search/filter/paginate
router.get("/", getAllTourPackages);
router.get("/:id", getTourPackage);

// Admin only
router.post("/", authenticate, authorizeAdmin, addTourPackage);
router.put("/:id", authenticate, authorizeAdmin, updateTourPackageById);
router.delete("/:id", authenticate, authorizeAdmin, deleteTourPackageById);

export default router;
