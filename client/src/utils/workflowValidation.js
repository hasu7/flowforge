const getNodeType = (node) => {
  return (
    node.data?.nodeType ||
    "trigger"
  );
};

export const validateWorkflow = (
  nodes,
  edges
) => {
  const errors = [];

  if (!nodes.length) {
    errors.push(
      "Workflow must contain at least one node."
    );

    return errors;
  }

  const nodeIds = new Set();

  for (const node of nodes) {
    if (!node.id) {
      errors.push(
        "Every node must have an ID."
      );

      continue;
    }

    if (nodeIds.has(node.id)) {
      errors.push(
        `Duplicate node ID: ${node.id}`
      );
    }

    nodeIds.add(node.id);
  }

  for (const edge of edges) {
    if (!edge.source || !edge.target) {
      errors.push(
        "Every connection must have a source and target."
      );

      continue;
    }

    if (!nodeIds.has(edge.source)) {
      errors.push(
        `Connection ${edge.id} points from a missing node.`
      );
    }

    if (!nodeIds.has(edge.target)) {
      errors.push(
        `Connection ${edge.id} points to a missing node.`
      );
    }

    if (edge.source === edge.target) {
      errors.push(
        `Node ${edge.source} cannot connect to itself.`
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
    errors.push(
      "Workflow must contain a trigger node."
    );
  }

  if (triggerNodes.length > 1) {
    errors.push(
      "Workflow can only contain one trigger node."
    );
  }

  const conditionNodes =
    nodes.filter(
      (node) =>
        getNodeType(node) ===
        "condition"
    );

  for (const conditionNode of conditionNodes) {
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
      errors.push(
        `Condition node ${conditionNode.id} needs exactly one true branch.`
      );
    }

    if (falseEdges.length !== 1) {
      errors.push(
        `Condition node ${conditionNode.id} needs exactly one false branch.`
      );
    }
  }

  for (const node of nodes) {
    const nodeType =
      getNodeType(node);

    if (
      nodeType === "condition"
    ) {
      continue;
    }

    const outgoingEdges =
      edges.filter(
        (edge) =>
          edge.source ===
          node.id
      );

    if (outgoingEdges.length > 1) {
      errors.push(
        `Node ${node.id} has multiple outgoing paths.`
      );
    }
  }

  return errors;
};