import "dotenv/config";
import app from "./app.js";
import connectDatabase from "../config/database.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`FlowForge API running on port ${PORT}`);
  });
};

startServer();