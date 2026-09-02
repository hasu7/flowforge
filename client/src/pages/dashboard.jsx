import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getWorkflows } from "../services/workflow.services.js";
import WorkflowCard from "../components/workflowCard.jsx";

function Dashboard() {
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const response = await getWorkflows();

        setWorkflows(response.workflows);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load workflows."
        );
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">
            Your Workflows
          </h2>

          <p className="dashboard-description">
            Build and manage your automated workflows.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/dashboard/new")}
        >
          + New Workflow
        </button>
      </div>

      {loading && (
        <p>Loading workflows...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        workflows.length === 0 && (
          <div>
            <h3>No workflows yet</h3>

            <p>
              Create your first workflow
              to get started.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        workflows.length > 0 && (
          <div className="workflow-grid">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow._id}
                workflow={workflow}
              />
            ))}
          </div>
        )}
    </div>
  );
}

export default Dashboard;