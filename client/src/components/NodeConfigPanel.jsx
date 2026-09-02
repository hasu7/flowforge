import { useEffect, useState } from "react";

function NodeConfigPanel({
  node,
  onUpdate,
  onClose
}) {
  const [config, setConfig] =
    useState({});

  useEffect(() => {
    if (!node) {
      setConfig({});
      return;
    }

    setConfig({
      ...(node.data?.config || {})
    });
  }, [node]);

  if (!node) {
    return (
      <aside className="node-config-panel">
        <div className="node-config-empty">
          <h3>Node Configuration</h3>

          <p>
            Select a node to configure it.
          </p>
        </div>
      </aside>
    );
  }

  const nodeType =
    node.data?.nodeType ||
    "trigger";

  const updateConfig = (
    key,
    value
  ) => {
    const updatedConfig = {
      ...config,
      [key]: value
    };

    setConfig(
      updatedConfig
    );

    onUpdate(
      updatedConfig
    );
  };

  const getNodeTitle = () => {
    if (
      nodeType === "http"
    ) {
      return "HTTP Request";
    }

    if (
      nodeType === "condition"
    ) {
      return "Condition";
    }

    return "Trigger";
  };

  return (
    <aside className="node-config-panel">

      <div className="node-config-header">

        <div>
          <p className="node-config-label">
            Configuration
          </p>

          <h3>
            {getNodeTitle()}
          </h3>
        </div>

        <button
          type="button"
          className="node-config-close"
          onClick={onClose}
        >
          ×
        </button>

      </div>

      {nodeType === "trigger" && (
        <div className="node-config-section">

          <div className="config-field">

            <label htmlFor="trigger-type">
              Trigger type
            </label>

            <select
              id="trigger-type"
              value={
                config.triggerType ||
                "manual"
              }
              onChange={(event) =>
                updateConfig(
                  "triggerType",
                  event.target.value
                )
              }
            >
              <option value="manual">
                Manual
              </option>

              <option value="webhook">
                Webhook
              </option>
            </select>

          </div>

        </div>
      )}

      {nodeType === "http" && (
        <div className="node-config-section">

          <div className="config-field">

            <label htmlFor="http-method">
              Method
            </label>

            <select
              id="http-method"
              value={
                config.method ||
                "GET"
              }
              onChange={(event) =>
                updateConfig(
                  "method",
                  event.target.value
                )
              }
            >
              <option value="GET">
                GET
              </option>

              <option value="POST">
                POST
              </option>

              <option value="PUT">
                PUT
              </option>

              <option value="PATCH">
                PATCH
              </option>

              <option value="DELETE">
                DELETE
              </option>
            </select>

          </div>

          <div className="config-field">

            <label htmlFor="http-url">
              URL
            </label>

            <input
              id="http-url"
              type="url"
              value={
                config.url || ""
              }
              onChange={(event) =>
                updateConfig(
                  "url",
                  event.target.value
                )
              }
              placeholder="https://api.example.com/users/{{data.id}}"
            />

            <small className="config-help">
              Use {"{{data.field}}"} to reference data from the previous node.
            </small>

          </div>

        </div>
      )}

      {nodeType === "condition" && (
        <div className="node-config-section">

          <div className="config-field">

            <label htmlFor="condition-field">
              Field
            </label>

            <input
              id="condition-field"
              type="text"
              value={
                config.field || ""
              }
              onChange={(event) =>
                updateConfig(
                  "field",
                  event.target.value
                )
              }
              placeholder="status"
            />

            <small className="config-help">
              Example: data.id
            </small>

          </div>

          <div className="config-field">

            <label htmlFor="condition-operator">
              Operator
            </label>

            <select
              id="condition-operator"
              value={
                config.operator ||
                "equals"
              }
              onChange={(event) =>
                updateConfig(
                  "operator",
                  event.target.value
                )
              }
            >
              <option value="equals">
                Equals
              </option>

              <option value="not_equals">
                Not equals
              </option>

              <option value="contains">
                Contains
              </option>

              <option value="greater_than">
                Greater than
              </option>

              <option value="less_than">
                Less than
              </option>
            </select>

          </div>

          <div className="config-field">

            <label htmlFor="condition-value">
              Value
            </label>

            <input
              id="condition-value"
              type="text"
              value={
                config.value || ""
              }
              onChange={(event) =>
                updateConfig(
                  "value",
                  event.target.value
                )
              }
              placeholder="200"
            />

          </div>

        </div>
      )}

    </aside>
  );
}

export default NodeConfigPanel;