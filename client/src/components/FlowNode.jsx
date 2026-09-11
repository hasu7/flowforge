import {
  Handle,
  Position
} from "@xyflow/react";

const nodeConfig = {
  trigger: {
    icon: "⚡",
    title: "Trigger",
    description: "Starts the workflow",
    color: "#a78bfa",
    background: "#2a2140",
    border: "#6d4fc2"
  },

  http: {
    icon: "↗",
    title: "HTTP Request",
    description: "Call an external API",
    color: "#60a5fa",
    background: "#172b45",
    border: "#3478c9"
  },

  condition: {
    icon: "◇",
    title: "Condition",
    description: "Check a condition",
    color: "#fbbf24",
    background: "#3a3018",
    border: "#a47b18"
  },

  schedule: {
    icon: "◷",
    title: "Schedule",
    description: "Run on a schedule",
    color: "#4ade80",
    background: "#183525",
    border: "#2f9854"
  }
};

function FlowNode({ data }) {
  const config =
    nodeConfig[data?.nodeType] ||
    nodeConfig.trigger;

  return (
    <div
      className="flow-node"
      style={{
        borderColor: config.border,
        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px ${config.background}`
      }}
    >
      {data?.nodeType !== "trigger" &&
        data?.nodeType !== "schedule" && (
          <Handle
            type="target"
            position={Position.Left}
            style={{
              background: config.color,
              borderColor: "#151922"
            }}
          />
        )}

      <div
        className="flow-node-header"
        style={{
          borderBottomColor: config.border
        }}
      >
        <span
          className="flow-node-icon"
          style={{
            background: config.background,
            color: config.color
          }}
        >
          {config.icon}
        </span>

        <span
          className="flow-node-title"
          style={{
            color: config.color
          }}
        >
          {config.title}
        </span>
      </div>

      <p className="flow-node-description">
        {config.description}
      </p>

      {data?.nodeType === "condition" ? (
        <>
          <div className="flow-node-output">
            <span>True</span>

            <Handle
              type="source"
              position={Position.Right}
              id="true"
              style={{
                background: "#4ade80",
                borderColor: "#151922"
              }}
            />
          </div>

          <div className="flow-node-output">
            <span>False</span>

            <Handle
              type="source"
              position={Position.Right}
              id="false"
              style={{
                background: "#ef7d84",
                borderColor: "#151922"
              }}
            />
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: config.color,
            borderColor: "#151922"
          }}
        />
      )}
    </div>
  );
}

export default FlowNode;