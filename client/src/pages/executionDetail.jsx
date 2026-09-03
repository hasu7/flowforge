import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getExecution
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

function formatExecutionData(data) {
  if (
    data === null ||
    data === undefined
  ) {
    return "No data";
  }

  return JSON.stringify(
    data,
    null,
    2
  );
}

function getNodeTitle(nodeType) {
  if (nodeType === "trigger") {
    return "Trigger";
  }

  if (nodeType === "http") {
    return "HTTP Request";
  }

  if (nodeType === "condition") {
    return "Condition";
  }

  return nodeType;
}

function getStatusClass(status) {
  if (status === "success") {
    return "execution-detail-success";
  }

  if (status === "failed") {
    return "execution-detail-failed";
  }

  if (status === "skipped") {
    return "execution-detail-skipped";
  }

  return "execution-detail-pending";
}

function getNodeDuration(node) {
  if (
    !node.startedAt ||
    !node.finishedAt
  ) {
    return null;
  }

  const start =
    new Date(
      node.startedAt
    ).getTime();

  const finish =
    new Date(
      node.finishedAt
    ).getTime();

  return finish - start;
}

function ExecutionDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [execution, setExecution] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadExecution = async () => {
      try {
        const response =
          await getExecution(id);

        setExecution(
          response.execution
        );
      } catch (error) {
        console.error(
          "Failed to load execution:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load execution."
        );
      } finally {
        setLoading(false);
      }
    };

    loadExecution();
  }, [id]);

  if (loading) {
    return (
      <p>
        Loading execution...
      </p>
    );
  }

  if (error) {
    return (
      <div>
        <p className="form-error">
          {error}
        </p>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate(
              "/dashboard/executions"
            )
          }
        >
          Back to Executions
        </button>
      </div>
    );
  }

  if (!execution) {
    return (
      <p>
        Execution not found.
      </p>
    );
  }

  const orderedNodes =
    [...(execution.nodes || [])].sort(
      (a, b) => {
        const orderA =
          a.order === null ||
          a.order === undefined
            ? Number.POSITIVE_INFINITY
            : a.order;

        const orderB =
          b.order === null ||
          b.order === undefined
            ? Number.POSITIVE_INFINITY
            : b.order;

        if (
          orderA === orderB
        ) {
          return 0;
        }

        return orderA - orderB;
      }
    );

  return (
    <div className="execution-detail-page">

      <div className="execution-detail-header">

        <div>

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/dashboard/executions"
              )
            }
          >
            ← Back to Executions
          </button>

          <h2 className="dashboard-title">
            {execution.workflow?.name ||
              "Workflow Execution"}
          </h2>

          <p className="dashboard-description">
            Execution ID:{" "}
            {execution._id}
          </p>

        </div>

        <span
          className={`execution-detail-status ${getStatusClass(
            execution.status
          )}`}
        >
          {execution.status}
        </span>

      </div>

      <div className="execution-summary">

        <div className="execution-summary-item">

          <span className="execution-summary-label">
            Status
          </span>

          <strong>
            {execution.status}
          </strong>

        </div>

        <div className="execution-summary-item">

          <span className="execution-summary-label">
            Duration
          </span>

          <strong>
            {formatDuration(
              execution.durationMs
            )}
          </strong>

        </div>

        <div className="execution-summary-item">

          <span className="execution-summary-label">
            Trigger
          </span>

          <strong>
            {execution.trigger}
          </strong>

        </div>

        <div className="execution-summary-item">

          <span className="execution-summary-label">
            Started
          </span>

          <strong>
            {formatDate(
              execution.startedAt
            )}
          </strong>

        </div>

      </div>

      {execution.error && (
        <div className="execution-error">

          <div className="execution-error-title">
            Execution failed
          </div>

          <p>
            {execution.error}
          </p>

        </div>
      )}

      <div className="execution-nodes-section">

        <div className="execution-section-header">

          <div>

            <h3>
              Node Execution
            </h3>

            <p>
              Detailed results from each workflow node.
            </p>

          </div>

          <span>
            {orderedNodes.length} nodes
          </span>

        </div>

        <div className="execution-node-list">

          {orderedNodes.map(
            (node, index) => {
              const nodeDuration =
                getNodeDuration(
                  node
                );

              const hasInput =
                node.input !== null &&
                node.input !== undefined;

              const hasOutput =
                node.output !== null &&
                node.output !== undefined;

              return (
                <div
                  key={node.nodeId}
                  className="execution-node-card"
                >

                  <div className="execution-node-top">

                    <div className="execution-node-number">
                      {node.order ??
                        index + 1}
                    </div>

                    <div className="execution-node-info">

                      <h4>
                        {getNodeTitle(
                          node.nodeType
                        )}
                      </h4>

                      <span>
                        {node.nodeId}
                      </span>

                    </div>

                    <div
                      className={`execution-node-status ${getStatusClass(
                        node.status
                      )}`}
                    >
                      {node.status}
                    </div>

                  </div>

                  <div className="execution-node-meta">

                    <span>
                      Duration:{" "}
                      {nodeDuration !== null
                        ? formatDuration(
                            nodeDuration
                          )
                        : "-"}
                    </span>

                    <span>
                      Started:{" "}
                      {formatDate(
                        node.startedAt
                      )}
                    </span>

                  </div>

                  {node.error && (
                    <div className="execution-node-error">
                      {node.error}
                    </div>
                  )}

                  {node.nodeType ===
                    "condition" &&
                    hasOutput &&
                    node.output &&
                    typeof node.output ===
                      "object" &&
                    "result" in
                      node.output && (
                      <div className="condition-result">

                        <span>
                          Condition result
                        </span>

                        <strong>
                          {node.output.result
                            ? "TRUE"
                            : "FALSE"}
                        </strong>

                      </div>
                    )}

                  <div className="execution-data-section">

                    <div className="execution-data-grid">

                      <details className="execution-data">

                        <summary>
                          View input
                        </summary>

                        <pre>
                          {hasInput
                            ? formatExecutionData(
                                node.input
                              )
                            : "No input data"}
                        </pre>

                      </details>

                      <details className="execution-data">

                        <summary>
                          View output
                        </summary>

                        <pre>
                          {hasOutput
                            ? formatExecutionData(
                                node.output
                              )
                            : "No output data"}
                        </pre>

                      </details>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

    </div>
  );
}

export default ExecutionDetail;