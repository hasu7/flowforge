  import { Cron } from "croner";

  import Workflow from "../models/workflow.js";
  import WorkflowVersion from "../models/workflowVersion.js";

  import {
    executeWorkflow
  } from "./workflow-engine.service.js";

  const scheduledJobs =
    new Map();

  const getNodeType = (node) => {
    return (
      node.config?.nodeType ||
      node.data?.nodeType ||
      node.type ||
      "trigger"
    );
  };

  const isScheduleNode = (
    node
  ) => {
    return (
      getNodeType(node) ===
      "schedule"
    );
  };

  const getScheduleNode = (
    workflowVersion
  ) => {
    const nodes =
      workflowVersion.nodes || [];

    return nodes.find(
      (node) =>
        isScheduleNode(node)
    );
  };

  /*
  * React Flow stores node configuration
  * inside node.data.config.
  *
  * Older backend-shaped nodes may use
  * node.config, so support both.
  */
  const getScheduleConfig = (
    scheduleNode
  ) => {
    if (!scheduleNode) {
      return null;
    }

    return {
      ...(scheduleNode.config || {}),
      ...(scheduleNode.data?.config || {})
    };
  };

  const getDayOfWeekNumber = (
    dayOfWeek
  ) => {
    const days = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    return days[
      String(
        dayOfWeek || "monday"
      )
        .trim()
        .toLowerCase()
    ];
  };

  const parseTime = (
    time
  ) => {
    if (
      typeof time !== "string"
    ) {
      return null;
    }

    const match =
      time.match(
        /^([01]\d|2[0-3]):([0-5]\d)$/
      );

    if (!match) {
      return null;
    }

    return {
      hour:
        Number(match[1]),

      minute:
        Number(match[2])
    };
  };

  const createScheduleDefinition = (
    config
  ) => {
    /*
    * These defaults intentionally match
    * the Schedule configuration UI.
    */
    const scheduleType =
      config.scheduleType ||
      "daily";

    const timezone =
      config.timezone ||
      "Asia/Kolkata";

    if (
      typeof timezone !==
      "string" ||
      !timezone.trim()
    ) {
      throw new Error(
        "Schedule timezone is required."
      );
    }

    if (
      scheduleType ===
      "interval"
    ) {
      const intervalMinutes =
        Number(
          config.intervalMinutes
        );

      if (
        !Number.isInteger(
          intervalMinutes
        ) ||
        intervalMinutes < 1
      ) {
        throw new Error(
          "Schedule interval must be at least 1 minute."
        );
      }

      return {
        pattern:
          "* * * * * *",

        options: {
          timezone,
          interval:
            intervalMinutes * 60
        }
      };
    }

    if (
      scheduleType ===
      "hourly"
    ) {
      const minute =
        Number(
          config.minute ?? 0
        );

      if (
        !Number.isInteger(
          minute
        ) ||
        minute < 0 ||
        minute > 59
      ) {
        throw new Error(
          "Hourly schedule minute must be between 0 and 59."
        );
      }

      return {
        pattern:
          `0 ${minute} * * * *`,

        options: {
          timezone
        }
      };
    }

    if (
      scheduleType ===
      "daily"
    ) {
      const parsedTime =
        parseTime(
          config.time ||
            "09:00"
        );

      if (!parsedTime) {
        throw new Error(
          "Daily schedule time must be in HH:mm format."
        );
      }

      return {
        pattern:
          `0 ${parsedTime.minute} ${parsedTime.hour} * * *`,

        options: {
          timezone
        }
      };
    }

    if (
      scheduleType ===
      "weekly"
    ) {
      const parsedTime =
        parseTime(
          config.time ||
            "09:00"
        );

      if (!parsedTime) {
        throw new Error(
          "Weekly schedule time must be in HH:mm format."
        );
      }

      const day =
        getDayOfWeekNumber(
          config.dayOfWeek ||
            "monday"
        );

      if (
        day === undefined
      ) {
        throw new Error(
          "Weekly schedule day is invalid."
        );
      }

      return {
        pattern:
          `0 ${parsedTime.minute} ${parsedTime.hour} * * ${day}`,

        options: {
          timezone
        }
      };
    }

    if (
      scheduleType ===
      "cron"
    ) {
      const cronExpression =
        String(
          config.cron ||
            "0 9 * * *"
        ).trim();

      if (!cronExpression) {
        throw new Error(
          "Cron expression is required."
        );
      }

      return {
        pattern:
          cronExpression,

        options: {
          timezone
        }
      };
    }

    throw new Error(
      `Unsupported schedule type: ${scheduleType}`
    );
  };

  /*
  * The schedule signature represents the actual
  * Cron behavior.
  *
  * We intentionally use the generated schedule
  * definition instead of the whole config so that
  * unrelated workflow configuration changes do not
  * unnecessarily restart the scheduler job.
  *
  * Examples:
  * - interval 1 -> interval 2 changes the signature
  * - daily 09:00 -> 10:00 changes the signature
  * - timezone changes the signature
  * - cron expression changes the signature
  */
  const createScheduleSignature = (
    definition
  ) => {
    return JSON.stringify({
      pattern:
        definition.pattern,

      options:
        definition.options
    });
  };

  const createScheduleKey = (
    workflowId,
    scheduleNodeId
  ) => {
    return `${workflowId}:${scheduleNodeId}`;
  };

  const stopScheduledJob = (
    key
  ) => {
    const existingEntry =
      scheduledJobs.get(key);

    if (!existingEntry) {
      return;
    }

    try {
      existingEntry.job.stop();
    } catch (error) {
      console.error(
        `Failed to stop scheduler job ${key}:`,
        error
      );
    }

    scheduledJobs.delete(
      key
    );
  };

  const executeScheduledWorkflow =
    async ({
      workflow,
      workflowVersion,
      scheduleNode
    }) => {
      try {
        const scheduleConfig =
          getScheduleConfig(
            scheduleNode
          );

        /*
        * Execute the immutable published
        * WorkflowVersion snapshot.
        */
        const workflowSnapshot = {
          _id:
            workflow._id,

          owner:
            workflow.owner,

          name:
            workflowVersion.name,

          description:
            workflowVersion.description,

          nodes:
            workflowVersion.nodes,

          edges:
            workflowVersion.edges,

          status:
            "published",

          publishedVersion:
            workflowVersion.version,

          publishedAt:
            workflowVersion.publishedAt
        };

        const execution =
          await executeWorkflow({
            workflow:
              workflowSnapshot,

            userId:
              workflow.owner,

            triggerInput: {
              scheduledAt:
                new Date().toISOString(),

              scheduleNodeId:
                scheduleNode.id,

              scheduleType:
                scheduleConfig
                  ?.scheduleType ||
                "daily"
            },

            triggerType:
              "schedule"
          });

        console.log(
          `Scheduled workflow executed: workflow=${workflow._id} version=${workflowVersion.version} execution=${execution._id} status=${execution.status}`
        );

        return execution;
      } catch (error) {
        console.error(
          `Scheduled workflow execution failed: workflow=${workflow._id} version=${workflowVersion.version}`,
          error
        );

        return null;
      }
    };

  const registerWorkflowSchedule =
    async (workflow) => {
      if (
        workflow.status !==
        "published"
      ) {
        return null;
      }

      if (
        !workflow.publishedVersion
      ) {
        return null;
      }

      const workflowVersion =
        await WorkflowVersion.findOne({
          workflow:
            workflow._id,

          version:
            workflow.publishedVersion
        });

      if (!workflowVersion) {
        console.warn(
          `Published version not found for workflow ${workflow._id}.`
        );

        return null;
      }

      const scheduleNode =
        getScheduleNode(
          workflowVersion
        );

      if (!scheduleNode) {
        return null;
      }

      const config =
        getScheduleConfig(
          scheduleNode
        );

      if (!config) {
        return null;
      }

      /*
      * The UI treats anything except explicit
      * false as enabled.
      */
      const enabled =
        config.enabled !== false;

      if (!enabled) {
        return null;
      }

      const key =
        createScheduleKey(
          workflow._id.toString(),
          scheduleNode.id
        );

      /*
      * Build and validate the new schedule
      * definition before touching an existing job.
      *
      * This means an invalid new configuration
      * will not destroy a previously valid job.
      */
      const definition =
        createScheduleDefinition(
          config
        );

      const signature =
        createScheduleSignature(
          definition
        );

      const existingEntry =
        scheduledJobs.get(key);

      /*
      * The schedule already exists and its actual
      * timing behavior has not changed.
      *
      * Keep the existing Cron job.
      */
      if (
        existingEntry &&
        existingEntry.signature ===
          signature
      ) {
        return existingEntry.job;
      }

      /*
      * The schedule exists but its configuration
      * changed.
      *
      * Stop the old Cron job before registering
      * the new schedule.
      */
      if (existingEntry) {
        console.log(
          `Schedule changed. Replacing scheduler job: workflow=${workflow._id} node=${scheduleNode.id}`
        );

        stopScheduledJob(
          key
        );
      }

      const job =
        new Cron(
          definition.pattern,
          {
            ...definition.options,

            name:
              `flowforge:${key}`,

            protect: true,

            catch: (error) => {
              console.error(
                `Scheduler error for ${key}:`,
                error
              );
            }
          },
          async () => {
            /*
            * Reload the workflow every time a
            * scheduled run occurs.
            *
            * This guarantees that we execute
            * the currently published version,
            * never an unpublished draft.
            */
            try {
              const currentWorkflow =
                await Workflow.findOne({
                  _id:
                    workflow._id,

                  status:
                    "published"
                });

              if (
                !currentWorkflow ||
                !currentWorkflow.publishedVersion
              ) {
                console.warn(
                  `Skipping scheduled execution because workflow ${workflow._id} is no longer published.`
                );

                return;
              }

              const currentVersion =
                await WorkflowVersion.findOne({
                  workflow:
                    currentWorkflow._id,

                  version:
                    currentWorkflow.publishedVersion
                });

              if (
                !currentVersion
              ) {
                console.warn(
                  `Skipping scheduled execution because published version ${currentWorkflow.publishedVersion} was not found for workflow ${currentWorkflow._id}.`
                );

                return;
              }

              const currentScheduleNode =
                getScheduleNode(
                  currentVersion
                );

              if (
                !currentScheduleNode
              ) {
                console.warn(
                  `Skipping scheduled execution because workflow ${currentWorkflow._id} no longer contains a schedule node.`
                );

                return;
              }

              const currentConfig =
                getScheduleConfig(
                  currentScheduleNode
                );

              /*
              * Explicit false means disabled.
              * Missing enabled means enabled,
              * matching the frontend behavior.
              */
              if (
                currentConfig.enabled ===
                false
              ) {
                console.log(
                  `Skipping scheduled execution because schedule is disabled for workflow ${currentWorkflow._id}.`
                );

                return;
              }

              await executeScheduledWorkflow({
                workflow:
                  currentWorkflow,

                workflowVersion:
                  currentVersion,

                scheduleNode:
                  currentScheduleNode
              });
            } catch (error) {
              console.error(
                `Failed to execute scheduled workflow ${workflow._id}:`,
                error
              );
            }
          }
        );

      const nextRun =
        job.nextRun();

      if (!nextRun) {
        job.stop();

        throw new Error(
          `Schedule for workflow ${workflow._id} has no future execution time.`
        );
      }

      scheduledJobs.set(
        key,
        {
          job,

          signature
        }
      );

      console.log(
        `Schedule registered: workflow=${workflow._id} version=${workflowVersion.version} node=${scheduleNode.id} nextRun=${nextRun.toISOString()}`
      );

      return job;
    };

  export const refreshScheduler =
    async () => {
      const workflows =
        await Workflow.find({
          status:
            "published",

          publishedVersion: {
            $ne: null
          }
        });

      const activeKeys =
        new Set();

      for (const workflow of workflows) {
        try {
          const workflowVersion =
            await WorkflowVersion.findOne({
              workflow:
                workflow._id,

              version:
                workflow.publishedVersion
            });

          if (!workflowVersion) {
            continue;
          }

          const scheduleNode =
            getScheduleNode(
              workflowVersion
            );

          if (!scheduleNode) {
            continue;
          }

          const config =
            getScheduleConfig(
              scheduleNode
            );

          const enabled =
            config?.enabled !== false;

          const key =
            createScheduleKey(
              workflow._id.toString(),
              scheduleNode.id
            );

          if (enabled) {
            activeKeys.add(
              key
            );

            /*
            * Always ask registerWorkflowSchedule
            * to inspect the current schedule.
            *
            * It will keep the existing job when
            * nothing changed, or replace it when
            * the schedule configuration changed.
            */
            try {
              await registerWorkflowSchedule(
                workflow
              );
            } catch (error) {
              console.error(
                `Failed to register schedule for workflow ${workflow._id}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(
            `Failed to inspect workflow ${workflow._id} for scheduling:`,
            error
          );
        }
      }

      /*
      * Remove jobs which are no longer active.
      *
      * This covers:
      * - disabled schedules
      * - restored draft workflows
      * - deleted workflows
      * - removed schedule nodes
      * - replaced schedule nodes
      */
      for (const key of scheduledJobs.keys()) {
        if (
          !activeKeys.has(key)
        ) {
          stopScheduledJob(
            key
          );
        }
      }

      console.log(
        `Scheduler refresh complete. Active schedules: ${scheduledJobs.size}`
      );
    };

  export const stopScheduler =
    () => {
      for (const key of scheduledJobs.keys()) {
        stopScheduledJob(
          key
        );
      }

      console.log(
        "Scheduler stopped."
      );
    };

  export const getSchedulerStatus =
    () => {
      return {
        activeSchedules:
          scheduledJobs.size,

        schedules:
          Array.from(
            scheduledJobs.entries()
          ).map(
            ([key, entry]) => ({
              key,

              nextRun:
                entry
                  .job
                  .nextRun()
                  ?.toISOString() ||
                null
            })
          )
      };
    };