import Workflow from "../models/workflow.js";
import Execution from "../models/Execution.js";

import {
  executeWorkflow
} from "../services/workflow-engine.service.js";

export const runWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workflow =
      await Workflow.findOne({
        _id: id,
        owner: req.user._id
      });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message:
          "Workflow not found"
      });
    }

    const execution =
      await executeWorkflow({
        workflow,
        userId: req.user._id
      });

    return res.status(201).json({
      success: true,

      message:
        execution.status ===
        "success"
          ? "Workflow executed successfully"
          : "Workflow execution failed",

      execution: {
        id: execution._id,

        workflow:
          execution.workflow,

        status:
          execution.status,

        trigger:
          execution.trigger,

        startedAt:
          execution.startedAt,

        finishedAt:
          execution.finishedAt,

        durationMs:
          execution.durationMs,

        nodes:
          execution.nodes,

        error:
          execution.error
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getExecutions =
  async (req, res, next) => {
    try {
      const executions =
        await Execution.find({
          user: req.user._id
        })
          .populate(
            "workflow",
            "name description"
          )
          .sort({
            createdAt: -1
          })
          .limit(50);

      return res.status(200).json({
        success: true,
        executions
      });
    } catch (error) {
      next(error);
    }
  };

export const getExecution =
  async (req, res, next) => {
    try {
      const execution =
        await Execution.findOne({
          _id: req.params.id,

          user: req.user._id
        }).populate(
          "workflow",
          "name description"
        );

      if (!execution) {
        return res.status(404).json({
          success: false,
          message:
            "Execution not found"
        });
      }

      return res.status(200).json({
        success: true,
        execution
      });
    } catch (error) {
      next(error);
    }
  };