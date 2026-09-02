import Execution from "../models/Execution.js";

const getNodeType = (node) => {
  return node.config?.nodeType || node.type;
};

const getNodeMap = (nodes) => {
  return new Map(
    nodes.map((node) => [
      node.id,
      node
    ])
  );
};

const validateWorkflowGraph = (
  nodes,
  edges
) => {
  if (!nodes.length) {
    throw new Error(
      "Workflow must contain at least one node"
    );
  }

  const nodeIds = new Set();

  for (const node of nodes) {
    if (!node.id) {
      throw new Error(
        "Every workflow node must have an ID"
      );
    }

    if (nodeIds.has(node.id)) {
      throw new Error(
        `Duplicate node ID: ${node.id}`
      );
    }

    nodeIds.add(node.id);
  }

  const edgeIds = new Set();

  for (const edge of edges) {
    if (!edge.id) {
      throw new Error(
        "Every workflow connection must have an ID"
      );
    }

    if (edgeIds.has(edge.id)) {
      throw new Error(
        `Duplicate edge ID: ${edge.id}`
      );
    }

    edgeIds.add(edge.id);

    if (
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target)
    ) {
      throw new Error(
        `Connection ${edge.id} points to a missing node`
      );
    }

    if (
      edge.source === edge.target
    ) {
      throw new Error(
        `Node ${edge.source} cannot connect to itself`
      );
    }
  }

  const triggerNodes =
    nodes.filter(
      (node) =>
        getNodeType(node) ===
        "trigger"
    );

  if (triggerNodes.length === 0) {
    throw new Error(
      "Workflow must contain a trigger node"
    );
  }

  if (triggerNodes.length > 1) {
    throw new Error(
      "Workflow can only contain one trigger node"
    );
  }

  const conditionNodes =
    nodes.filter(
      (node) =>
        getNodeType(node) ===
        "condition"
    );

  for (
    const conditionNode of
      conditionNodes
  ) {
    const outgoingEdges =
      edges.filter(
        (edge) =>
          edge.source ===
          conditionNode.id
      );

    const trueEdges =
      outgoingEdges.filter(
        (edge) =>
          edge.sourceHandle ===
          "true"
      );

    const falseEdges =
      outgoingEdges.filter(
        (edge) =>
          edge.sourceHandle ===
          "false"
      );

    if (trueEdges.length !== 1) {
      throw new Error(
        `Condition node ${conditionNode.id} must have exactly one true branch`
      );
    }

    if (falseEdges.length !== 1) {
      throw new Error(
        `Condition node ${conditionNode.id} must have exactly one false branch`
      );
    }
  }

  const outgoingEdgeMap =
    new Map();

  for (const node of nodes) {
    outgoingEdgeMap.set(
      node.id,
      []
    );
  }

  for (const edge of edges) {
    const outgoing =
      outgoingEdgeMap.get(
        edge.source
      );

    outgoing.push(edge);
  }

  for (const node of nodes) {
    const nodeType =
      getNodeType(node);

    const outgoingEdges =
      outgoingEdgeMap.get(
        node.id
      );

    if (
      nodeType !== "condition" &&
      outgoingEdges.length > 1
    ) {
      throw new Error(
        `Node ${node.id} has multiple outgoing paths`
      );
    }
  }

  const triggerNode =
    triggerNodes[0];

  const reachableNodes =
    new Set();

  const queue = [
    triggerNode.id
  ];

  while (queue.length > 0) {
    const currentNodeId =
      queue.shift();

    if (
      reachableNodes.has(
        currentNodeId
      )
    ) {
      continue;
    }

    reachableNodes.add(
      currentNodeId
    );

    const outgoingEdges =
      outgoingEdgeMap.get(
        currentNodeId
      ) || [];

    for (
      const edge of
        outgoingEdges
    ) {
      queue.push(
        edge.target
      );
    }
  }

  for (const node of nodes) {
    if (
      !reachableNodes.has(
        node.id
      )
    ) {
      throw new Error(
        `Node ${node.id} is not reachable from the trigger`
      );
    }
  }

  const visiting =
    new Set();

  const visited =
    new Set();

  const detectCycle = (
    nodeId
  ) => {
    if (
      visiting.has(nodeId)
    ) {
      return true;
    }

    if (
      visited.has(nodeId)
    ) {
      return false;
    }

    visiting.add(nodeId);

    const outgoingEdges =
      outgoingEdgeMap.get(
        nodeId
      ) || [];

    for (
      const edge of
        outgoingEdges
    ) {
      if (
        detectCycle(
          edge.target
        )
      ) {
        return true;
      }
    }

    visiting.delete(
      nodeId
    );

    visited.add(
      nodeId
    );

    return false;
  };

  if (
    detectCycle(
      triggerNode.id
    )
  ) {
    throw new Error(
      "Workflow contains a cycle"
    );
  }
};

