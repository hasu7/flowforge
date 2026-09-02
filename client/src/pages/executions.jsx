import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getExecutions
} from "../services/execution.service.js";

function formatDuration(durationMs) {
  if (
    durationMs === null ||
    durationMs === undefined
  ) {
    return "-";
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(
    durationMs / 1000
  ).toFixed(2)}s`;
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  return new Date(
    dateString
  ).toLocaleString();
}

function getStatusClass(status) {
  if (status === "success") {
    return "execution-status-success";
  }

  if (status === "failed") {
    return "execution-status-failed";
  }

  return "execution-status-pending";
}

function Executions() {
  const navigate = useNavigate();

  const [executions, setExecutions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadExecutions = async () => {
      try {
        const response =
          await getExecutions();

        setExecutions(
          response.executions || []
        );
      } catch (error) {
        console.error(
          "Failed to load executions:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load executions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadExecutions();
  }, []);

  return (
    <div className="executions-page">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">
            Execution History
          </h2>

          <p className="dashboard-description">
            Monitor your workflow runs and inspect their results.
          </p>
        </div>
      </div>

      {loading && (
        <p>
          Loading executions...
        </p>
      )}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        executions.length === 0 && (
          <div className="empty-state">
            <h3>
              No executions yet
            </h3>

            <p>
              Run a workflow to see its execution history here.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        executions.length > 0 && (
          <div className="execution-list">
            {executions.map(
              (execution) => (
                <button
                  key={execution._id}
                  type="button"
                  className="execution-card"
                  onClick={() =>
                    navigate(
                      `/dashboard/executions/${execution._id}`
                    )
                  }
                >
                  <div className="execution-card-main">
                    <div>
                      <h3>
                        {execution.workflow?.name ||
                          "Unknown workflow"}
                      </h3>

                      <p>
                        {formatDate(
                          execution.startedAt
                        )}
                      </p>
                    </div>

                    <span
                      className={`execution-status ${getStatusClass(
                        execution.status
                      )}`}
                    >
                      <span className="execution-status-dot" />

                      {execution.status}
                    </span>
                  </div>

                  <div className="execution-card-meta">
                    <span>
                      Duration:{" "}
                      {formatDuration(
                        execution.durationMs
                      )}
                    </span>

                    <span>
                      Trigger:{" "}
                      {execution.trigger}
                    </span>

                    <span>
                      Nodes:{" "}
                      {execution.nodes?.length ||
                        0}
                    </span>
                  </div>
                </button>
              )
            )}
          </div>
        )}
    </div>
  );
}

export default Executions;