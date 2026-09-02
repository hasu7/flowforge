import { useNavigate } from "react-router-dom";

function WorkflowCard({ workflow }) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(`/dashboard/editor/${workflow._id}`);
  };

  return (
    <div
      className="workflow-card"
      onClick={handleOpen}
    >
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