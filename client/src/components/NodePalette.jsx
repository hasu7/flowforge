function NodePalette({ onAddNode }) {
  return (
    <aside className="node-palette">
      <div className="node-palette-header">
        <h3>Nodes</h3>

        <p>
          Add building blocks to your workflow.
        </p>
      </div>

      <div className="node-palette-list">
        <button
          className="node-palette-item"
          onClick={() => onAddNode("trigger")}
        >
          <span className="node-icon">
            ⚡
          </span>

          <span>
            <strong>Trigger</strong>

            <small>
              Start a workflow
            </small>
          </span>
        </button>

        <button
          className="node-palette-item"
          onClick={() => onAddNode("http")}
        >
          <span className="node-icon">
            ↗
          </span>

          <span>
            <strong>HTTP Request</strong>

            <small>
              Call an API
            </small>
          </span>
        </button>

        <button
          className="node-palette-item"
          onClick={() => onAddNode("condition")}
        >
          <span className="node-icon">
            ◇
          </span>

          <span>
            <strong>Condition</strong>

            <small>
              Branch your workflow
            </small>
          </span>
        </button>
      </div>
    </aside>
  );
}

export default NodePalette;