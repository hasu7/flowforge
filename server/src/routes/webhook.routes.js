import express from "express";

import {
  handleWebhook
} from "../controllers/webhook.controller.js";

const router =
  express.Router();

router.post(
  "/:workflowId",
  handleWebhook
);

export default router;