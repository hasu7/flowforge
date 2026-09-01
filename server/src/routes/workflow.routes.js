import express from "express";

import {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow
} from "../controllers/workflow.controller.js";

import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createWorkflow);
router.get("/", getWorkflows);
router.get("/:id", getWorkflow);
router.patch("/:id", updateWorkflow);
router.delete("/:id", deleteWorkflow);

export default router;