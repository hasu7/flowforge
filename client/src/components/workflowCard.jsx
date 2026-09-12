import { useNavigate } from "react-router-dom";

function WorkflowCard({ workflow }) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(
      `/dashboard/editor/${workflow._id}`
    );
  };

  const isPublished =
    workflow.status === "published";

  return (
    <div
      className="workflow-card"
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          handleOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="workflow-card-header">
        <h3>{workflow.name}</h3>

        <span className="workflow-status">
          {isPublished
            ? "PUBLISHED"
            : "DRAFT"}
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
