import api from "./api.js";

export const getWorkflows = async () => {
  const response = await api.get("/workflows");

  return response.data;
};

export const createWorkflow = async (workflowData) => {
  const response = await api.post(
    "/workflows",
    workflowData
  );

  return response.data;
};

export const getWorkflow = async (workflowId) => {
  const response = await api.get(
    `/workflows/${workflowId}`
  );

  return response.data;
};

export const updateWorkflow = async (
  workflowId,
  workflowData
) => {
  const response = await api.patch(
    `/workflows/${workflowId}`,
    workflowData
  );

  return response.data;
};

export const deleteWorkflow = async (workflowId) => {
  const response = await api.delete(
    `/workflows/${workflowId}`
  );

  return response.data;
};