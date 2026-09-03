import mongoose from "mongoose";

const workflowVersionNodeSchema =
  new mongoose.Schema(
    {
      id: {
        type: String,
        required: true
      },

      type: {
        type: String,
        required: true
      },

      position: {
        x: {
          type: Number,
          required: true
        },

        y: {
          type: Number,
          required: true
        }
      },

      config: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    {
      _id: false
    }
  );

const workflowVersionEdgeSchema =
  new mongoose.Schema(
    {
      id: {
        type: String,
        required: true
      },

      source: {
        type: String,
        required: true
      },

      target: {
        type: String,
        required: true
      },

      sourceHandle: {
        type: String,
        default: null
      },

      targetHandle: {
        type: String,
        default: null
      }
    },
    {
      _id: false
    }
  );

const workflowVersionSchema =
  new mongoose.Schema(
    {
      workflow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workflow",
        required: true,
        index: true
      },

      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      },

      version: {
        type: Number,
        required: true
      },

      name: {
        type: String,
        required: true,
        trim: true
      },

      description: {
        type: String,
        default: "",
        trim: true
      },

      nodes: {
        type: [workflowVersionNodeSchema],
        default: []
      },

      edges: {
        type: [workflowVersionEdgeSchema],
        default: []
      },

      publishedAt: {
        type: Date,
        default: Date.now
      }
    },
    {
      timestamps: true
    }
  );

workflowVersionSchema.index(
  {
    workflow: 1,
    version: -1
  },
  {
    unique: true
  }
);

const WorkflowVersion =
  mongoose.model(
    "WorkflowVersion",
    workflowVersionSchema
  );

export default WorkflowVersion;