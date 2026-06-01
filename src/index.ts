import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);

import authRoutes from "./routes/auth.route";
import tourPackageRoutes from "./routes/tour-package.route";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tours", tourPackageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
