import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createWorkflow } from "../services/workflow.services.js";

function NewWorkflow() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await createWorkflow({
        name,
        description
      });

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create workflow."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workflow-form-page">
      <div className="workflow-form-header">
        <div>
          <h2 className="dashboard-title">
            Create Workflow
          </h2>

          <p className="dashboard-description">
            Create a workflow and start building your automation.
          </p>
        </div>
      </div>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <form
        className="workflow-form"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="workflow-name">
            Workflow name
          </label>

          <input
            id="workflow-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Customer Welcome Workflow"
            maxLength="100"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="workflow-description">
            Description
          </label>

          <textarea
            id="workflow-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Send a welcome message when a new customer joins"
            maxLength="500"
            rows="5"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Workflow"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewWorkflow;