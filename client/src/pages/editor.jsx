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
  updateWorkflow
} from "../services/workflow.services.js";

import NodePalette from "../components/NodePalette.jsx";
import FlowNode from "../components/FlowNode.jsx";

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

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        const response =
          await getWorkflow(id);

        const loadedWorkflow =
          response.workflow;

        setWorkflow(loadedWorkflow);

        /*
         * Convert database nodes into
         * React Flow nodes.
         *
         * Database:
         * config.nodeType
         *
         * React Flow:
         * data.nodeType
         */

        const loadedNodes =
          (loadedWorkflow.nodes || []).map(
            (node) => ({
              id: node.id,

              type: "flowNode",

              position: {
                x: node.position?.x || 0,
                y: node.position?.y || 0
              },

              data: {
                nodeType:
                  node.config?.nodeType ||
                  "trigger"
              }
            })
          );

        setNodes(loadedNodes);

        const loadedEdges =
          (loadedWorkflow.edges || []).map(
            (edge) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,

              sourceHandle:
                edge.sourceHandle || undefined,

              targetHandle:
                edge.targetHandle || undefined
            })
          );

        setEdges(loadedEdges);
      } catch (error) {
        console.error(
          "Failed to load workflow:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load workflow."
        );
      } finally {
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [id, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(
          connection,
          currentEdges
        )
      );

      setSaveMessage("");
    },
    [setEdges]
  );

  const handleAddNode = useCallback(
    (type) => {
      const nodeId =
        `${type}-${Date.now()}`;

      const newNode = {
        id: nodeId,

        type: "flowNode",

        position: {
          x:
            250 +
            Math.random() * 200,

          y:
            100 +
            Math.random() * 300
        },

        data: {
          nodeType: type
        }
      };

      setNodes((currentNodes) => [
        ...currentNodes,
        newNode
      ]);

      setSaveMessage("");
    },
    [setNodes]
  );

  const handleSave = async () => {
    setSaving(true);

    setSaveMessage("");
    setError("");

    try {
      /*
       * Convert React Flow nodes
       * back into database format.
       */

      const nodesToSave =
        nodes.map((node) => ({
          id: node.id,

          type: node.type,

          position: {
            x: node.position.x,
            y: node.position.y
          },

          config: {
            nodeType:
              node.data?.nodeType ||
              "trigger"
          }
        }));

      /*
       * Save connections between nodes.
       */

      const edgesToSave =
        edges.map((edge) => ({
          id: edge.id,

          source: edge.source,

          target: edge.target,

          sourceHandle:
            edge.sourceHandle || null,

          targetHandle:
            edge.targetHandle || null
        }));

      await updateWorkflow(id, {
        nodes: nodesToSave,
        edges: edgesToSave
      });

      setSaveMessage(
        "Workflow saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save workflow:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save workflow."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p>
        Loading workflow...
      </p>
    );
  }

  if (error && !workflow) {
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
    <div className="editor-page">

      <div className="editor-toolbar">

        <div>
          <h2 className="editor-title">
            {workflow.name}
          </h2>

          <p className="editor-subtitle">
            {workflow.description ||
              "Build your automation visually."}
          </p>
        </div>

        <div className="editor-actions">

          {saveMessage && (
            <span className="save-message">
              {saveMessage}
            </span>
          )}

          {error && (
            <span className="save-error">
              {error}
            </span>
          )}

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Back
          </button>

          <button
            className="secondary-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save"}
          </button>

          <button
            className="primary-button"
          >
            Run Workflow
          </button>

        </div>
      </div>

      <div className="editor-workspace">

        <NodePalette
          onAddNode={handleAddNode}
        />

        <div className="editor-container">

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={
              onNodesChange
            }
            onEdgesChange={
              onEdgesChange
            }
            onConnect={onConnect}
            fitView
          >

            <Background />

            <Controls />

            <MiniMap />

          </ReactFlow>

        </div>
      </div>

    </div>
  );
}

export default Editor;