const getNextEdges = (
  currentNode,
  edges,
  branchHandle = null
) => {
  return edges.filter((edge) => {
    if (
      edge.source !==
      currentNode.id
    ) {
      return false;
    }

    if (
      branchHandle === null
    ) {
      return true;
    }

    return (
      edge.sourceHandle ===
      branchHandle
    );
  });
};

const getValueFromPath = (
  object,
  path
) => {
  if (!path) {
    return undefined;
  }

  return path
    .split(".")
    .reduce(
      (
        currentValue,
        key
      ) => {
        if (
          currentValue === null ||
          currentValue === undefined
        ) {
          return undefined;
        }

        return currentValue[key];
      },
      object
    );
};

const resolveTemplate = (
  value,
  input
) => {
  if (
    typeof value !==
    "string"
  ) {
    return value;
  }

  return value.replace(
    /\{\{\s*([^}]+?)\s*\}\}/g,
    (
      match,
      path
    ) => {
      const trimmedPath =
        path.trim();

      const resolvedValue =
        getValueFromPath(
          input,
          trimmedPath
        );

      if (
        resolvedValue ===
          undefined ||
        resolvedValue ===
          null
      ) {
        throw new Error(
          `Unable to resolve workflow variable: ${trimmedPath}`
        );
      }

      if (
        typeof resolvedValue ===
        "object"
      ) {
        return JSON.stringify(
          resolvedValue
        );
      }

      return String(
        resolvedValue
      );
    }
  );
};

const executeTriggerNode = async (
  node
) => {
  return {
    triggered: true,

    triggerType:
      node.config?.triggerType ||
      "manual",

    timestamp:
      new Date().toISOString()
  };
};

const executeHttpNode = async (
  node,
  input
) => {
  const method =
    node.config?.method ||
    "GET";

  const configuredUrl =
    node.config?.url;

  if (!configuredUrl) {
    throw new Error(
      "HTTP Request node requires a URL"
    );
  }

  const url =
    resolveTemplate(
      configuredUrl,
      input
    );

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(
      "HTTP Request node contains an invalid URL"
    );
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "HTTP Request URL must use http or https"
    );
  }

  const requestOptions = {
    method
  };

  if (
    method !== "GET" &&
    method !== "HEAD"
  ) {
    requestOptions.headers = {
      "Content-Type":
        "application/json"
    };

    requestOptions.body =
      JSON.stringify(
        input ?? {}
      );
  }

  const response =
    await fetch(
      parsedUrl,
      requestOptions
    );

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let responseData;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    responseData =
      await response.json();
  } else {
    responseData =
      await response.text();
  }

  if (!response.ok) {
    throw new Error(
      `HTTP request failed with status ${response.status}`
    );
  }

  return {
    status: response.status,

    statusText:
      response.statusText,

    data: responseData
  };
};

const compareValues = (
  actual,
  expected,
  operator
) => {
  switch (operator) {
    case "equals":
      return (
        String(actual) ===
        String(expected)
      );

    case "not_equals":
      return (
        String(actual) !==
        String(expected)
      );

    case "contains":
      return String(actual).includes(
        String(expected)
      );

    case "greater_than":
      return (
        Number(actual) >
        Number(expected)
      );

    case "less_than":
      return (
        Number(actual) <
        Number(expected)
      );

    default:
      throw new Error(
        `Unsupported condition operator: ${operator}`
      );
  }
};

const executeConditionNode = async (
  node,
  input
) => {
  const configuredField =
    node.config?.field;

  const operator =
    node.config?.operator ||
    "equals";

  const configuredValue =
    node.config?.value;

  if (!configuredField) {
    throw new Error(
      "Condition node requires a field"
    );
  }

  if (
    configuredValue ===
      undefined ||
    configuredValue === null
  ) {
    throw new Error(
      "Condition node requires a value"
    );
  }

  const field =
    resolveTemplate(
      configuredField,
      input
    );

  const expectedValue =
    resolveTemplate(
      String(
        configuredValue
      ),
      input
    );

  const actualValue =
    getValueFromPath(
      input,
      field
    );

  const result =
    compareValues(
      actualValue,
      expectedValue,
      operator
    );

  return {
    field,

    actualValue,

    operator,

    expectedValue,

    result
  };
};

