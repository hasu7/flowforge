import Execution from "../models/Execution.js";

const getNodeType = (node) => {
  return (
    node.config?.nodeType ||
    node.type ||
    "trigger"
  );
};

const getValueFromPath = (
  input,
  path
) => {
  if (!path) {
    return undefined;
  }

  const parts =
    path.split(".").filter(Boolean);

  let current = input;

  /*
   * "data" is the public workflow variable
   * that represents the current node input.
   *
   * Example:
   *
   * {{data.body.userId}}
   *
   * resolves to:
   *
   * input.body.userId
   */
  if (parts[0] === "data") {
    parts.shift();
  }

  for (const part of parts) {
    if (
      current === null ||
      current === undefined
    ) {
      return undefined;
    }

    if (
      typeof current !== "object"
    ) {
      return undefined;
    }

    current = current[part];
  }

  return current;
};

const resolveTemplate = (
  template,
  input
) => {
  if (
    typeof template !== "string"
  ) {
    return template;
  }

  const fullTemplateMatch =
    template.match(
      /^{{\s*([^}]+)\s*}}$/
    );

  if (fullTemplateMatch) {
    const path =
      fullTemplateMatch[1].trim();

    const value =
      getValueFromPath(
        input,
        path
      );

    if (
      value === undefined
    ) {
      throw new Error(
        `Unable to resolve workflow variable: ${path}`
      );
    }

    return value;
  }

  return template.replace(
    /{{\s*([^}]+)\s*}}/g,
    (match, path) => {
      const value =
        getValueFromPath(
          input,
          path.trim()
        );

      if (
        value === undefined
      ) {
        throw new Error(
          `Unable to resolve workflow variable: ${path.trim()}`
        );
      }

      if (
        value === null
      ) {
        return "";
      }

      if (
        typeof value === "object"
      ) {
        return JSON.stringify(
          value
        );
      }

      return String(value);
    }
  );
};

const resolveJsonValue = (
  value,
  input
) => {
  if (
    typeof value === "string"
  ) {
    const fullTemplateMatch =
      value.match(
        /^{{\s*([^}]+)\s*}}$/
      );

    if (fullTemplateMatch) {
      const path =
        fullTemplateMatch[1].trim();

      const resolved =
        getValueFromPath(
          input,
          path
        );

      if (
        resolved === undefined
      ) {
        throw new Error(
          `Unable to resolve workflow variable: ${path}`
        );
      }

      return resolved;
    }

    return resolveTemplate(
      value,
      input
    );
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      (item) =>
        resolveJsonValue(
          item,
          input
        )
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const result = {};

    for (const [
      key,
      nestedValue
    ] of Object.entries(value)) {
      result[key] =
        resolveJsonValue(
          nestedValue,
          input
        );
    }

    return result;
  }

  return value;
};

const resolveJsonBody = (
  body,
  input
) => {
  if (
    body === undefined ||
    body === null ||
    body === ""
  ) {
    return undefined;
  }

  let parsedBody;

  try {
    parsedBody =
      typeof body === "string"
        ? JSON.parse(body)
        : body;
  } catch {
    throw new Error(
      "HTTP request body must contain valid JSON."
    );
  }

  return resolveJsonValue(
    parsedBody,
    input
  );
};

const resolveHeaders = (
  headers,
  input
) => {
  if (
    headers === undefined ||
    headers === null ||
    headers === ""
  ) {
    return {};
  }

  let parsedHeaders;

  try {
    parsedHeaders =
      typeof headers === "string"
        ? JSON.parse(headers)
        : headers;
  } catch {
    throw new Error(
      "HTTP headers must contain valid JSON."
    );
  }

  if (
    typeof parsedHeaders !==
      "object" ||
    Array.isArray(parsedHeaders)
  ) {
    throw new Error(
      "HTTP headers must be a JSON object."
    );
  }

  const resolvedHeaders = {};

  for (const [
    key,
    value
  ] of Object.entries(
    parsedHeaders
  )) {
    const resolvedValue =
      resolveTemplate(
        String(value),
        input
      );

    resolvedHeaders[key] =
      String(resolvedValue);
  }

  return resolvedHeaders;
};

