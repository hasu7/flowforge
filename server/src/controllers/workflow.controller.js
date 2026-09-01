import Workflow from "../models/workflow.js";

export const createWorkflow = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Workflow name is required"
      });
    }

    const workflow = await Workflow.create({
      name: name.trim(),
      description: description?.trim() || "",
      owner: req.user._id
    });

    return res.status(201).json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error("Create workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create workflow"
    });
  }
};

export const getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({
      owner: req.user._id
    }).sort({
      updatedAt: -1
    });

    return res.status(200).json({
      success: true,
      workflows
    });
  } catch (error) {
    console.error("Get workflows error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch workflows"
    });
  }
};

export const getWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found"
      });
    }

    return res.status(200).json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error("Get workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch workflow"
    });
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;

    const workflow = await Workflow.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found"
      });
    }

    if (name !== undefined) {
      workflow.name = name.trim();
    }

    if (description !== undefined) {
      workflow.description = description.trim();
    }

    if (nodes !== undefined) {
      workflow.nodes = nodes;
    }

    if (edges !== undefined) {
      workflow.edges = edges;
    }

    await workflow.save();

    return res.status(200).json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error("Update workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update workflow"
    });
  }
};

export const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Workflow deleted successfully"
    });
  } catch (error) {
    console.error("Delete workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete workflow"
    });
  }
};