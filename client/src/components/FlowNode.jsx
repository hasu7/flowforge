import {
  Handle,
  Position
} from "@xyflow/react";

const nodeConfig = {
  trigger: {
    icon: "⚡",
    title: "Trigger",
    description: "Starts the workflow"
  },

  http: {
    icon: "↗",
    title: "HTTP Request",
    description: "Call an external API"
  },

  condition: {
    icon: "◇",
    title: "Condition",
    description: "Check a condition"
  }
};

function FlowNode({ data }) {
  const config =
    nodeConfig[data.nodeType] ||
    nodeConfig.trigger;

  return (
    <div className="flow-node">
      {data.nodeType !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
        />
      )}

      <div className="flow-node-header">
        <span className="flow-node-icon">
          {config.icon}
        </span>

        <span className="flow-node-title">
          {config.title}
        </span>
      </div>

      <p className="flow-node-description">
        {config.description}
      </p>

      {data.nodeType === "condition" ? (
        <>
          <div className="flow-node-output">
            <span>True</span>

            <Handle
              type="source"
              position={Position.Right}
              id="true"
            />
          </div>

          <div className="flow-node-output">
            <span>False</span>

            <Handle
              type="source"
              position={Position.Right}
              id="false"
            />
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
        />
      )}
    </div>
  );
}

export default FlowNode;