export const validateWorkflowGraph = (
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

  const nodeMap = new Map();

  for (const node of nodes) {
    if (!node.id) {
      errors.push(
        "Every node must have an ID."
      );

      continue;
    }

    if (nodeMap.has(node.id)) {
      errors.push(
        `Duplicate node ID: ${node.id}`
      );
    }

    nodeMap.set(
      node.id,
      node
    );
  }

  const edgeIds = new Set();

  for (const edge of edges) {
    if (!edge.id) {
      errors.push(
        "Every connection must have an ID."
      );
    } else if (
      edgeIds.has(edge.id)
    ) {
      errors.push(
        `Duplicate edge ID: ${edge.id}`
      );
    }

    edgeIds.add(edge.id);

    if (!edge.source || !edge.target) {
      errors.push(
        "Every connection must have a source and target."
      );

      continue;
    }

    if (
      !nodeMap.has(edge.source)
    ) {
      errors.push(
        `Connection ${edge.id} points from a missing node.`
      );
    }

    if (
      !nodeMap.has(edge.target)
    ) {
      errors.push(
        `Connection ${edge.id} points to a missing node.`
      );
    }

    if (
      edge.source === edge.target
    ) {
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

  if (
    triggerNodes.length === 0
  ) {
    errors.push(
      "Workflow must contain a trigger node."
    );
  }

  if (
    triggerNodes.length > 1
  ) {
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

    if (
      trueEdges.length !== 1
    ) {
      errors.push(
        `Condition node ${conditionNode.id} needs exactly one true branch.`
      );
    }

    if (
      falseEdges.length !== 1
    ) {
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

    if (
      outgoingEdges.length > 1
    ) {
      errors.push(
        `Node ${node.id} has multiple outgoing paths.`
      );
    }
  }

  if (
    triggerNodes.length === 1
  ) {
    const reachable =
      new Set();

    const queue = [
      triggerNodes[0].id
    ];

    while (queue.length) {
      const currentId =
        queue.shift();

      if (
        reachable.has(
          currentId
        )
      ) {
        continue;
      }

      reachable.add(
        currentId
      );

      const outgoingEdges =
        edges.filter(
          (edge) =>
            edge.source ===
            currentId
        );

      for (const edge of outgoingEdges) {
        if (
          nodeMap.has(
            edge.target
          )
        ) {
          queue.push(
            edge.target
          );
        }
      }
    }

    for (const node of nodes) {
      if (
        !reachable.has(node.id)
      ) {
        errors.push(
          `Node ${node.id} is not reachable from the trigger.`
        );
      }
    }
  }

  const adjacency =
    new Map();

  for (const node of nodes) {
    adjacency.set(
      node.id,
      []
    );
  }

  for (const edge of edges) {
    if (
      adjacency.has(
        edge.source
      ) &&
      nodeMap.has(
        edge.target
      )
    ) {
      adjacency
        .get(edge.source)
        .push(edge.target);
    }
  }

  const visiting =
    new Set();

  const visited =
    new Set();

  const visit = (nodeId) => {
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

    const children =
      adjacency.get(nodeId) ||
      [];

    for (const child of children) {
      if (visit(child)) {
        return true;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);

    return false;
  };

  for (const node of nodes) {
    if (
      visit(node.id)
    ) {
      errors.push(
        "Workflow cannot contain cycles."
      );

      break;
    }
  }

  return errors;
};

const evaluateCondition = (
  node,
  input
) => {
  const config =
    node.config || {};

  const field =
    config.field || "";

  const operator =
    config.operator ||
    "equals";

  const expectedValue =
    config.value;

  const actualValue =
    getValueFromPath(
      input,
      field
    );

  switch (operator) {
    case "equals":
      return (
        String(actualValue) ===
        String(expectedValue)
      );

    case "not_equals":
      return (
        String(actualValue) !==
        String(expectedValue)
      );

    case "contains":
      if (
        typeof actualValue ===
        "string"
      ) {
        return actualValue.includes(
          String(expectedValue)
        );
      }

      if (
        Array.isArray(
          actualValue
        )
      ) {
        return actualValue.includes(
          expectedValue
        );
      }

      return false;

    case "greater_than":
      return (
        Number(actualValue) >
        Number(expectedValue)
      );

    case "less_than":
      return (
        Number(actualValue) <
        Number(expectedValue)
      );

    default:
      throw new Error(
        `Unsupported condition operator: ${operator}`
      );
  }
};

const isRetryableStatus = (
  status
) => {
  return (
    status === 408 ||
    status === 429 ||
    status >= 500
  );
};

const sleep = (
  milliseconds
) => {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
};

const executeSingleHttpRequest =
  async ({
    method,
    url,
    headers,
    body,
    timeoutMs
  }) => {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        timeoutMs
      );

    try {
      const response =
        await fetch(url, {
          method,
          headers,
          body:
            body === undefined
              ? undefined
              : JSON.stringify(body),
          signal:
            controller.signal
        });

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
        const error =
          new Error(
            `HTTP request failed with status ${response.status}`
          );

        error.retryable =
          isRetryableStatus(
            response.status
          );

        error.status =
          response.status;

        throw error;
      }

      const responseHeaders =
        {};

      for (const [
        key,
        value
      ] of response.headers.entries()) {
        responseHeaders[key] =
          value;
      }

      return {
        status:
          response.status,

        statusText:
          response.statusText,

        data:
          responseData,

        headers:
          responseHeaders
      };
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        const timeoutError =
          new Error(
            `HTTP request timed out after ${timeoutMs}ms.`
          );

        timeoutError.retryable =
          true;

        timeoutError.code =
          "HTTP_TIMEOUT";

        throw timeoutError;
      }

      throw error;
    } finally {
      clearTimeout(
        timeout
      );
    }
  };

const executeHttpNode =
  async (
    node,
    input
  ) => {
    const config =
      node.config || {};

    const method =
      String(
        config.method ||
          "GET"
      ).toUpperCase();

    const rawUrl =
      config.url || "";

    if (!rawUrl) {
      throw new Error(
        "HTTP request URL is required."
      );
    }

    const url =
      resolveTemplate(
        rawUrl,
        input
      );

    let timeoutMs =
      Number(
        config.timeoutMs
      );

    if (
      !Number.isFinite(
        timeoutMs
      ) ||
      timeoutMs <= 0
    ) {
      timeoutMs = 10000;
    }

    timeoutMs =
      Math.min(
        timeoutMs,
        120000
      );

    let retries =
      Number(
        config.retries
      );

    if (
      !Number.isFinite(
        retries
      ) ||
      retries < 0
    ) {
      retries = 0;
    }

    retries =
      Math.min(
        Math.floor(retries),
        5
      );

    const headers =
      resolveHeaders(
        config.headers,
        input
      );

    const showRequestBody =
      method !== "GET" &&
      method !== "HEAD" &&
      method !== "DELETE";

    const body =
      showRequestBody
        ? resolveJsonBody(
            config.body,
            input
          )
        : undefined;

    let lastError =
      null;

    const maxAttempts =
      retries + 1;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt += 1
    ) {
      try {
        const output =
          await executeSingleHttpRequest({
            method,
            url,
            headers,
            body,
            timeoutMs
          });

        return {
          ...output,
          attempts: attempt
        };
      } catch (error) {
        lastError =
          error;

        const shouldRetry =
          error?.retryable === true ||
          !error?.response;

        const hasAttemptsLeft =
          attempt < maxAttempts;

        if (
          !shouldRetry ||
          !hasAttemptsLeft
        ) {
          throw error;
        }

        const delay =
          Math.min(
            1000 *
              2 **
                (attempt - 1),
            5000
          );

        await sleep(
          delay
        );
      }
    }

    throw (
      lastError ||
      new Error(
        "HTTP request failed."
      )
    );
  };

