import express from "express";

import {
  runWorkflow,
  getExecutions,
  getExecution
} from "../controllers/execution.controller.js";

import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/executions",
  getExecutions
);

router.get(
  "/executions/:id",
  getExecution
);

router.post(
  "/workflows/:id/run",
  runWorkflow
);

export default router;