import Workflow from "../models/workflow.js";
import WorkflowVersion from "../models/workflowVersion.js";

import {
  validateWorkflowGraph
} from "../services/workflow-engine.service.js";

export const createWorkflow = async (
  req,
  res
) => {
  try {
    const {
      name,
      description
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          "Workflow name is required"
      });
    }

    const workflow =
      await Workflow.create({
        name: name.trim(),

        description:
          description?.trim() || "",

        owner:
          req.user._id
      });

    return res.status(201).json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error(
      "Create workflow error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create workflow"
    });
  }
};

export const getWorkflows =
  async (req, res) => {
    try {
      const workflows =
        await Workflow.find({
          owner: req.user._id
        }).sort({
          updatedAt: -1
        });

      return res.status(200).json({
        success: true,
        workflows
      });
    } catch (error) {
      console.error(
        "Get workflows error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch workflows"
      });
    }
  };

export const getWorkflow =
  async (req, res) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,

          owner:
            req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found"
        });
      }

      return res.status(200).json({
        success: true,
        workflow
      });
    } catch (error) {
      console.error(
        "Get workflow error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch workflow"
      });
    }
  };

export const updateWorkflow =
  async (req, res) => {
    try {
      const {
        name,
        description,
        nodes,
        edges
      } = req.body;

      const workflow =
        await Workflow.findOne({
          _id: req.params.id,

          owner:
            req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found"
        });
      }

      if (name !== undefined) {
        workflow.name =
          name.trim();
      }

      if (
        description !==
        undefined
      ) {
        workflow.description =
          description.trim();
      }

      if (nodes !== undefined) {
        workflow.nodes =
          nodes;
      }

      if (edges !== undefined) {
        workflow.edges =
          edges;
      }

      workflow.version += 1;

      await workflow.save();

      return res.status(200).json({
        success: true,
        workflow
      });
    } catch (error) {
      console.error(
        "Update workflow error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update workflow"
      });
    }
  };

export const deleteWorkflow =
  async (req, res) => {
    try {
      const workflow =
        await Workflow.findOneAndDelete({
          _id: req.params.id,

          owner:
            req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found"
        });
      }

      await WorkflowVersion.deleteMany({
        workflow:
          workflow._id,

        owner:
          req.user._id
      });

      return res.status(200).json({
        success: true,
        message:
          "Workflow deleted successfully"
      });
    } catch (error) {
      console.error(
        "Delete workflow error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete workflow"
      });
    }
  };

export const publishWorkflow =
  async (req, res) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,

          owner:
            req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found"
        });
      }

      const validationErrors =
        validateWorkflowGraph(
          workflow.nodes || [],
          workflow.edges || []
        );

      if (
        validationErrors.length > 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workflow cannot be published.",
          errors:
            validationErrors
        });
      }

      const nextVersion =
        workflow.publishedVersion ===
        null
          ? 1
          : workflow.publishedVersion + 1;

      const existingVersion =
        await WorkflowVersion.findOne({
          workflow:
            workflow._id,

          version:
            nextVersion
        });

      if (existingVersion) {
        return res.status(409).json({
          success: false,
          message:
            "This workflow version already exists."
        });
      }

      const publishedVersion =
        await WorkflowVersion.create({
          workflow:
            workflow._id,

          owner:
            req.user._id,

          version:
            nextVersion,

          name:
            workflow.name,

          description:
            workflow.description,

          nodes:
            workflow.nodes.map(
              (node) => ({
                id:
                  node.id,

                type:
                  node.type,

                position: {
                  x:
                    node.position.x,

                  y:
                    node.position.y
                },

                config:
                  node.config || {}
              })
            ),

          edges:
            workflow.edges.map(
              (edge) => ({
                id:
                  edge.id,

                source:
                  edge.source,

                target:
                  edge.target,

                sourceHandle:
                  edge.sourceHandle ||
                  null,

                targetHandle:
                  edge.targetHandle ||
                  null
              })
            ),

          publishedAt:
            new Date()
        });

      workflow.status =
        "published";

      workflow.publishedVersion =
        nextVersion;

      workflow.publishedAt =
        publishedVersion.publishedAt;

      await workflow.save();

      return res.status(201).json({
        success: true,

        message:
          `Workflow published as version ${nextVersion}.`,

        workflow,

        version:
          publishedVersion
      });
    } catch (error) {
      console.error(
        "Publish workflow error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to publish workflow"
      });
    }
  };

export const getWorkflowVersions =
  async (req, res) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,

          owner:
            req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found"
        });
      }

      const versions =
        await WorkflowVersion.find({
          workflow:
            workflow._id,

          owner:
            req.user._id
        })
          .sort({
            version: -1
          })
          .select(
            "version name description publishedAt createdAt"
          );

      return res.status(200).json({
        success: true,
        versions
      });
    } catch (error) {
      console.error(
        "Get workflow versions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch workflow versions"
      });
    }
  };

export const getWorkflowVersion =
  async (req, res) => {
    try {
      const workflow =
        await Workflow.findOne({
          _id: req.params.id,

          owner:
            req.user._id
        });

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow not found"
        });
      }

      const versionNumber =
        Number(
          req.params.version
        );

      if (
        !Number.isInteger(
          versionNumber
        ) ||
        versionNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workflow version."
        });
      }

      const version =
        await WorkflowVersion.findOne({
          workflow:
            workflow._id,

          owner:
            req.user._id,

          version:
            versionNumber
        });

      if (!version) {
        return res.status(404).json({
          success: false,
          message:
            "Workflow version not found."
        });
      }

      return res.status(200).json({
        success: true,
        version
      });
    } catch (error) {
      console.error(
        "Get workflow version error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch workflow version"
      });
    }
  };