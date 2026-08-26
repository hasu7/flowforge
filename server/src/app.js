import express from "express";
import healthRoutes from "./routes/health.routes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FlowForge API is running"
  });
});

app.use("/api/v1/health", healthRoutes);

export default app;