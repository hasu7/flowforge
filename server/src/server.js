import "dotenv/config";

import app from "./app.js";

import connectDatabase from "../config/database.js";

import {
  refreshScheduler
} from "./services/scheduler.service.js";

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  /*
   * Load all currently published,
   * enabled schedules after the database
   * connection is ready.
   */
  await refreshScheduler();

  app.listen(
    PORT,
    () => {
      console.log(
        `FlowForge API running on port ${PORT}`
      );
    }
  );
};

startServer().catch(
  (error) => {
    console.error(
      "Failed to start FlowForge:",
      error
    );

    process.exit(1);
  }
);