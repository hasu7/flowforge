import {
  useEffect,
  useState
} from "react";

import {
  getWorkflowVersions,
  restoreWorkflowVersion
} from "../services/workflow.services.js";

const styles = {
  panel: {
    width: "290px",
    minWidth: "290px",
    height: "100%",
    background: "#151922",
    borderLeft: "1px solid #2a3040",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    color: "#f1f5f9"
  },

  header: {
    padding: "20px 18px 16px",
    borderBottom: "1px solid #2a3040"
  },

  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "5px"
  },

  title: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#f8fafc"
  },

  subtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#7f8ba3",
    lineHeight: 1.5
  },

  count: {
    fontSize: "11px",
    color: "#8d98ad",
    background: "#202635",
    border: "1px solid #303749",
    borderRadius: "999px",
    padding: "3px 8px"
  },

  content: {
    flex: 1,
    overflowY: "auto",
    padding: "14px"
  },

  loading: {
    padding: "30px 10px",
    textAlign: "center",
    color: "#7f8ba3",
    fontSize: "12px"
  },

  error: {
    margin: "4px 0",
    padding: "10px 12px",
    background: "#2a1b22",
    border: "1px solid #5b2938",
    borderRadius: "8px",
    color: "#fda4af",
    fontSize: "12px",
    lineHeight: 1.5
  },

  empty: {
    padding: "35px 15px",
    textAlign: "center",
    color: "#7f8ba3",
    fontSize: "12px",
    lineHeight: 1.6
  },

  versionCard: {
    background: "#1b202b",
    border: "1px solid #2b3241",
    borderRadius: "10px",
    padding: "13px",
    marginBottom: "10px",
    transition: "border-color 0.15s ease"
  },

  versionCardSelected: {
    border: "1px solid #4f5d78",
    background: "#1d2330"
  },

  versionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px"
  },

  versionName: {
    display: "flex",
    alignItems: "center",
    gap: "7px"
  },

  versionNumber: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#f1f5f9"
  },

  publishedBadge: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#86efac",
    background: "#163122",
    border: "1px solid #245333",
    borderRadius: "999px",
    padding: "2px 7px"
  },

  date: {
    fontSize: "11px",
    color: "#8d98ad",
    marginBottom: "9px"
  },

  stats: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "#a6afbf",
    marginBottom: "12px"
  },

  stat: {
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },

  actions: {
    display: "flex",
    gap: "7px"
  },

  viewButton: {
    flex: 1,
    height: "32px",
    borderRadius: "7px",
    border: "1px solid #343c4e",
    background: "#222836",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600
  },

  restoreButton: {
    flex: 1,
    height: "32px",
    borderRadius: "7px",
    border: "1px solid #343c4e",
    background: "transparent",
    color: "#aeb8c9",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600
  },

  restoreButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },

  details: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #2c3342"
  },

  detailsTitle: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#cbd5e1",
    marginBottom: "8px"
  },

  nodeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "7px 8px",
    marginBottom: "5px",
    background: "#161b24",
    border: "1px solid #272e3c",
    borderRadius: "6px"
  },

  nodeType: {
    fontSize: "11px",
    color: "#cbd5e1",
    fontWeight: 600
  },

  nodeId: {
    fontSize: "9px",
    color: "#667085",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "110px"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },

  modal: {
    width: "390px",
    maxWidth: "calc(100vw - 40px)",
    background: "#181d27",
    border: "1px solid #343c4d",
    borderRadius: "12px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    padding: "22px"
  },

  modalTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#f8fafc"
  },

  modalText: {
    margin: "9px 0 20px",
    fontSize: "12px",
    lineHeight: 1.6,
    color: "#9da8bb"
  },

  modalWarning: {
    padding: "10px 12px",
    marginBottom: "18px",
    background: "#29231a",
    border: "1px solid #514225",
    borderRadius: "7px",
    color: "#d8bd7c",
    fontSize: "11px",
    lineHeight: 1.5
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px"
  },

  cancelButton: {
    height: "34px",
    padding: "0 14px",
    borderRadius: "7px",
    border: "1px solid #343c4e",
    background: "transparent",
    color: "#aeb8c9",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600
  },

  confirmButton: {
    height: "34px",
    padding: "0 15px",
    borderRadius: "7px",
    border: "1px solid #4b5568",
    background: "#e5e7eb",
    color: "#111827",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 700
  }
};

function formatDate(dateValue) {
  if (!dateValue) {
    return "Unknown date";
  }

  return new Date(dateValue).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );
}

function getNodeLabel(node) {
  const nodeType =
    node?.config?.nodeType ||
    node?.type ||
    "unknown";

  switch (nodeType) {
    case "trigger":
      return "Trigger";

    case "http":
      return "HTTP Request";

    case "condition":
      return "Condition";

    default:
      return nodeType;
  }
}

function getNodeIcon(node) {
  const nodeType =
    node?.config?.nodeType ||
    node?.type;

  switch (nodeType) {
    case "trigger":
      return "⚡";

    case "http":
      return "↗";

    case "condition":
      return "◇";

    default:
      return "•";
  }
}

