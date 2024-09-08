import { createServer } from "http";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import UserRoutes from "./routes/user.routes.js";
import ProductRoutes from "./routes/product.routes.js";
import PlanRoutes from "./routes/plan.routes.js";

function main() {
  const port = process.env.port;
  const mongodb_url = process.env.mongodb_url;
  const app = express();

  const server = createServer(app);
  app.use(express.json());
  app.use(express.urlencoded({ limit: "30 mb", extended: true }));

  mongoose
    .connect(mongodb_url)
    .then(() => {
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((e) => console.log(e));

  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    })
  );

  app.use("/user", UserRoutes);
  app.use("/product", ProductRoutes);
  app.use("/plan", PlanRoutes);
}
main();
