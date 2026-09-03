import mongoose from "mongoose";

const executionNodeSchema =
  new mongoose.Schema(
    {
      nodeId: {
        type: String,
        required: true
      },

      nodeType: {
        type: String,
        required: true
      },

      order: {
        type: Number,
        default: null
      },

      status: {
        type: String,
        enum: [
          "pending",
          "running",
          "success",
          "failed",
          "skipped"
        ],
        default: "pending"
      },

      startedAt: {
        type: Date,
        default: null
      },

      finishedAt: {
        type: Date,
        default: null
      },

      input: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

      output: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

      error: {
        type: String,
        default: null
      }
    },
    {
      _id: false
    }
  );

const executionSchema =
  new mongoose.Schema(
    {
      workflow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workflow",
        required: true,
        index: true
      },

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      },

      status: {
        type: String,
        enum: [
          "pending",
          "running",
          "success",
          "failed"
        ],
        default: "pending"
      },

      trigger: {
        type: String,
        default: "manual"
      },

      startedAt: {
        type: Date,
        default: null
      },

      finishedAt: {
        type: Date,
        default: null
      },

      durationMs: {
        type: Number,
        default: null
      },

      nodes: {
        type: [executionNodeSchema],
        default: []
      },

      error: {
        type: String,
        default: null
      }
    },
    {
      timestamps: true
    }
  );

const Execution =
  mongoose.model(
    "Execution",
    executionSchema
  );

export default Execution;