export default function VersionHistory({
  workflowId,
  currentPublishedVersion,
  onRestored
}) {
  const [versions, setVersions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedVersion, setSelectedVersion] =
    useState(null);

  const [restoringVersion, setRestoringVersion] =
    useState(null);

  const [confirmVersion, setConfirmVersion] =
    useState(null);

  async function loadVersions() {
    try {
      setLoading(true);
      setError("");

      const response =
        await getWorkflowVersions(
          workflowId
        );

      setVersions(
        response?.versions || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load version history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!workflowId) {
      return;
    }

    loadVersions();
  }, [workflowId]);

  function handleView(version) {
    if (selectedVersion === version) {
      setSelectedVersion(null);
      return;
    }

    setSelectedVersion(version);
  }

  async function handleRestore() {
    if (!confirmVersion) {
      return;
    }

    const version =
      confirmVersion;

    try {
      setRestoringVersion(version);
      setError("");

      const response =
        await restoreWorkflowVersion(
          workflowId,
          version
        );

      setConfirmVersion(null);
      setSelectedVersion(null);

      await loadVersions();

      if (onRestored) {
        await onRestored(
          response.workflow
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `Failed to restore version ${version}.`
      );
    } finally {
      setRestoringVersion(null);
    }
  }

  return (
    <>
      <aside style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h3 style={styles.title}>
              Version History
            </h3>

            {!loading && (
              <span style={styles.count}>
                {versions.length}
              </span>
            )}
          </div>

          <p style={styles.subtitle}>
            Published workflow snapshots
          </p>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={styles.loading}>
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div style={styles.empty}>
              <div
                style={{
                  fontSize: "26px",
                  marginBottom: "10px",
                  opacity: 0.45
                }}
              >
                ◷
              </div>

              <div>
                No published versions yet.
              </div>

              <div
                style={{
                  marginTop: "5px",
                  color: "#596477"
                }}
              >
                Publish this workflow to create
                your first snapshot.
              </div>
            </div>
          ) : (
            versions.map((version) => {
              const isSelected =
                selectedVersion ===
                version.version;

              const isPublished =
                currentPublishedVersion ===
                version.version;

              const isRestoring =
                restoringVersion ===
                version.version;

              return (
                <div
                  key={version.version}
                  style={{
                    ...styles.versionCard,
                    ...(isSelected
                      ? styles.versionCardSelected
                      : {})
                  }}
                >
                  <div style={styles.versionHeader}>
                    <div style={styles.versionName}>
                      <span
                        style={
                          styles.versionNumber
                        }
                      >
                        v{version.version}
                      </span>

                      {isPublished && (
                        <span
                          style={
                            styles.publishedBadge
                          }
                        >
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={styles.date}>
                    {formatDate(
                      version.publishedAt ||
                        version.createdAt
                    )}
                  </div>

                  <div style={styles.stats}>
                    <span style={styles.stat}>
                      <span>□</span>
                      {version.nodes?.length ||
                        0}{" "}
                      nodes
                    </span>

                    <span style={styles.stat}>
                      <span>↗</span>
                      {version.edges?.length ||
                        0}{" "}
                      connections
                    </span>
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.viewButton}
                      onClick={() =>
                        handleView(
                          version.version
                        )
                      }
                    >
                      {isSelected
                        ? "Hide Details"
                        : "View"}
                    </button>

                    <button
                      type="button"
                      style={{
                        ...styles.restoreButton,
                        ...(isRestoring
                          ? styles.restoreButtonDisabled
                          : {})
                      }}
                      disabled={isRestoring}
                      onClick={() =>
                        setConfirmVersion(
                          version.version
                        )
                      }
                    >
                      {isRestoring
                        ? "Restoring..."
                        : "Restore"}
                    </button>
                  </div>

                  {isSelected && (
                    <div style={styles.details}>
                      <div
                        style={styles.detailsTitle}
                      >
                        Nodes in this version
                      </div>

                      {version.nodes?.length ? (
                        version.nodes.map(
                          (node) => (
                            <div
                              key={node.id}
                              style={styles.nodeRow}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems:
                                    "center",
                                  gap: "7px",
                                  minWidth: 0
                                }}
                              >
                                <span
                                  style={{
                                    fontSize:
                                      "13px",
                                    width:
                                      "20px",
                                    textAlign:
                                      "center"
                                  }}
                                >
                                  {getNodeIcon(
                                    node
                                  )}
                                </span>

                                <span
                                  style={
                                    styles.nodeType
                                  }
                                >
                                  {getNodeLabel(
                                    node
                                  )}
                                </span>
                              </div>

                              <span
                                style={
                                  styles.nodeId
                                }
                              >
                                {node.id}
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#687386"
                          }}
                        >
                          No nodes in this version.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {confirmVersion !== null && (
        <div
          style={styles.modalOverlay}
          onClick={() =>
            setConfirmVersion(null)
          }
        >
          <div
            style={styles.modal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3 style={styles.modalTitle}>
              Restore version {confirmVersion}?
            </h3>

            <p style={styles.modalText}>
              This will replace the current
              workflow canvas with the saved
              snapshot from version{" "}
              <strong
                style={{ color: "#e2e8f0" }}
              >
                {confirmVersion}
              </strong>
              .
            </p>

            <div style={styles.modalWarning}>
              The restored workflow will become a
              draft. Your currently published
              workflow will not remain published.
              You can review the restored canvas
              and publish it again afterward.
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() =>
                  setConfirmVersion(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.confirmButton}
                disabled={
                  restoringVersion !== null
                }
                onClick={handleRestore}
              >
                {restoringVersion !== null
                  ? "Restoring..."
                  : `Restore v${confirmVersion}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}