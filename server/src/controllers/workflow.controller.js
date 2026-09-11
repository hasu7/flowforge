import Workflow from "../models/workflow.js";
import WorkflowVersion from "../models/workflowVersion.js";

import {
  updateWorkflowSchema
} from "../validation/workflow.validation.js";

import {
  validateWorkflowGraph
} from "../services/workflow-engine.service.js";

import {
  refreshScheduler,
  getSchedulerStatus
} from "../services/scheduler.service.js";

export const createWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const workflow =
      await Workflow.create({
        name: req.body.name,
        description:
          req.body.description || "",
        owner: req.user._id
      });

    return res.status(201).json({
      success: true,
      workflow
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflows = async (
  req,
  res,
  next
) => {
  try {
    const workflows =
      await Workflow.find({
        owner: req.user._id
      }).sort({
        updatedAt: -1
      });

    return res.json({
      success: true,
      workflows
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const workflow =
      await Workflow.findOne({
        _id: req.params.id,
        owner: req.user._id
      });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found."
      });
    }

    return res.json({
      success: true,
      workflow
    });
  } catch (error) {
    next(error);
  }
};

export const getScheduleStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found."
        });
      }

      const schedulerStatus =
        getSchedulerStatus();

      const workflowId =
        workflow._id.toString();

      const schedules =
        schedulerStatus.schedules.filter(
          (schedule) =>
            schedule.key.startsWith(
              `${workflowId}:`
            )
        );

      /*
       * A workflow can only contain one
       * trigger, and Schedule is one of the
       * supported trigger types.
       */
      const activeSchedule =
        schedules.length > 0
          ? schedules[0]
          : null;

      return res.json({
        success: true,

        schedule: {
          active:
            activeSchedule !== null,

          nextRun:
            activeSchedule?.nextRun ||
            null
        }
      });
    } catch (error) {
      next(error);
    }
  };

export const updateWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const workflow =
      await Workflow.findOne({
        _id: req.params.id,
        owner: req.user._id
      });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found."
      });
    }

    if (
      req.body.name !== undefined
    ) {
      workflow.name =
        req.body.name;
    }

    if (
      req.body.description !==
      undefined
    ) {
      workflow.description =
        req.body.description;
    }

    if (
      req.body.nodes !== undefined
    ) {
      workflow.nodes =
        req.body.nodes;
    }

    if (
      req.body.edges !== undefined
    ) {
      workflow.edges =
        req.body.edges;
    }

    workflow.version += 1;

    await workflow.save();

    return res.json({
      success: true,
      workflow
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const workflow =
      await Workflow.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id
      });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found."
      });
    }

    await WorkflowVersion.deleteMany({
      workflow: workflow._id
    });

    try {
      await refreshScheduler();
    } catch (schedulerError) {
      console.error(
        "Failed to refresh scheduler after workflow deletion:",
        schedulerError
      );
    }

    return res.json({
      success: true,
      message:
        "Workflow deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};

export const publishWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const workflow =
      await Workflow.findOne({
        _id: req.params.id,
        owner: req.user._id
      });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found."
      });
    }

    const schemaResult =
      updateWorkflowSchema
        .pick({
          nodes: true,
          edges: true
        })
        .safeParse({
          nodes:
            workflow.nodes || [],
          edges:
            workflow.edges || []
        });

    if (!schemaResult.success) {
      return res.status(400).json({
        success: false,
        message:
          "Workflow contains invalid node or edge configuration.",
        errors:
          schemaResult.error.issues.map(
            (issue) => ({
              path:
                issue.path,
              message:
                issue.message
            })
          )
      });
    }

    const validationErrors =
      validateWorkflowGraph(
        workflow.nodes || [],
        workflow.edges || []
      );

    if (
      validationErrors.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workflow validation failed.",
        errors:
          validationErrors
      });
    }

    const latestVersion =
      await WorkflowVersion.findOne({
        workflow:
          workflow._id
      }).sort({
        version: -1
      });

    const nextPublishedVersion =
      latestVersion
        ? latestVersion.version + 1
        : 1;

    const publishedVersion =
      await WorkflowVersion.create({
        workflow: workflow._id,
        owner: workflow.owner,
        version:
          nextPublishedVersion,
        name: workflow.name,
        description:
          workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        publishedAt: new Date()
      });

    workflow.status =
      "published";

    workflow.publishedVersion =
      nextPublishedVersion;

    workflow.publishedAt =
      publishedVersion.publishedAt;

    await workflow.save();

    try {
      await refreshScheduler();
    } catch (schedulerError) {
      console.error(
        `Failed to refresh scheduler after publishing workflow ${workflow._id}:`,
        schedulerError
      );
    }

    return res.json({
      success: true,
      message:
        "Workflow published successfully.",
      workflow,
      publishedVersion
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflowVersions =
  async (
    req,
    res,
    next
  ) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found."
        });
      }

      const versions =
        await WorkflowVersion.find({
          workflow: workflow._id
        }).sort({
          version: -1
        });

      return res.json({
        success: true,
        versions
      });
    } catch (error) {
      next(error);
    }
  };

export const getWorkflowVersion =
  async (
    req,
    res,
    next
  ) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found."
        });
      }

      const version =
        Number(req.params.version);

      if (
        !Number.isInteger(version) ||
        version < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workflow version."
        });
      }

      const workflowVersion =
        await WorkflowVersion.findOne({
          workflow: workflow._id,
          version
        });

      if (!workflowVersion) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow version not found."
        });
      }

      return res.json({
        success: true,
        version:
          workflowVersion
      });
    } catch (error) {
      next(error);
    }
  };

export const restoreWorkflowVersion =
  async (
    req,
    res,
    next
  ) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found."
        });
      }

      const version =
        Number(req.params.version);

      if (
        !Number.isInteger(version) ||
        version < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workflow version."
        });
      }

      const workflowVersion =
        await WorkflowVersion.findOne({
          workflow: workflow._id,
          version
        });

      if (!workflowVersion) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow version not found."
        });
      }

      workflow.name =
        workflowVersion.name;

      workflow.description =
        workflowVersion.description;

      workflow.nodes =
        workflowVersion.nodes;

      workflow.edges =
        workflowVersion.edges;

      workflow.status =
        "draft";

      workflow.publishedVersion =
        null;

      workflow.publishedAt =
        null;

      workflow.version += 1;

      await workflow.save();

      try {
        await refreshScheduler();
      } catch (schedulerError) {
        console.error(
          `Failed to refresh scheduler after restoring workflow ${workflow._id}:`,
          schedulerError
        );
      }

      return res.json({
        success: true,
        message:
          `Workflow restored from version ${version}.`,
        workflow,
        restoredFromVersion:
          version
      });
    } catch (error) {
      next(error);
    }
  };