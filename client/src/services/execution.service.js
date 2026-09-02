import api from "./api.js";

export const getExecutions = async () => {
  const response = await api.get(
    "/executions"
  );

  return response.data;
};

export const getExecution = async (
  executionId
) => {
  const response = await api.get(
    `/executions/${executionId}`
  );

  return response.data;
};

export const runWorkflow = async (
  workflowId
) => {
  const response = await api.post(
    `/workflows/${workflowId}/run`
  );

  return response.data;
};