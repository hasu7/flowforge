import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import workflowRoutes from "./routes/workflow.routes.js";
import executionRoutes from "./routes/execution.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin:
      "http://localhost:5173",
    credentials: true
  })
);

app.use(
  express.json()
);

app.use(
  cookieParser()
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "FlowForge API is running"
  });
});

app.use(
  "/api/v1/health",
  healthRoutes
);

app.use(
  "/api/v1/auth",
  authRoutes
);

app.use(
  "/api/v1/workflows",
  workflowRoutes
);

app.use(
  "/api/v1",
  executionRoutes
);

app.use(
  "/api/v1/webhooks",
  webhookRoutes
);

app.use(
  errorHandler
);

export default app;