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

import {
  getWorkflow,
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

  const navigate =
    useNavigate();

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
    loadWorkflow();
  }, [
    loadWorkflow
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
      },
      [setNodes]
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
          event.key ===
            "Delete" ||
          event.key ===
            "Backspace"
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
        validationErrors.length >
        0
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
        setPublishing(
          false
        );
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
        validationErrors.length >
        0
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

  const handleWorkflowRestored =
    async (restoredWorkflow) => {
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
    };

  const selectedNode =
    nodes.find(
      (node) =>
        node.id ===
        selectedNodeId
    ) || null;

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
            }}
            fitView
          >
            <Background />

            <Controls />

            <MiniMap />
          </ReactFlow>
        </div>

        <NodeConfigPanel
          node={
            selectedNode
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
  );
}

export default Editor;