import { z } from "zod";

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Time must be in HH:mm format"
  );

const timezoneSchema = z
  .string()
  .min(1, "Timezone is required");

const scheduleConfigSchema = z
  .object({
    scheduleType: z.enum(
      [
        "interval",
        "hourly",
        "daily",
        "weekly",
        "cron"
      ],
      {
        errorMap: () => ({
          message:
            "Invalid schedule type"
        })
      }
    ),

    intervalMinutes: z
      .number()
      .int()
      .min(
        1,
        "Interval must be at least 1 minute"
      )
      .optional(),

    minute: z
      .number()
      .int()
      .min(0)
      .max(59)
      .optional(),

    time: timeSchema.optional(),

    dayOfWeek: z
      .enum(
        [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday"
        ],
        {
          errorMap: () => ({
            message:
              "Invalid day of week"
          })
        }
      )
      .optional(),

    cron: z
      .string()
      .trim()
      .min(
        1,
        "Cron expression is required"
      )
      .optional(),

    timezone: timezoneSchema,

    enabled: z.boolean()
  })
  .superRefine((config, ctx) => {
    if (
      config.scheduleType ===
        "interval" &&
      config.intervalMinutes ===
        undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["intervalMinutes"],
        message:
          "Interval minutes are required"
      });
    }

    if (
      config.scheduleType ===
        "hourly" &&
      config.minute === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minute"],
        message:
          "Minute is required"
      });
    }

    if (
      config.scheduleType ===
        "daily" &&
      config.time === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message:
          "Time is required"
      });
    }

    if (
      config.scheduleType ===
        "weekly"
    ) {
      if (
        config.dayOfWeek ===
        undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dayOfWeek"],
          message:
            "Day of week is required"
        });
      }

      if (
        config.time ===
        undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["time"],
          message:
            "Time is required"
        });
      }
    }

    if (
      config.scheduleType ===
        "cron" &&
      config.cron === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cron"],
        message:
          "Cron expression is required"
      });
    }
  });

const nodeSchema = z
  .object({
    id: z.string().min(1),

    type: z.string().min(1),

    position: z.object({
      x: z.number(),
      y: z.number()
    }),

    config: z
      .record(z.string(), z.unknown())
      .default({})
  })
  .superRefine((node, ctx) => {
    if (node.type !== "schedule") {
      return;
    }

    const result =
      scheduleConfigSchema.safeParse(
        node.config
      );

    if (!result.success) {
      for (const issue of result
        .error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            "config",
            ...issue.path
          ],
          message: issue.message
        });
      }
    }
  });

const edgeSchema = z.object({
  id: z.string().min(1),

  source: z.string().min(1),

  target: z.string().min(1),

  sourceHandle: z
    .string()
    .nullable()
    .optional(),

  targetHandle: z
    .string()
    .nullable()
    .optional()
});

export const createWorkflowSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Workflow name is required"
      )
      .max(
        100,
        "Workflow name cannot exceed 100 characters"
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description cannot exceed 500 characters"
      )
      .optional()
      .default("")
  });

export const updateWorkflowSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),

    nodes: z
      .array(nodeSchema)
      .optional(),

    edges: z
      .array(edgeSchema)
      .optional()
  });