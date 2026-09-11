import express from "express";

import {
  handleWebhook
} from "../controllers/webhook.controller.js";

const router =
  express.Router();

router.all(
  "/:webhookPath",
  handleWebhook
);

export default router;