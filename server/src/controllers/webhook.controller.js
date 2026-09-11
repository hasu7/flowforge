import Workflow from "../models/workflow.js";
import WorkflowVersion from "../models/workflowVersion.js";

import {
  executeWorkflow
} from "../services/workflow-engine.service.js";

const SUPPORTED_WEBHOOK_METHODS = [
  "POST",
  "GET",
  "PUT",
  "PATCH"
];

const normalizeWebhookPath = (
  webhookPath
) => {
  if (
    typeof webhookPath !==
    "string"
  ) {
    return "";
  }

  return webhookPath
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
};

const getWebhookTriggerNode = (
  nodes
) => {
  return nodes.find((node) => {
    const nodeType =
      node?.config?.nodeType ||
      node?.data?.nodeType ||
      node?.type;

    const triggerType =
      node?.config?.triggerType;

    return (
      nodeType === "trigger" &&
      triggerType === "webhook"
    );
  });
};

const getConfiguredWebhookPath = (
  node
) => {
  return normalizeWebhookPath(
    node?.config?.webhookPath
  );
};

const isWebhookSecretValid = (
  configuredSecret,
  requestSecret
) => {
  if (!configuredSecret) {
    return true;
  }

  if (
    typeof requestSecret !==
    "string"
  ) {
    return false;
  }

  return (
    requestSecret ===
    configuredSecret
  );
};

export const handleWebhook = async (
  req,
  res,
  next
) => {
  try {
    const requestPath =
      normalizeWebhookPath(
        req.params.webhookPath
      );

    const requestMethod =
      req.method.toUpperCase();

    if (
      !SUPPORTED_WEBHOOK_METHODS.includes(
        requestMethod
      )
    ) {
      return res.status(405).json({
        success: false,
        message:
          "Webhook method is not supported."
      });
    }

    if (!requestPath) {
      return res.status(400).json({
        success: false,
        message:
          "Webhook path is required."
      });
    }

    const workflows =
      await Workflow.find({
        status: "published"
      });

    let matchedWorkflow = null;
    let matchedTriggerNode = null;

    for (
      const workflow of workflows
    ) {
      const triggerNode =
        getWebhookTriggerNode(
          workflow.nodes || []
        );

      if (!triggerNode) {
        continue;
      }

      const configuredPath =
        getConfiguredWebhookPath(
          triggerNode
        );

      if (
        configuredPath ===
        requestPath
      ) {
        matchedWorkflow =
          workflow;

        matchedTriggerNode =
          triggerNode;

        break;
      }
    }

    if (!matchedWorkflow) {
      return res.status(404).json({
        success: false,
        message:
          "Webhook endpoint not found."
      });
    }

    const configuredMethod =
      (
        matchedTriggerNode
          ?.config
          ?.webhookMethod ||
        "POST"
      ).toUpperCase();

    if (
      configuredMethod !==
      requestMethod
    ) {
      return res.status(405).json({
        success: false,
        message:
          `Webhook expects ${configuredMethod} requests.`
      });
    }

    const configuredSecret =
      matchedTriggerNode
        ?.config
        ?.webhookSecret ||
      "";

    const requestSecret =
      req.get(
        "x-webhook-secret"
      );

    if (
      !isWebhookSecretValid(
        configuredSecret,
        requestSecret
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid webhook secret."
      });
    }

    if (
      matchedWorkflow
        .publishedVersion ===
      null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workflow does not have a published version."
      });
    }

    const publishedVersion =
      await WorkflowVersion.findOne({
        workflow:
          matchedWorkflow._id,
        version:
          matchedWorkflow.publishedVersion
      });

    if (!publishedVersion) {
      return res.status(404).json({
        success: false,
        message:
          "Published workflow version not found."
      });
    }

    const webhookPayload = {
      method:
        req.method,

      path:
        requestPath,

      query:
        req.query,

      headers:
        req.headers,

      body:
        req.body,

      params:
        req.params
    };

    const execution =
      await executeWorkflow({
        workflow: {
          _id:
            matchedWorkflow._id,

          nodes:
            publishedVersion.nodes,

          edges:
            publishedVersion.edges
        },

        userId:
          matchedWorkflow.owner,

        triggerInput:
          webhookPayload,

        triggerType:
          "webhook"
      });

    return res.status(200).json({
      success: true,

      message:
        "Webhook workflow executed.",

      executionId:
        execution._id,

      status:
        execution.status
    });
  } catch (error) {
    next(error);
  }
};