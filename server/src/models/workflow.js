import mongoose from "mongoose";

const workflowNodeSchema = new mongoose.Schema(
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

const workflowEdgeSchema = new mongoose.Schema(
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
    }
  },
  {
    _id: false
  }
);

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    nodes: {
      type: [workflowNodeSchema],
      default: []
    },

    edges: {
      type: [workflowEdgeSchema],
      default: []
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },

    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

const Workflow = mongoose.model("Workflow", workflowSchema);

export default Workflow;