const createExecutionNodes = (
  nodes
) => {
  return nodes.map(
    (node) => ({
      nodeId:
        node.id,

      nodeType:
        getNodeType(node),

      order:
        null,

      status:
        "pending",

      startedAt:
        null,

      finishedAt:
        null,

      input:
        null,

      output:
        null,

      error:
        null
    })
  );
};

export const executeWorkflow =
  async ({
    workflow,
    userId,
    triggerInput = {},
    triggerType = "manual"
  }) => {
    const nodes =
      workflow.nodes || [];

    const edges =
      workflow.edges || [];

    const validationErrors =
      validateWorkflowGraph(
        nodes,
        edges
      );

    if (
      validationErrors.length
    ) {
      const error =
        new Error(
          validationErrors.join(" ")
        );

      error.statusCode = 400;

      throw error;
    }

    const triggerNode =
      nodes.find(
        (node) =>
          getNodeType(node) ===
          "trigger"
      );

    const nodeMap =
      new Map(
        nodes.map(
          (node) => [
            node.id,
            node
          ]
        )
      );

    const execution =
      await Execution.create({
        workflow:
          workflow._id,

        user:
          userId,

        status:
          "running",

        trigger:
          triggerType,

        startedAt:
          new Date(),

        nodes:
          createExecutionNodes(
            nodes
          )
      });

    const executionNodeMap =
      new Map(
        execution.nodes.map(
          (node) => [
            node.nodeId,
            node
          ]
        )
      );

    let currentNode =
      triggerNode;

    let currentInput =
      triggerInput;

    let finalOutput =
      triggerInput;

    let executionOrder =
      0;

    try {
      while (currentNode) {
        const executionNode =
          executionNodeMap.get(
            currentNode.id
          );

        if (
          !executionNode
        ) {
          throw new Error(
            `Execution node not found: ${currentNode.id}`
          );
        }

        executionOrder += 1;

        executionNode.order =
          executionOrder;

        executionNode.status =
          "running";

        executionNode.startedAt =
          new Date();

        executionNode.input =
          currentInput;

        executionNode.markModified(
          "input"
        );

        await execution.save();

        try {
          const nodeType =
            getNodeType(
              currentNode
            );

          let output;

          if (
            nodeType ===
            "trigger"
          ) {
            output =
              triggerInput;
          } else if (
            nodeType ===
            "http"
          ) {
            output =
              await executeHttpNode(
                currentNode,
                currentInput
              );
          } else if (
            nodeType ===
            "condition"
          ) {
            const result =
              evaluateCondition(
                currentNode,
                currentInput
              );

            output = {
              result
            };
          } else {
            throw new Error(
              `Unsupported workflow node type: ${nodeType}`
            );
          }

          executionNode.status =
            "success";

          executionNode.finishedAt =
            new Date();

          executionNode.output =
            output;

          executionNode.markModified(
            "input"
          );

          executionNode.markModified(
            "output"
          );

          await execution.save();

          finalOutput =
            output;

          if (
            nodeType ===
            "condition"
          ) {
            const outgoingEdges =
              edges.filter(
                (edge) =>
                  edge.source ===
                  currentNode.id
              );

            const trueEdge =
              outgoingEdges.find(
                (edge) =>
                  edge.sourceHandle ===
                  "true"
              );

            const falseEdge =
              outgoingEdges.find(
                (edge) =>
                  edge.sourceHandle ===
                  "false"
              );

            const result =
              Boolean(
                output.result
              );

            const selectedEdge =
              result
                ? trueEdge
                : falseEdge;

            const skippedEdge =
              result
                ? falseEdge
                : trueEdge;

            if (
              skippedEdge
            ) {
              const skippedNode =
                executionNodeMap.get(
                  skippedEdge.target
                );

              if (
                skippedNode &&
                skippedNode.status ===
                  "pending"
              ) {
                skippedNode.status =
                  "skipped";

                skippedNode.finishedAt =
                  new Date();

                skippedNode.error =
                  "Branch was not selected.";
              }
            }

            if (
              !selectedEdge
            ) {
              currentNode =
                null;

              continue;
            }

            currentNode =
              nodeMap.get(
                selectedEdge.target
              );

            currentInput =
              output;

            continue;
          }

          const outgoingEdge =
            edges.find(
              (edge) =>
                edge.source ===
                currentNode.id
            );

          if (
            !outgoingEdge
          ) {
            currentNode =
              null;

            continue;
          }

          currentNode =
            nodeMap.get(
              outgoingEdge.target
            );

          currentInput =
            output;
        } catch (nodeError) {
          executionNode.status =
            "failed";

          executionNode.finishedAt =
            new Date();

          executionNode.error =
            nodeError.message ||
            "Node execution failed.";

          executionNode.markModified(
            "input"
          );

          await execution.save();

          throw nodeError;
        }
      }

      execution.status =
        "success";

      execution.finishedAt =
        new Date();

      execution.durationMs =
        execution.finishedAt.getTime() -
        execution.startedAt.getTime();

      execution.error =
        null;

      await execution.save();

      return execution;
    } catch (error) {
      execution.status =
        "failed";

      execution.finishedAt =
        new Date();

      execution.durationMs =
        execution.finishedAt.getTime() -
        execution.startedAt.getTime();

      execution.error =
        error.message ||
        "Workflow execution failed.";

      await execution.save();

      return execution;
    }
  };