import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import api from "../services/api.js";

import {
  getWorkflow,
  getScheduleStatus,
  updateWorkflow,
  publishWorkflow
} from "../services/workflow.services.js";

import {
  runWorkflow
} from "../services/execution.service.js";

import {
  validateWorkflow
} from "../utils/workflowValidation.js";

import NodePalette from "../components/NodePalette.jsx";
import FlowNode from "../components/FlowNode.jsx";
import NodeConfigPanel from "../components/NodeConfigPanel.jsx";
import VersionHistory from "../components/VersionHistory.jsx";

const nodeTypes = {
  flowNode: FlowNode
};

function Editor() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [workflow, setWorkflow] =
    useState(null);

  const [nodes, setNodes, onNodesChange] =
    useNodesState([]);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState([]);

  const [selectedNodeId, setSelectedNodeId] =
    useState(null);

  const [selectedEdgeId, setSelectedEdgeId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [running, setRunning] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [publishMessage, setPublishMessage] =
    useState("");

  const [runMessage, setRunMessage] =
    useState("");

  const [scheduleStatus, setScheduleStatus] =
    useState({
      active: false,
      nextRun: null
    });

  const [scheduleStatusLoading, setScheduleStatusLoading] =
    useState(false);

  const [webhookTestSecret, setWebhookTestSecret] =
    useState("");

  const [webhookTestBody, setWebhookTestBody] =
    useState(
      JSON.stringify(
        {
          message:
            "hello FlowForge"
        },
        null,
        2
      )
    );

  const [webhookTesting, setWebhookTesting] =
    useState(false);

  const [webhookTestResponse, setWebhookTestResponse] =
    useState(null);

  const [webhookTestError, setWebhookTestError] =
    useState("");

  const loadScheduleStatus =
    useCallback(
      async () => {
        try {
          setScheduleStatusLoading(true);

          const response =
            await getScheduleStatus(id);

          setScheduleStatus({
            active:
              response.schedule?.active === true,

            nextRun:
              response.schedule?.nextRun ||
              null
          });
        } catch (error) {
          console.error(
            "Failed to load schedule status:",
            error
          );

          setScheduleStatus({
            active: false,
            nextRun: null
          });
        } finally {
          setScheduleStatusLoading(false);
        }
      },
      [id]
    );

  const loadWorkflow =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getWorkflow(id);

          const loadedWorkflow =
            response.workflow;

          setWorkflow(
            loadedWorkflow
          );

          const loadedNodes =
            (
              loadedWorkflow.nodes ||
              []
            ).map(
              (node) => ({
                id:
                  node.id,

                type:
                  "flowNode",

                position: {
                  x:
                    node.position?.x ||
                    0,

                  y:
                    node.position?.y ||
                    0
                },

                data: {
                  nodeType:
                    node.config?.nodeType ||
                    "trigger",

                  config: {
                    ...(node.config || {})
                  }
                }
              })
            );

          setNodes(
            loadedNodes
          );

          const loadedEdges =
            (
              loadedWorkflow.edges ||
              []
            ).map(
              (edge) => ({
                id:
                  edge.id,

                source:
                  edge.source,

                target:
                  edge.target,

                sourceHandle:
                  edge.sourceHandle ||
                  undefined,

                targetHandle:
                  edge.targetHandle ||
                  undefined
              })
            );

          setEdges(
            loadedEdges
          );

          setSelectedNodeId(
            null
          );

          setSelectedEdgeId(
            null
          );

          setWebhookTestResponse(
            null
          );

          setWebhookTestError(
            ""
          );
        } catch (error) {
          console.error(
            "Failed to load workflow:",
            error
          );

          setError(
            error.response?.data
              ?.message ||
            "Failed to load workflow."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        id,
        setNodes,
        setEdges
      ]
    );

  useEffect(() => {
    let cancelled = false;

    const runLoadWorkflow =
      async () => {
        if (cancelled) {
          return;
        }

        await loadWorkflow();
      };

    void runLoadWorkflow();

    return () => {
      cancelled = true;
    };
  }, [
    loadWorkflow
  ]);

  useEffect(() => {
    let cancelled = false;

    const fetchScheduleStatus =
      async () => {
        if (cancelled) {
          return;
        }

        await loadScheduleStatus();
      };

    fetchScheduleStatus();

    const interval =
      setInterval(
        () => {
          fetchScheduleStatus();
        },
        10000
      );

    return () => {
      cancelled = true;

      clearInterval(
        interval
      );
    };
  }, [
    loadScheduleStatus
  ]);

  const onConnect =
    useCallback(
      (connection) => {
        setEdges(
          (currentEdges) =>
            addEdge(
              connection,
              currentEdges
            )
        );

        setSaveMessage("");
        setPublishMessage("");
        setRunMessage("");
        setError("");
      },
      [setEdges]
    );

  const handleAddNode =
    useCallback(
      (type) => {
        const nodeId =
          `${type}-${Date.now()}`;

        const newNode = {
          id:
            nodeId,

          type:
            "flowNode",

          position: {
            x:
              250 +
              Math.random() *
              200,

            y:
              100 +
              Math.random() *
              300
          },

          data: {
            nodeType:
              type,

            config: {}
          }
        };

        setNodes(
          (currentNodes) => [
            ...currentNodes,
            newNode
          ]
        );

        setSelectedNodeId(
          nodeId
        );

        setSelectedEdgeId(
          null
        );

        setSaveMessage("");
        setPublishMessage("");
        setRunMessage("");
        setError("");
      },
      [setNodes]
    );

  const handleNodeUpdate =
    useCallback(
      (
        nodeId,
        updatedConfig
      ) => {
        setNodes(
          (currentNodes) =>
            currentNodes.map(
              (currentNode) => {
                if (
                  currentNode.id !==
                  nodeId
                ) {
                  return currentNode;
                }

                return {
                  ...currentNode,

                  data: {
                    ...currentNode.data,

                    config: {
                      ...updatedConfig
                    }
                  }
                };
              }
            )
        );

        setSaveMessage("");
        setPublishMessage("");
        setRunMessage("");
        setError("");

        if (
          nodeId ===
          selectedNodeId
        ) {
          setWebhookTestResponse(
            null
          );

          setWebhookTestError(
            ""
          );
        }
      },
      [
        setNodes,
        selectedNodeId
      ]
    );

  const handleDeleteSelected =
    useCallback(
      () => {
        if (
          selectedNodeId
        ) {
          setNodes(
            (currentNodes) =>
              currentNodes.filter(
                (node) =>
                  node.id !==
                  selectedNodeId
              )
          );

          setEdges(
            (currentEdges) =>
              currentEdges.filter(
                (edge) =>
                  edge.source !==
                    selectedNodeId &&
                  edge.target !==
                    selectedNodeId
              )
          );

          setSelectedNodeId(
            null
          );

          setSaveMessage("");
          setPublishMessage("");
          setRunMessage("");
          setError("");

          setWebhookTestResponse(
            null
          );

          setWebhookTestError(
            ""
          );

          return;
        }

        if (
          selectedEdgeId
        ) {
          setEdges(
            (currentEdges) =>
              currentEdges.filter(
                (edge) =>
                  edge.id !==
                  selectedEdgeId
              )
          );

          setSelectedEdgeId(
            null
          );

          setSaveMessage("");
          setPublishMessage("");
          setRunMessage("");
          setError("");
        }
      },
      [
        selectedNodeId,
        selectedEdgeId,
        setNodes,
        setEdges
      ]
    );

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        const target =
          event.target;

        const isTyping =
          target instanceof
            HTMLInputElement ||
          target instanceof
            HTMLTextAreaElement ||
          target instanceof
            HTMLSelectElement ||
          target.isContentEditable;

        if (isTyping) {
          return;
        }

        if (
          event.key === "Delete" ||
          event.key === "Backspace"
        ) {
          event.preventDefault();

          handleDeleteSelected();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    handleDeleteSelected
  ]);

  const buildWorkflowPayload =
    useCallback(
      () => {
        const nodesToSave =
          nodes.map(
            (node) => ({
              id:
                node.id,

              type:
                node.type,

              position: {
                x:
                  node.position.x,

                y:
                  node.position.y
              },

              config: {
                nodeType:
                  node.data
                    ?.nodeType ||
                  "trigger",

                ...(node.data
                  ?.config || {})
              }
            })
          );

        const edgesToSave =
          edges.map(
            (edge) => ({
              id:
                edge.id,

              source:
                edge.source,

              target:
                edge.target,

              sourceHandle:
                edge.sourceHandle ||
                null,

              targetHandle:
                edge.targetHandle ||
                null
            })
          );

        return {
          nodes:
            nodesToSave,

          edges:
            edgesToSave
        };
      },
      [
        nodes,
        edges
      ]
    );

  const handleSave =
    async () => {
      setSaving(true);

      setSaveMessage("");
      setPublishMessage("");
      setRunMessage("");
      setError("");

      try {
        const workflowPayload =
          buildWorkflowPayload();

        const response =
          await updateWorkflow(
            id,
            workflowPayload
          );

        setWorkflow(
          response.workflow
        );

        setSaveMessage(
          "Workflow saved successfully."
        );
      } catch (error) {
        console.error(
          "Failed to save workflow:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
          "Failed to save workflow."
        );
      } finally {
        setSaving(false);
      }
    };

  const handlePublish =
    async () => {
      setPublishing(true);

      setPublishMessage("");
      setSaveMessage("");
      setRunMessage("");
      setError("");

      const validationErrors =
        validateWorkflow(
          nodes,
          edges
        );

      if (
        validationErrors.length > 0
      ) {
        setError(
          validationErrors.join(
            " "
          )
        );

        setPublishing(false);

        return;
      }

      try {
        const workflowPayload =
          buildWorkflowPayload();

        const saveResponse =
          await updateWorkflow(
            id,
            workflowPayload
          );

        setWorkflow(
          saveResponse.workflow
        );

        const response =
          await publishWorkflow(
            id
          );

        setWorkflow(
          response.workflow
        );

        setPublishMessage(
          response.message ||
          "Workflow published successfully."
        );

        await loadScheduleStatus();
      } catch (error) {
        console.error(
          "Failed to publish workflow:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
          "Failed to publish workflow."
        );
      } finally {
        setPublishing(false);
      }
    };

  const handleRunWorkflow =
    async () => {
      setRunning(true);

      setRunMessage("");
      setSaveMessage("");
      setPublishMessage("");
      setError("");

      const validationErrors =
        validateWorkflow(
          nodes,
          edges
        );

      if (
        validationErrors.length > 0
      ) {
        setError(
          validationErrors.join(
            " "
          )
        );

        setRunning(false);

        return;
      }

      try {
        const workflowPayload =
          buildWorkflowPayload();

        const saveResponse =
          await updateWorkflow(
            id,
            workflowPayload
          );

        setWorkflow(
          saveResponse.workflow
        );

        const response =
          await runWorkflow(id);

        const execution =
          response.execution;

        if (!execution) {
          throw new Error(
            "Execution response was empty."
          );
        }

        setRunMessage(
          `Workflow ${execution.status}.`
        );

        navigate(
          `/dashboard/executions/${execution.id}`
        );
      } catch (error) {
        console.error(
          "Failed to run workflow:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
          error.message ||
          "Failed to run workflow."
        );
      } finally {
        setRunning(false);
      }
    };

  const handleWebhookTest =
    async () => {
      setWebhookTesting(true);

      setWebhookTestResponse(
        null
      );

      setWebhookTestError(
        ""
      );

      try {
        if (
          !selectedNode ||
          selectedNode.data?.nodeType !==
            "trigger" ||
          selectedNode.data?.config
            ?.triggerType !==
            "webhook"
        ) {
          throw new Error(
            "Select a webhook trigger first."
          );
        }

        const config =
          selectedNode.data
            ?.config || {};

        const webhookPath =
          typeof config.webhookPath ===
            "string"
            ? config.webhookPath
                .trim()
                .replace(/^\/+/, "")
                .replace(/\/+$/, "")
            : "";

        if (!webhookPath) {
          throw new Error(
            "Webhook path is required."
          );
        }

        const webhookMethod =
          (
            config.webhookMethod ||
            "POST"
          ).toUpperCase();

        const baseUrl =
          api.defaults.baseURL
            ? api.defaults.baseURL.replace(
                /\/$/,
                ""
              )
            : "";

        const webhookUrl =
          `${baseUrl}/webhooks/${webhookPath}`;

        let parsedBody = {};

        if (
          webhookTestBody.trim()
        ) {
          try {
            parsedBody =
              JSON.parse(
                webhookTestBody
              );
          } catch {
            throw new Error(
              "Request body must contain valid JSON."
            );
          }
        }

        const headers = {};

        if (
          webhookMethod !== "GET"
        ) {
          headers[
            "Content-Type"
          ] =
            "application/json";
        }

        const secret =
          webhookTestSecret ||
          config.webhookSecret ||
          "";

        if (secret) {
          headers[
            "x-webhook-secret"
          ] = secret;
        }

        const requestOptions = {
          method:
            webhookMethod,

          headers
        };

        if (
          webhookMethod !== "GET"
        ) {
          requestOptions.body =
            JSON.stringify(
              parsedBody
            );
        }

        const response =
          await fetch(
            webhookUrl,
            requestOptions
          );

        const responseText =
          await response.text();

        let responseData =
          responseText;

        try {
          responseData =
            responseText
              ? JSON.parse(
                  responseText
                )
              : null;
        } catch {
          responseData =
            responseText;
        }

        setWebhookTestResponse({
          status:
            response.status,

          statusText:
            response.statusText,

          ok:
            response.ok,

          data:
            responseData
        });

        if (!response.ok) {
          throw new Error(
            `Webhook returned ${response.status} ${response.statusText}.`
          );
        }
      } catch (error) {
        console.error(
          "Webhook test failed:",
          error
        );

        setWebhookTestError(
          error.message ||
          "Webhook test failed."
        );
      } finally {
        setWebhookTesting(false);
      }
    };

  const handleWorkflowRestored =
    async (
      restoredWorkflow
    ) => {
      setWorkflow(
        restoredWorkflow
      );

      setSaveMessage("");
      setPublishMessage("");
      setRunMessage("");

      setError(
        "Workflow restored as a draft. Review it before publishing."
      );

      await loadWorkflow();
      await loadScheduleStatus();
    };

  const selectedNode =
    nodes.find(
      (node) =>
        node.id ===
        selectedNodeId
    ) || null;

  const selectedNodeIsWebhook =
    selectedNode?.data?.nodeType ===
      "trigger" &&
    selectedNode?.data?.config
      ?.triggerType ===
      "webhook";

  const normalizedWebhookPath =
    selectedNodeIsWebhook &&
    typeof selectedNode.data
      ?.config?.webhookPath ===
      "string"
      ? selectedNode.data.config
          .webhookPath
          .trim()
          .replace(/^\/+/, "")
          .replace(/\/+$/, "")
      : "";

  const webhookBaseUrl =
    api.defaults.baseURL
      ? api.defaults.baseURL.replace(
          /\/$/,
          ""
        )
      : "";

  const selectedWebhookUrl =
    normalizedWebhookPath
      ? `${webhookBaseUrl}/webhooks/${normalizedWebhookPath}`
      : "";

  if (loading) {
    return (
      <p>
        Loading workflow...
      </p>
    );
  }

  if (
    error &&
    !workflow
  ) {
    return (
      <p>
        {error}
      </p>
    );
  }

  if (!workflow) {
    return (
      <p>
        Workflow not found.
      </p>
    );
  }

  return (
    <div
      className="editor-page"
      style={{
        minHeight:
          "100vh"
      }}
    >
      <div className="editor-toolbar">

        <div>
          <h2 className="editor-title">
            {workflow.name}
          </h2>

          <p className="editor-subtitle">
            {workflow.description ||
              "Build your automation visually."}
          </p>

          <div className="workflow-version-info">

            <span>
              Draft revision:{" "}
              {workflow.version}
            </span>

            <span>
              Published:{" "}
              {workflow.publishedVersion
                ? `v${workflow.publishedVersion}`
                : "Not published"}
            </span>

          </div>
        </div>

        <div className="editor-actions">

          {saveMessage && (
            <span className="save-message">
              {saveMessage}
            </span>
          )}

          {publishMessage && (
            <span className="save-message">
              {publishMessage}
            </span>
          )}

          {runMessage && (
            <span className="save-message">
              {runMessage}
            </span>
          )}

          {error && (
            <span className="save-error">
              {error}
            </span>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            Back
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={
              handleSave
            }
            disabled={
              saving ||
              running ||
              publishing
            }
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={
              handlePublish
            }
            disabled={
              saving ||
              running ||
              publishing
            }
          >
            {publishing
              ? "Publishing..."
              : "Publish"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={
              handleRunWorkflow
            }
            disabled={
              running ||
              saving ||
              publishing
            }
          >
            {running
              ? "Saving & Running..."
              : "Run Workflow"}
          </button>

        </div>
      </div>

      <div
        className="editor-workspace"
        style={{
          display:
            "flex"
        }}
      >

        <NodePalette
          onAddNode={
            handleAddNode
          }
        />

        <div
          className="editor-container"
          style={{
            flex: 1
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={
              nodeTypes
            }
            onNodesChange={
              onNodesChange
            }
            onEdgesChange={
              onEdgesChange
            }
            onConnect={
              onConnect
            }
            onNodeClick={(
              event,
              node
            ) => {
              setSelectedNodeId(
                node.id
              );

              setSelectedEdgeId(
                null
              );
            }}
            onEdgeClick={(
              event,
              edge
            ) => {
              setSelectedEdgeId(
                edge.id
              );

              setSelectedNodeId(
                null
              );
            }}
            onPaneClick={() => {
              setSelectedNodeId(
                null
              );

              setSelectedEdgeId(
                null
              );

              setWebhookTestResponse(
                null
              );

              setWebhookTestError(
                ""
              );
            }}
            fitView
          >
            <Background />

            <Controls />

            <MiniMap />
          </ReactFlow>
        </div>

        <div
          style={{
            width: "360px",
            minWidth: "360px",
            maxHeight: "100vh",
            overflowY: "auto"
          }}
        >
          <NodeConfigPanel
            key={
              selectedNode?.id ||
              "empty"
            }
            node={
              selectedNode
            }
            scheduleStatus={
              scheduleStatus
            }
            scheduleStatusLoading={
              scheduleStatusLoading
            }
            onUpdate={(
              updatedConfig
            ) => {
              if (
                !selectedNodeId
              ) {
                return;
              }

              handleNodeUpdate(
                selectedNodeId,
                updatedConfig
              );
            }}
            onClose={() => {
              setSelectedNodeId(
                null
              );
            }}
          />

          {selectedNodeIsWebhook && (
            <div
              className="node-config-panel"
              style={{
                marginTop: "12px"
              }}
            >
              <div className="node-config-header">
                <div>
                  <p className="node-config-label">
                    Testing
                  </p>

                  <h3>
                    Test Webhook
                  </h3>
                </div>
              </div>

              <div className="node-config-section">

                <div className="config-field">
                  <label>
                    Endpoint
                  </label>

                  <input
                    type="text"
                    value={
                      selectedWebhookUrl ||
                      "Configure a webhook path first."
                    }
                    readOnly
                  />
                </div>

                <div className="config-field">
                  <label>
                    Method
                  </label>

                  <input
                    type="text"
                    value={
                      (
                        selectedNode.data
                          ?.config
                          ?.webhookMethod ||
                        "POST"
                      ).toUpperCase()
                    }
                    readOnly
                  />
                </div>

                <div className="config-field">
                  <label htmlFor="webhook-test-secret">
                    Secret
                  </label>

                  <input
                    id="webhook-test-secret"
                    type="password"
                    value={
                      webhookTestSecret
                    }
                    onChange={(event) =>
                      setWebhookTestSecret(
                        event.target.value
                      )
                    }
                    placeholder={
                      selectedNode.data
                        ?.config
                        ?.webhookSecret
                        ? "Uses configured secret if empty"
                        : "Optional secret"
                    }
                    autoComplete="off"
                  />

                  <small className="config-help">
                    Leave empty to use the
                    secret configured on the
                    trigger.
                  </small>
                </div>

                <div className="config-field">
                  <label htmlFor="webhook-test-body">
                    JSON body
                  </label>

                  <textarea
                    id="webhook-test-body"
                    value={
                      webhookTestBody
                    }
                    onChange={(event) =>
                      setWebhookTestBody(
                        event.target.value
                      )
                    }
                    rows="10"
                  />

                  <small className="config-help">
                    This body will be sent to
                    the webhook trigger.
                  </small>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    handleWebhookTest
                  }
                  disabled={
                    webhookTesting ||
                    !selectedWebhookUrl
                  }
                  style={{
                    width: "100%"
                  }}
                >
                  {webhookTesting
                    ? "Sending..."
                    : "Send Test Request"}
                </button>

                {webhookTestError && (
                  <div
                    className="save-error"
                    style={{
                      marginTop: "12px"
                    }}
                  >
                    {webhookTestError}
                  </div>
                )}

                {webhookTestResponse && (
                  <div
                    style={{
                      marginTop: "16px"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom: "8px"
                      }}
                    >
                      <strong>
                        Response
                      </strong>

                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            webhookTestResponse.ok
                              ? "#4ade80"
                              : "#ef7d84"
                        }}
                      >
                        {
                          webhookTestResponse.status
                        }{" "}
                        {
                          webhookTestResponse.statusText
                        }
                      </span>
                    </div>

                    <pre
                      style={{
                        margin: 0,
                        padding: "12px",
                        borderRadius:
                          "8px",
                        background:
                          "#151922",
                        overflowX:
                          "auto",
                        fontSize:
                          "12px",
                        lineHeight:
                          "1.5",
                        whiteSpace:
                          "pre-wrap",
                        wordBreak:
                          "break-word"
                      }}
                    >
                      {typeof webhookTestResponse.data ===
                      "string"
                        ? webhookTestResponse.data
                        : JSON.stringify(
                            webhookTestResponse.data,
                            null,
                            2
                          )}
                    </pre>
                  </div>
                )}

              </div>
            </div>
          )}

          <VersionHistory
            workflowId={
              id
            }
            currentPublishedVersion={
              workflow.publishedVersion
            }
            onRestored={
              handleWorkflowRestored
            }
          />
        </div>

      </div>
    </div>
  );
}

export default Editor;