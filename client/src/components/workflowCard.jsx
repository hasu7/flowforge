function WorkflowCard({ workflow }) {
  return (
    <div className="workflow-card">
      <div className="workflow-card-header">
        <h3>{workflow.name}</h3>

        <span className="workflow-status">
          DRAFT
        </span>
      </div>

      <p className="workflow-description">
        {workflow.description ||
          "No description provided"}
      </p>

      <div className="workflow-card-footer">
        <span>
          {workflow.nodes?.length || 0} nodes
        </span>

        <span>
          {workflow.edges?.length || 0} connections
        </span>
      </div>
    </div>
  );
}

export default WorkflowCard;