const executeNode = async (
  node,
  input
) => {
  const nodeType =
    getNodeType(node);

  if (
    nodeType === "trigger"
  ) {
    return executeTriggerNode(
      node
    );
  }

  if (
    nodeType === "http"
  ) {
    return executeHttpNode(
      node,
      input
    );
  }

  if (
    nodeType === "condition"
  ) {
    return executeConditionNode(
      node,
      input
    );
  }

  throw new Error(
    `Unsupported node type: ${nodeType}`
  );
};

const markNodeSkipped = (
  execution,
  nodeId
) => {
  const executionNode =
    execution.nodes.find(
      (node) =>
        node.nodeId ===
        nodeId
    );

  if (
    executionNode &&
    executionNode.status ===
      "pending"
  ) {
    executionNode.status =
      "skipped";
  }
};

export const executeWorkflow =
  async ({
    workflow,
    userId
  }) => {
    const startedAt =
      new Date();

    const nodes =
      workflow.nodes || [];

    const edges =
      workflow.edges || [];

    validateWorkflowGraph(
      nodes,
      edges
    );

    const nodeMap =
      getNodeMap(nodes);

    const executionNodes =
      nodes.map((node) => ({
        nodeId: node.id,

        nodeType:
          getNodeType(node),

        status: "pending"
      }));

    const execution =
      await Execution.create({
        workflow:
          workflow._id,

        user: userId,

        status: "running",

        trigger: "manual",

        startedAt,

        nodes: executionNodes
      });

    try {
      const triggerNode =
        nodes.find(
          (node) =>
            getNodeType(node) ===
            "trigger"
        );

      let currentNode =
        triggerNode;

      let currentInput =
        null;

      const visitedNodes =
        new Set();

      while (currentNode) {
        if (
          visitedNodes.has(
            currentNode.id
          )
        ) {
          throw new Error(
            "Workflow contains a cycle"
          );
        }

        visitedNodes.add(
          currentNode.id
        );

        const executionNode =
          execution.nodes.find(
            (node) =>
              node.nodeId ===
              currentNode.id
          );

        const nodeStartedAt =
          new Date();

        executionNode.status =
          "running";

        executionNode.startedAt =
          nodeStartedAt;

        executionNode.input =
          currentInput;

        await execution.save();

        let output;

        try {
          output =
            await executeNode(
              currentNode,
              currentInput
            );
        } catch (
          nodeError
        ) {
          const nodeFinishedAt =
            new Date();

          executionNode.status =
            "failed";

          executionNode.finishedAt =
            nodeFinishedAt;

          executionNode.error =
            nodeError.message;

          execution.status =
            "failed";

          execution.finishedAt =
            nodeFinishedAt;

          execution.durationMs =
            nodeFinishedAt.getTime() -
            startedAt.getTime();

          execution.error =
            nodeError.message;

          await execution.save();

          return execution;
        }

        const nodeFinishedAt =
          new Date();

        executionNode.status =
          "success";

        executionNode.finishedAt =
          nodeFinishedAt;

        executionNode.output =
          output;

        await execution.save();

        currentInput =
          output;

        const nodeType =
          getNodeType(
            currentNode
          );

        let nextEdges;

        if (
          nodeType ===
          "condition"
        ) {
          const branch =
            output.result
              ? "true"
              : "false";

          const allOutgoingEdges =
            getNextEdges(
              currentNode,
              edges
            );

          const selectedEdges =
            getNextEdges(
              currentNode,
              edges,
              branch
            );

          for (
            const edge of
              allOutgoingEdges
          ) {
            if (
              edge.sourceHandle !==
              branch
            ) {
              markNodeSkipped(
                execution,
                edge.target
              );
            }
          }

          nextEdges =
            selectedEdges;
        } else {
          nextEdges =
            getNextEdges(
              currentNode,
              edges
            );
        }

        if (
          nextEdges.length === 0
        ) {
          currentNode =
            null;

          continue;
        }

        if (
          nextEdges.length > 1
        ) {
          throw new Error(
            `Node ${currentNode.id} has multiple outgoing paths`
          );
        }

        currentNode =
          nodeMap.get(
            nextEdges[0].target
          );

        if (!currentNode) {
          throw new Error(
            "Workflow points to a missing node"
          );
        }
      }

      const finishedAt =
        new Date();

      execution.status =
        "success";

      execution.finishedAt =
        finishedAt;

      execution.durationMs =
        finishedAt.getTime() -
        startedAt.getTime();

      await execution.save();

      return execution;
    } catch (error) {
      const finishedAt =
        new Date();

      execution.status =
        "failed";

      execution.finishedAt =
        finishedAt;

      execution.durationMs =
        finishedAt.getTime() -
        startedAt.getTime();

      execution.error =
        error.message;

      await execution.save();

      throw error;
    }
  };