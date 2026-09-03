import express from "express";

import {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  publishWorkflow,
  getWorkflowVersions,
  getWorkflowVersion,
  restoreWorkflowVersion
} from "../controllers/workflow.controller.js";

import protect from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validation.middleware.js";

import {
  createWorkflowSchema,
  updateWorkflowSchema
} from "../validation/workflow.validation.js";

const router =
  express.Router();

router.use(protect);

router.post(
  "/",
  validate(
    createWorkflowSchema
  ),
  createWorkflow
);

router.get(
  "/",
  getWorkflows
);

router.get(
  "/:id/versions",
  getWorkflowVersions
);

router.get(
  "/:id/versions/:version",
  getWorkflowVersion
);

router.post(
  "/:id/versions/:version/restore",
  restoreWorkflowVersion
);

router.post(
  "/:id/publish",
  publishWorkflow
);

router.get(
  "/:id",
  getWorkflow
);

router.patch(
  "/:id",
  validate(
    updateWorkflowSchema
  ),
  updateWorkflow
);

router.delete(
  "/:id",
  deleteWorkflow
);

export default router;