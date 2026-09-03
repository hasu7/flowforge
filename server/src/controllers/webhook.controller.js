import Workflow from "../models/workflow.js";
import WorkflowVersion from "../models/workflowVersion.js";
import {
  executeWorkflow
} from "../services/workflow-engine.service.js";

export const handleWebhook = async (
  req,
  res,
  next
) => {
  try {
    const workflow =
      await Workflow.findById(
        req.params.workflowId
      );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found."
      });
    }

    if (
      workflow.status !==
      "published"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workflow must be published before it can receive webhook requests."
      });
    }

    if (
      workflow.publishedVersion ===
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
          workflow._id,

        version:
          workflow.publishedVersion
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
            workflow._id,

          nodes:
            publishedVersion.nodes,

          edges:
            publishedVersion.edges
        },

        userId:
          workflow.owner,

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