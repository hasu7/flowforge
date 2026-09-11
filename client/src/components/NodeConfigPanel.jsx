import {
  useState
} from "react";

import api from "../services/api.js";

function NodeConfigPanel({
  node,
  scheduleStatus,
  scheduleStatusLoading,
  onUpdate,
  onClose
}) {
  const [config, setConfig] = useState(() => ({
    ...(node?.data?.config || {})
  }));

  const [webhookCopied, setWebhookCopied] =
    useState(false);

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
    node.data?.nodeType || "trigger";

  const triggerType =
    config.triggerType || "manual";

  const updateConfig = (
    key,
    value
  ) => {
    const updatedConfig = {
      ...config,
      [key]: value
    };

    setConfig(updatedConfig);
    onUpdate(updatedConfig);

    if (
      key === "webhookPath"
    ) {
      setWebhookCopied(false);
    }
  };

  const getNodeTitle = () => {
    if (nodeType === "http") {
      return "HTTP Request";
    }

    if (nodeType === "condition") {
      return "Condition";
    }

    if (nodeType === "schedule") {
      return "Schedule Trigger";
    }

    return "Trigger";
  };

  const httpMethod =
    config.method || "GET";

  const showRequestBody =
    httpMethod !== "GET" &&
    httpMethod !== "HEAD" &&
    httpMethod !== "DELETE";

  const timeoutSeconds =
    config.timeoutMs !== undefined
      ? Number(config.timeoutMs) / 1000
      : 10;

  const retryCount =
    config.retries !== undefined
      ? Number(config.retries)
      : 0;

  const scheduleType =
    config.scheduleType || "interval";

  const scheduleEnabled =
    config.enabled !== false;

  const scheduleActive =
    scheduleStatus?.active === true;

  const formattedNextRun =
    scheduleStatus?.nextRun
      ? new Date(
          scheduleStatus.nextRun
        ).toLocaleString()
      : null;

  const normalizedWebhookPath =
    typeof config.webhookPath ===
      "string"
      ? config.webhookPath
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

  const webhookUrl =
    normalizedWebhookPath
      ? `${webhookBaseUrl}/webhooks/${normalizedWebhookPath}`
      : "";

  const handleCopyWebhookUrl =
    async () => {
      if (!webhookUrl) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          webhookUrl
        );

        setWebhookCopied(true);

        window.setTimeout(() => {
          setWebhookCopied(false);
        }, 2000);
      } catch (error) {
        console.error(
          "Failed to copy webhook URL:",
          error
        );
      }
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
              value={triggerType}
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

          {triggerType === "webhook" && (
            <>
              <div className="config-field">
                <label htmlFor="webhook-method">
                  Method
                </label>

                <select
                  id="webhook-method"
                  value={
                    config.webhookMethod ||
                    "POST"
                  }
                  onChange={(event) =>
                    updateConfig(
                      "webhookMethod",
                      event.target.value
                    )
                  }
                >
                  <option value="POST">
                    POST
                  </option>

                  <option value="GET">
                    GET
                  </option>

                  <option value="PUT">
                    PUT
                  </option>

                  <option value="PATCH">
                    PATCH
                  </option>
                </select>
              </div>

              <div className="config-field">
                <label htmlFor="webhook-path">
                  Webhook path
                </label>

                <input
                  id="webhook-path"
                  type="text"
                  value={
                    config.webhookPath ||
                    ""
                  }
                  onChange={(event) =>
                    updateConfig(
                      "webhookPath",
                      event.target.value
                    )
                  }
                  placeholder="my-webhook"
                />

                <small className="config-help">
                  Use a simple path such as
                  {" "}
                  /my-webhook.
                  {" "}
                  FlowForge will expose the
                  final endpoint from this path.
                </small>
              </div>

              <div className="config-field">
                <label>
                  Webhook URL
                </label>

                {webhookUrl ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "stretch"
                    }}
                  >
                    <input
                      type="text"
                      value={webhookUrl}
                      readOnly
                      aria-label="Webhook URL"
                      style={{
                        flex: 1
                      }}
                    />

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        handleCopyWebhookUrl
                      }
                    >
                      {webhookCopied
                        ? "Copied!"
                        : "Copy"}
                    </button>
                  </div>
                ) : (
                  <div className="config-disabled">
                    Enter a webhook path to
                    generate the endpoint URL.
                  </div>
                )}

                <small className="config-help">
                  Send requests to this URL to
                  start the published workflow.
                </small>
              </div>

              <div className="config-field">
                <label htmlFor="webhook-secret">
                  Webhook secret
                </label>

                <input
                  id="webhook-secret"
                  type="password"
                  value={
                    config.webhookSecret ||
                    ""
                  }
                  onChange={(event) =>
                    updateConfig(
                      "webhookSecret",
                      event.target.value
                    )
                  }
                  placeholder="Optional secret"
                  autoComplete="new-password"
                />

                <small className="config-help">
                  Optional verification secret.
                  Send it using the
                  {" "}
                  x-webhook-secret
                  {" "}
                  request header.
                </small>
              </div>

              <div className="config-field">
                <label htmlFor="webhook-description">
                  Description
                </label>

                <textarea
                  id="webhook-description"
                  value={
                    config.webhookDescription ||
                    ""
                  }
                  onChange={(event) =>
                    updateConfig(
                      "webhookDescription",
                      event.target.value
                    )
                  }
                  placeholder="Receives an order event and starts the workflow."
                  rows="4"
                />

                <small className="config-help">
                  Describe what this webhook is
                  expected to receive.
                </small>
              </div>
            </>
          )}
        </div>
      )}

      {nodeType === "schedule" && (
        <div className="node-config-section">
          <div className="config-field">
            <label>
              Scheduler status
            </label>

            <div className="schedule-status">
              <span
                className="schedule-status-dot"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  display: "inline-block",
                  marginRight: "8px",
                  backgroundColor:
                    scheduleStatusLoading
                      ? "#999"
                      : scheduleActive
                        ? "#22c55e"
                        : "#999"
                }}
              />

              <span>
                {scheduleStatusLoading
                  ? "Checking"
                  : scheduleActive
                    ? "Active"
                    : "Inactive"}
              </span>
            </div>

            {formattedNextRun && (
              <small className="config-help">
                Next run:{" "}
                {formattedNextRun}
              </small>
            )}

            {!scheduleStatusLoading &&
              !scheduleActive && (
                <small className="config-help">
                  Publish the workflow with an
                  enabled schedule to activate it.
                </small>
              )}
          </div>

          <div className="config-field">
            <label htmlFor="schedule-type">
              Schedule type
            </label>

            <select
              id="schedule-type"
              value={scheduleType}
              onChange={(event) =>
                updateConfig(
                  "scheduleType",
                  event.target.value
                )
              }
            >
              <option value="interval">
                Every X minutes
              </option>

              <option value="hourly">
                Hourly
              </option>

              <option value="daily">
                Daily
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="cron">
                Cron
              </option>
            </select>
          </div>

          {scheduleType === "interval" && (
            <div className="config-field">
              <label htmlFor="schedule-interval">
                Interval in minutes
              </label>

              <input
                id="schedule-interval"
                type="number"
                min="1"
                value={
                  config.intervalMinutes ||
                  5
                }
                onChange={(event) =>
                  updateConfig(
                    "intervalMinutes",
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      ) || 1
                    )
                  )
                }
              />
            </div>
          )}

          {scheduleType === "hourly" && (
            <div className="config-field">
              <label htmlFor="schedule-minute">
                Minute
              </label>

              <input
                id="schedule-minute"
                type="number"
                min="0"
                max="59"
                value={
                  config.minute ?? 0
                }
                onChange={(event) =>
                  updateConfig(
                    "minute",
                    Math.min(
                      59,
                      Math.max(
                        0,
                        Number(
                          event.target.value
                        ) || 0
                      )
                    )
                  )
                }
              />
            </div>
          )}

          {scheduleType === "daily" && (
            <>
              <div className="config-field">
                <label htmlFor="schedule-time">
                  Time
                </label>

                <input
                  id="schedule-time"
                  type="time"
                  value={
                    config.time ||
                    "09:00"
                  }
                  onChange={(event) =>
                    updateConfig(
                      "time",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="config-field">
                <label htmlFor="schedule-timezone">
                  Timezone
                </label>

                <select
                  id="schedule-timezone"
                  value={
                    config.timezone ||
                    "Asia/Kolkata"
                  }
                  onChange={(event) =>
                    updateConfig(
                      "timezone",
                      event.target.value
                    )
                  }
                >
                  <option value="Asia/Kolkata">
                    Asia/Kolkata
                  </option>

                  <option value="UTC">
                    UTC
                  </option>

                  <option value="America/New_York">
                    America/New_York
                  </option>

                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>

                  <option value="Europe/London">
                    Europe/London
                  </option>

                  <option value="Europe/Berlin">
                    Europe/Berlin
                  </option>

                  <option value="Asia/Tokyo">
                    Asia/Tokyo
                  </option>
                </select>
              </div>
            </>
          )}

          {scheduleType === "weekly" && (
            <>
              <div className="config-field">
                <label htmlFor="schedule-day">
                  Day
                </label>

                <select
                  id="schedule-day"
                  value={
                    config.dayOfWeek ||
                    "monday"
                  }
                  onChange={(event) =>
                    updateConfig(
                      "dayOfWeek",
                      event.target.value
                    )
                  }
                >
                  <option value="monday">
                    Monday
                  </option>

                  <option value="tuesday">
                    Tuesday
                  </option>

                  <option value="wednesday">
                    Wednesday
                  </option>

                  <option value="thursday">
                    Thursday
                  </option>

                  <option value="friday">
                    Friday
                  </option>

                  <option value="saturday">
                    Saturday
                  </option>

                  <option value="sunday">
                    Sunday
                  </option>
                </select>
              </div>

              <div className="config-field">
                <label htmlFor="schedule-weekly-time">
                  Time
                </label>

                <input
                  id="schedule-weekly-time"
                  type="time"
                  value={
                    config.time ||
                    "09:00"
                  }
                  onChange={(event) =>
                    updateConfig(
                      "time",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="config-field">
                <label htmlFor="schedule-weekly-timezone">
                  Timezone
                </label>

                <select
                  id="schedule-weekly-timezone"
                  value={
                    config.timezone ||
                    "Asia/Kolkata"
                  }
                  onChange={(event) =>
                    updateConfig(
                      "timezone",
                      event.target.value
                    )
                  }
                >
                  <option value="Asia/Kolkata">
                    Asia/Kolkata
                  </option>

                  <option value="UTC">
                    UTC
                  </option>

                  <option value="America/New_York">
                    America/New_York
                  </option>

                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>

                  <option value="Europe/London">
                    Europe/London
                  </option>

                  <option value="Europe/Berlin">
                    Europe/Berlin
                  </option>

                  <option value="Asia/Tokyo">
                    Asia/Tokyo
                  </option>
                </select>
              </div>
            </>
          )}

          {scheduleType === "cron" && (
            <>
              <div className="config-field">
                <label htmlFor="schedule-cron">
                  Cron expression
                </label>

                <input
                  id="schedule-cron"
                  type="text"
                  value={
                    config.cron ||
                    ""
                  }
                  onChange={(event) =>
                    updateConfig(
                      "cron",
                      event.target.value
                    )
                  }
                  placeholder="0 0 * * * *"
                />

                <small className="config-help">
                  Cron format:
                  second minute hour day month weekday.
                </small>
              </div>

              <div className="config-field">
                <label htmlFor="schedule-cron-timezone">
                  Timezone
                </label>

                <select
                  id="schedule-cron-timezone"
                  value={
                    config.timezone ||
                    "Asia/Kolkata"
                  }
                  onChange={(event) =>
                    updateConfig(
                      "timezone",
                      event.target.value
                    )
                  }
                >
                  <option value="Asia/Kolkata">
                    Asia/Kolkata
                  </option>

                  <option value="UTC">
                    UTC
                  </option>

                  <option value="America/New_York">
                    America/New_York
                  </option>

                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>

                  <option value="Europe/London">
                    Europe/London
                  </option>

                  <option value="Europe/Berlin">
                    Europe/Berlin
                  </option>

                  <option value="Asia/Tokyo">
                    Asia/Tokyo
                  </option>
                </select>
              </div>
            </>
          )}

          <div className="config-field">
            <label htmlFor="schedule-enabled">
              Status
            </label>

            <select
              id="schedule-enabled"
              value={
                scheduleEnabled
                  ? "enabled"
                  : "disabled"
              }
              onChange={(event) =>
                updateConfig(
                  "enabled",
                  event.target.value ===
                    "enabled"
                )
              }
            >
              <option value="enabled">
                Enabled
              </option>

              <option value="disabled">
                Disabled
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
              value={httpMethod}
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
              type="text"
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
              Use {"{{data.field}}"} to reference
              data from the previous node.
            </small>
          </div>

          <div className="config-field">
            <label htmlFor="http-timeout">
              Timeout
            </label>

            <input
              id="http-timeout"
              type="number"
              min="1"
              max="120"
              step="1"
              value={timeoutSeconds}
              onChange={(event) => {
                const seconds =
                  Number(
                    event.target.value
                  );

                updateConfig(
                  "timeoutMs",
                  Number.isFinite(seconds) &&
                    seconds > 0
                    ? Math.min(
                        seconds * 1000,
                        120000
                      )
                    : 10000
                );
              }}
            />

            <small className="config-help">
              Maximum time to wait for one
              request. Default: 10 seconds.
            </small>
          </div>

          <div className="config-field">
            <label htmlFor="http-retries">
              Retries
            </label>

            <input
              id="http-retries"
              type="number"
              min="0"
              max="5"
              step="1"
              value={retryCount}
              onChange={(event) => {
                const retries =
                  Number(
                    event.target.value
                  );

                updateConfig(
                  "retries",
                  Number.isFinite(retries) &&
                    retries >= 0
                    ? Math.min(
                        Math.floor(retries),
                        5
                      )
                    : 0
                );
              }}
            />

            <small className="config-help">
              Number of additional attempts after
              a retryable failure. Maximum: 5.
            </small>
          </div>

          <div className="config-field">
            <label htmlFor="http-body">
              Request body
            </label>

            {showRequestBody ? (
              <>
                <textarea
                  id="http-body"
                  value={
                    config.body || ""
                  }
                  onChange={(event) =>
                    updateConfig(
                      "body",
                      event.target.value
                    )
                  }
                  placeholder={`{
  "userId": "{{data.userId}}",
  "title": "{{data.title}}",
  "completed": "{{data.completed}}"
}`}
                  rows="10"
                />

                <small className="config-help">
                  Enter a JSON body. You can use
                  {" {{data.field}} "}
                  to insert data from the previous
                  node.
                </small>
              </>
            ) : (
              <div className="config-disabled">
                Request body is not used with{" "}
                {httpMethod} requests.
              </div>
            )}
          </div>

          <div className="config-field">
            <label htmlFor="http-headers">
              Headers
            </label>

            <textarea
              id="http-headers"
              value={
                config.headers || ""
              }
              onChange={(event) =>
                updateConfig(
                  "headers",
                  event.target.value
                )
              }
              placeholder={`{
  "Authorization": "Bearer {{data.token}}",
  "Content-Type": "application/json"
}`}
              rows="8"
            />

            <small className="config-help">
              Enter headers as a JSON object.
              Variables from the previous node
              are supported.
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